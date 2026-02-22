using deskgeek.Application.Queries;
using deskgeek.Presentation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Moq;
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

    private static UsuarioController BuildController(IMediator mediator, string environmentName)
    {
        var controller = new UsuarioController(mediator, new TestHostEnvironment(environmentName))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        return controller;
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "deskgeek.Backend.Tests";
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
