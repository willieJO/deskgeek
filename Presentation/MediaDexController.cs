using deskgeek.Application.Commands;
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
        public MediaDexController(IMediator mediator, UploadService uploadService)
        {
            _mediator = mediator;
            _uploadService = uploadService;
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
