using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Shared;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace deskgeek.Presentation
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private const string AuthCookieName = "AuthToken";
        private readonly IMediator _mediator;
        private readonly IHostEnvironment _hostEnvironment;
        private readonly UploadService _uploadService;

        public UsuarioController(IMediator mediator, IHostEnvironment hostEnvironment, UploadService uploadService)
        {
            _mediator = mediator;
            _hostEnvironment = hostEnvironment;
            _uploadService = uploadService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> CriarUsuario([FromBody] UsuarioCommand command)
        {
            try
            {
                var usuarioId = await _mediator.Send(command);
                return Ok(new { Id = usuarioId });
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

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var usuario = await _mediator.Send(new UsuarioByIdQuery { Id = userId.Value });
            if (usuario == null)
            {
                return Unauthorized();
            }

            return Ok(new
            {
                success = true,
                id = usuario.Id,
                email = usuario.Email,
                usuario = usuario.Usuario,
                fotoPerfilDisponivel = !string.IsNullOrWhiteSpace(usuario.FotoPerfilArquivo)
            });
        }

        [Authorize]
        [HttpPut("me/nome")]
        public async Task<IActionResult> AtualizarMeuNome([FromBody] UpdateUsuarioNomeCommand command)
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                command.Id = userId.Value;
                await _mediator.Send(command);

                return Ok(new
                {
                    success = true,
                    id = userId.Value,
                    usuario = command.Usuario.Trim()
                });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Errors.Select(e => e.ErrorMessage).FirstOrDefault()
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Usuário não encontrado." });
            }
        }

        [Authorize]
        [HttpPut("me/senha")]
        public async Task<IActionResult> AtualizarMinhaSenha([FromBody] UpdateUsuarioSenhaCommand command)
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                command.Id = userId.Value;
                await _mediator.Send(command);

                return Ok(new
                {
                    success = true,
                    message = "Senha atualizada com sucesso."
                });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Errors.Select(e => e.ErrorMessage).FirstOrDefault()
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Usuário não encontrado." });
            }
        }

        [Authorize]
        [HttpPut("me/foto")]
        public async Task<IActionResult> AtualizarMinhaFoto([FromForm] UpdateUsuarioFotoCommand command)
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                command.Id = userId.Value;
                await _mediator.Send(command);

                return Ok(new
                {
                    success = true,
                    message = "Foto de perfil atualizada com sucesso."
                });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Errors.Select(e => e.ErrorMessage).FirstOrDefault()
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Usuário não encontrado." });
            }
        }

        [Authorize]
        [HttpGet("me/foto")]
        public async Task<IActionResult> ObterMinhaFoto()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var usuario = await _mediator.Send(new UsuarioByIdQuery { Id = userId.Value });
            if (usuario == null)
            {
                return NotFound(new { success = false, message = "Usuário não encontrado." });
            }

            return BuildPhotoResponse(usuario);
        }

        [Authorize]
        [HttpGet("foto/{id:guid}")]
        public async Task<IActionResult> ObterFotoUsuario(Guid id)
        {
            var usuario = await _mediator.Send(new UsuarioByIdQuery { Id = id });
            if (usuario == null)
            {
                return NotFound(new { success = false, message = "Usuário não encontrado." });
            }

            return BuildPhotoResponse(usuario);
        }

        private IActionResult BuildPhotoResponse(User usuario)
        {
            if (string.IsNullOrWhiteSpace(usuario.FotoPerfilArquivo))
            {
                return NotFound();
            }

            var caminhoLocal = _uploadService.BaixarArquivoRemoto(usuario.FotoPerfilArquivo);
            if (caminhoLocal == null || !System.IO.File.Exists(caminhoLocal))
            {
                return NotFound();
            }

            byte[] bytes = System.IO.File.ReadAllBytes(caminhoLocal);
            try { System.IO.File.Delete(caminhoLocal); } catch { }

            return File(bytes, GetImageContentType(usuario.FotoPerfilArquivo!));
        }

        [HttpPost("login")]
        public async Task<IActionResult> CriarUsuario([FromBody] LoginQuery command)
        {
            try
            {
                var usuarioId = await _mediator.Send(command);
                if (usuarioId == "0")
                {
                    return BadRequest(new { success = false, message = "Email ou senha inválidos" });
                }

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuarioId.ToString()),
                    new Claim(ClaimTypes.Email, command.Email)
                };

                var secretKey = "sua_chave_super_secreta_aqui_123";
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: null,
                    audience: null,
                    claims: claims,
                    expires: DateTime.UtcNow.AddDays(7),
                    signingCredentials: creds
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                var secureCookie = !_hostEnvironment.IsEnvironment("E2E");

                Response.Cookies.Append(AuthCookieName, tokenString, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = secureCookie,
                    SameSite = SameSiteMode.Strict,
                    Path = "/",
                    Expires = DateTime.UtcNow.AddDays(7)
                });

                return Ok(new
                {
                    success = true,
                    message = "Login realizado com sucesso"
                });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Errors.Select(e => e.ErrorMessage).FirstOrDefault()
                });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var cookiePaths = new[] { "/", "/api", "/api/usuario", "/api/Usuario" };
            var secureOptions = new[] { true, false };
            foreach (var path in cookiePaths)
            {
                foreach (var secure in secureOptions)
                {
                    Response.Cookies.Delete(AuthCookieName, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = secure,
                        SameSite = SameSiteMode.Strict,
                        Path = path
                    });
                }
            }

            return Ok(new { success = true });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarUsuario(Guid id, [FromBody] UpdateUsuarioCommand command)
        {
            try
            {
                var usuarioId = await _mediator.Send(command);
                return Ok(new { Id = usuarioId });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllUsuarios()
        {
            var usuarios = await _mediator.Send(new UsuarioQuery());
            return Ok(usuarios);
        }

        [HttpGet("buscar")]
        [Authorize]
        public async Task<IActionResult> BuscarUsuarios([FromQuery] string termo, [FromQuery] int limite = 10)
        {
            var termoNormalizado = (termo ?? string.Empty).Trim();
            if (termoNormalizado.Length < 2)
            {
                return Ok(new List<UsuarioResumo>());
            }

            var usuarios = await _mediator.Send(new BuscarUsuarioQuery
            {
                Termo = termoNormalizado,
                Limite = limite
            });

            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUsuarioById(Guid id)
        {
            var usuario = await _mediator.Send(new UsuarioByIdQuery { Id = id });
            if (usuario == null)
            {
                return NotFound();
            }

            return Ok(usuario);
        }

        private Guid? GetAuthenticatedUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userId, out var guid))
            {
                return null;
            }

            return guid;
        }

        private static string GetImageContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "image/jpeg"
            };
        }
    }
}
