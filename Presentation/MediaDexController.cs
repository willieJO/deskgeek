using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using deskgeek.Shared;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace deskgeek.Presentation
{
    [Route("api/[controller]")]
    [ApiController]
    public class MediaDexController : ControllerBase

    {
        private readonly IMediator _mediator;
        private readonly UploadService _uploadService;
        private readonly IHttpClientFactory _httpClientFactory;
        public MediaDexController(IMediator mediator, UploadService uploadService, IHttpClientFactory httpClientFactory)
        {
            _mediator = mediator;
            _uploadService = uploadService;
            _httpClientFactory = httpClientFactory;
        }
        [HttpGet("obterMediaPorUsuario")]
        [Authorize]
        public async Task<IActionResult> ObterMediaPorUsuario()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var id = Guid.Parse(userId);
                var mediaDexList = await _mediator.Send(new MediaDexQuery { Id = id });
                return Ok(mediaDexList);
            }
            return Unauthorized();
        }

        [HttpGet("obterMediaPorUsuarioPorStatusEmAndamento")]
        [Authorize]
        public async Task<IActionResult> ObterMediaPorUsuarioPorStatusEmAndamento()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var id = Guid.Parse(userId);
                var mediaDexList = await _mediator.Send(new MediaDexEmAndamentoQuery { Id = id });
                return Ok(mediaDexList);
            }
            return Unauthorized();
        }

        [HttpGet("obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario")]
        [Authorize]
        public async Task<IActionResult> ObterMediaPorOutroUsuarioPorStatusEmAndamentoPorUsuario([FromQuery] string usuario)
        {
            var usuarioNormalizado = (usuario ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(usuarioNormalizado))
            {
                return BadRequest(new { message = "Parâmetro 'usuario' é obrigatório." });
            }

            var usuarioEncontrado = await _mediator.Send(new UsuarioByUsuarioQuery { Usuario = usuarioNormalizado });
            if (usuarioEncontrado == null)
            {
                return NotFound(new { message = "Usuário não encontrado." });
            }

            var mediaDexList = await _mediator.Send(new MediaDexEmAndamentoQuery { Id = usuarioEncontrado.Id });
            return Ok(mediaDexList);
        }



        [HttpGet("imagem/{nomeArquivo}")]
        public IActionResult GetImagem(string nomeArquivo)
        {
            var caminhoLocal = _uploadService.BaixarArquivoRemoto(nomeArquivo);
            if (caminhoLocal == null || !System.IO.File.Exists(caminhoLocal))
                return NotFound();

            byte[] bytes = System.IO.File.ReadAllBytes(caminhoLocal);

            try { System.IO.File.Delete(caminhoLocal); } catch { }

            var contentType = "image/jpeg";
            var ext = Path.GetExtension(nomeArquivo).ToLower();
            if (ext == ".png") contentType = "image/png";
            else if (ext == ".gif") contentType = "image/gif";

            return File(bytes, contentType);
        }

        [HttpGet("mangadex/search")]
        [AllowAnonymous]
        public async Task<IActionResult> BuscarManhuaMangaDex([FromQuery] string title, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return BadRequest(new { message = "Parâmetro 'title' é obrigatório." });
            }

            var query = string.Join("&", new[]
            {
                "limit=10",
                $"title={Uri.EscapeDataString(title)}",
                "contentRating[]=safe",
                "contentRating[]=suggestive",
                "contentRating[]=erotica",
                "contentRating[]=pornographic",
                "includes[]=cover_art",
                "availableTranslatedLanguage[]=en",
                "order[relevance]=desc"
            });

            var url = $"https://api.mangadex.org/manga?{query}";

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.UserAgent.ParseAdd("MediaDex/1.0");

                using var response = await client.GetAsync(url, cancellationToken);
                var payload = await response.Content.ReadAsStringAsync(cancellationToken);

                return new ContentResult
                {
                    StatusCode = (int)response.StatusCode,
                    ContentType = "application/json",
                    Content = payload
                };
            }
            catch
            {
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    message = "Falha ao consultar a API do MangaDex."
                });
            }
        }

        [HttpGet("mangadex/cover/{mangaId}/{fileName}")]
        [AllowAnonymous]
        public async Task<IActionResult> ObterCapaMangaDex(string mangaId, string fileName, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(mangaId) || string.IsNullOrWhiteSpace(fileName))
            {
                return BadRequest(new { message = "Parâmetros inválidos." });
            }

            var safeMangaId = Path.GetFileName(mangaId);
            var safeFileName = Path.GetFileName(fileName);
            if (safeMangaId != mangaId || safeFileName != fileName)
            {
                return BadRequest(new { message = "Parâmetros inválidos." });
            }

            var url =
                $"https://uploads.mangadex.org/covers/{Uri.EscapeDataString(safeMangaId)}/{Uri.EscapeDataString(safeFileName)}";

            try
            {
                var client = _httpClientFactory.CreateClient();
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.UserAgent.ParseAdd("MediaDex/1.0");

                using var response = await client.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode);
                }

                var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";

                Response.Headers.CacheControl = "public,max-age=21600";
                return File(bytes, contentType);
            }
            catch
            {
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    message = "Falha ao buscar capa no MangaDex."
                });
            }
        }

        [HttpPost("criar")]
        [Authorize]
        public async Task<IActionResult> CriarMedia([FromForm] CreateMediaCommand command)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId != null)
                {
                    command.Userid = Guid.Parse(userId);
                    var usuarioId = await _mediator.Send(command);
                    return Ok(new { Id = usuarioId });
                }
                return Unauthorized("Token invalido");
            }
            catch (ValidationException ex)
            {
                var validationErrors = ex.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage
                }).ToList();

                return BadRequest(validationErrors);
            }

        }
        [HttpPut("{guild}")]
        [Authorize]
        [Consumes("multipart/form-data", "application/json", "text/json")]
        public async Task<IActionResult> EditarMedia(Guid guild)
        {
            EditMediaCommand? command;

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                var imagemUrl = form["imagemUrl"].ToString();
                if (string.IsNullOrWhiteSpace(imagemUrl))
                {
                    imagemUrl = form["setUrlInput"].ToString();
                }

                command = new EditMediaCommand
                {
                    Nome = form["nome"].ToString(),
                    TotalCapitulos = form["totalCapitulos"].ToString(),
                    CapituloAtual = form["capituloAtual"].ToString(),
                    DiaNovoCapitulo = form["diaNovoCapitulo"].ToString(),
                    Status = form["status"].ToString(),
                    TipoMidia = form["tipoMidia"].ToString(),
                    ImagemUpload = form.Files.GetFile("ImagemUpload"),
                    ImagemDirectory = form["imagemDirectory"].ToString(),
                    imagemUrl = string.IsNullOrWhiteSpace(imagemUrl) ? null : imagemUrl
                };
            }
            else if (Request.ContentType?.Contains("json", StringComparison.OrdinalIgnoreCase) == true)
            {
                command = await JsonSerializer.DeserializeAsync<EditMediaCommand>(
                    Request.Body,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                    HttpContext.RequestAborted
                );
            }
            else
            {
                return StatusCode(StatusCodes.Status415UnsupportedMediaType, "Tipo de conteúdo não suportado.");
            }

            if (command == null)
            {
                return BadRequest("Payload inválido.");
            }

            return await EditarMediaInternal(guild, command);
        }

        private async Task<IActionResult> EditarMediaInternal(Guid guild, EditMediaCommand command)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId != null)
                {
                    command.Userid = Guid.Parse(userId);
                    command.Id = guild;
                    var usuarioId = await _mediator.Send(command);
                    return Ok(new { Id = usuarioId });
                }
                return Unauthorized("Token invalido");
            }
            catch (ValidationException ex)
            {
                var validationErrors = ex.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage
                }).ToList();

                return BadRequest(validationErrors);
            }
        }
        [HttpDelete("{guild}")]
        [Authorize]
        public async Task<IActionResult> DeleteMedia(Guid guild)
        {
            try
            {
                
                var retorno = await _mediator.Send(new MediaDexDeleteQuery { Id = guild });
                return Ok(retorno);
            } catch (Exception ex)
            {
                return BadRequest("Erro interno");
            }
        }

    }
}
