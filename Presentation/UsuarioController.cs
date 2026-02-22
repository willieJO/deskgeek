using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using deskgeek.Domain;
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
        public UsuarioController(IMediator mediator, IHostEnvironment hostEnvironment)
        {
            _mediator = mediator;
            _hostEnvironment = hostEnvironment;
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
        public IActionResult Me()
        {
            return Ok(new
            {
                success = true,
                id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                email = User.FindFirst(ClaimTypes.Email)?.Value
            });
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
            // Remove cookie em múltiplos paths legados para evitar sessão "fantasma" após F5.
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
    }
}
