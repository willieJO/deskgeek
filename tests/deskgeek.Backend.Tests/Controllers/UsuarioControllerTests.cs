using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Presentation;
using deskgeek.Shared;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using Xunit;

namespace deskgeek.Backend.Tests.Controllers;

public class UsuarioControllerTests
{
    [Fact]
    public async Task Login_ShouldReturnBadRequest_WhenCredentialsAreInvalid()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<LoginQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("0");

        var controller = BuildController(mediatorMock.Object, "Development");
        var result = await controller.CriarUsuario(new LoginQuery
        {
            Email = "user@test.com",
            Password = "senhaErrada"
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequest.StatusCode);
    }

    [Fact]
    public async Task Login_ShouldSetCookieWithoutSecure_WhenEnvironmentIsE2E()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<LoginQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Guid.NewGuid().ToString());

        var controller = BuildController(mediatorMock.Object, "E2E");
        var result = await controller.CriarUsuario(new LoginQuery
        {
            Email = "user@test.com",
            Password = "123456"
        });

        Assert.IsType<OkObjectResult>(result);
        var setCookie = controller.Response.Headers.SetCookie.ToString();
        Assert.Contains("AuthToken=", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("secure", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_ShouldSetCookieWithSecure_WhenEnvironmentIsNotE2E()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<LoginQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Guid.NewGuid().ToString());

        var controller = BuildController(mediatorMock.Object, "Production");
        var result = await controller.CriarUsuario(new LoginQuery
        {
            Email = "user@test.com",
            Password = "123456"
        });

        Assert.IsType<OkObjectResult>(result);
        var setCookie = controller.Response.Headers.SetCookie.ToString();
        Assert.Contains("AuthToken=", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("secure", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Me_ShouldReturnExpandedPayload_WhenSessionIsValid()
    {
        var userId = Guid.NewGuid();
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<UsuarioByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                Email = "user@test.com",
                Usuario = "willi",
                Senha = "hash",
                FotoPerfilArquivo = "avatar.png"
            });

        var controller = BuildController(mediatorMock.Object, "Development");
        controller.ControllerContext = new ControllerContext { HttpContext = BuildHttpContextWithUser(userId) };

        var result = await controller.Me();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
        var payload = ok.Value!;
        Assert.Equal("willi", payload.GetType().GetProperty("usuario")?.GetValue(payload)?.ToString());
        Assert.Equal(true, payload.GetType().GetProperty("fotoPerfilDisponivel")?.GetValue(payload));
    }

    [Fact]
    public async Task AtualizarMinhaSenha_ShouldReturnBadRequest_WhenHandlerRejectsCurrentPassword()
    {
        var userId = Guid.NewGuid();
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<UpdateUsuarioSenhaCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Senha atual inválida."));

        var controller = BuildController(mediatorMock.Object, "Development");
        controller.ControllerContext = new ControllerContext { HttpContext = BuildHttpContextWithUser(userId) };

        var result = await controller.AtualizarMinhaSenha(new UpdateUsuarioSenhaCommand
        {
            SenhaAtual = "x",
            NovaSenha = "123456"
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequest.StatusCode);
    }

    [Fact]
    public async Task ObterMinhaFoto_ShouldReturnNotFound_WhenUserHasNoPhoto()
    {
        var userId = Guid.NewGuid();
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<UsuarioByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                Email = "user@test.com",
                Usuario = "willi",
                Senha = "hash",
                FotoPerfilArquivo = null
            });

        var controller = BuildController(mediatorMock.Object, "Development");
        controller.ControllerContext = new ControllerContext { HttpContext = BuildHttpContextWithUser(userId) };

        var result = await controller.ObterMinhaFoto();

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task BuscarUsuarios_ShouldReturnEmptyList_WhenTermHasLessThan2Chars()
    {
        var mediatorMock = new Mock<IMediator>();
        var controller = BuildController(mediatorMock.Object, "Development");

        var result = await controller.BuscarUsuarios("a", 8);

        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsType<List<UsuarioResumo>>(ok.Value);
        Assert.Empty(payload);
        mediatorMock.Verify(
            m => m.Send(It.IsAny<BuscarUsuarioQuery>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BuscarUsuarios_ShouldReturnResumoWithFotoPerfilDisponivel()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<BuscarUsuarioQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UsuarioResumo>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Usuario = "fulano",
                    FotoPerfilDisponivel = true
                }
            });

        var controller = BuildController(mediatorMock.Object, "Development");

        var result = await controller.BuscarUsuarios("fu", 8);

        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsType<List<UsuarioResumo>>(ok.Value);
        Assert.Single(payload);
        Assert.True(payload[0].FotoPerfilDisponivel);
    }

    [Fact]
    public async Task ObterFotoUsuario_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<UsuarioByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var controller = BuildController(mediatorMock.Object, "Development");

        var result = await controller.ObterFotoUsuario(Guid.NewGuid());

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task ObterFotoUsuario_ShouldReturnNotFound_WhenUserHasNoPhoto()
    {
        var userId = Guid.NewGuid();
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<UsuarioByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                Email = "user@test.com",
                Usuario = "willi",
                Senha = "hash",
                FotoPerfilArquivo = null
            });

        var controller = BuildController(mediatorMock.Object, "Development");

        var result = await controller.ObterFotoUsuario(userId);

        Assert.IsType<NotFoundResult>(result);
    }

    private static UsuarioController BuildController(IMediator mediator, string environmentName)
    {
        var controller = new UsuarioController(
            mediator,
            new TestHostEnvironment(environmentName),
            BuildUploadService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        return controller;
    }

    private static UploadService BuildUploadService()
    {
        return new UploadService(
            Options.Create(new SshSettings()),
            Options.Create(new StorageSettings { Provider = "Local" }));
    }

    private static HttpContext BuildHttpContextWithUser(Guid userId)
    {
        var httpContext = new DefaultHttpContext();
        var identity = new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, "user@test.com")
            },
            "TestAuth");

        httpContext.User = new ClaimsPrincipal(identity);
        return httpContext;
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "deskgeek.Backend.Tests";
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
