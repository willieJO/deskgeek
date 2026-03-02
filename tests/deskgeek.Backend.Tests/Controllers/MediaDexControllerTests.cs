using deskgeek.Application.Queries;
using deskgeek.Application.Services;
using deskgeek.Domain;
using deskgeek.Presentation;
using deskgeek.Shared;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using Xunit;

namespace deskgeek.Backend.Tests.Controllers;

public class MediaDexControllerTests
{
    [Fact]
    public async Task ObterMediaPorUsuarioPorStatusEmAndamento_ShouldNotExposeUrlMidia()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<MediaDexEmAndamentoQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MediaDex>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    Nome = "One Piece",
                    Status = "Em andamento",
                    DiaNovoCapitulo = "Domingo",
                    imagemUrl = "https://example.com/capa.jpg",
                    UrlMidia = "https://example.com/watch"
                }
            });

        var controller = BuildController(mediatorMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = BuildHttpContextWithUser()
        };

        var result = await controller.ObterMediaPorUsuarioPorStatusEmAndamento();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        var firstItem = Assert.Single(payload);

        Assert.Null(firstItem.GetType().GetProperty("UrlMidia"));
        Assert.NotNull(firstItem.GetType().GetProperty("imagemUrl"));
    }

    [Fact]
    public async Task ObterMediaPorUsuarioPorStatusEmAndamento_ShouldSkipItem_WhenTotalCapitulosFoiAtingido()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<MediaDexEmAndamentoQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MediaDex>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    Nome = "Mini serie",
                    Status = "Em andamento",
                    DiaNovoCapitulo = "Domingo",
                    CapituloAtual = "10",
                    TotalCapitulos = "10",
                    CapituloEsperadoBase = 10,
                    CapituloEsperadoReferenciaUtc = DateTimeOffset.UtcNow.AddDays(-14)
                }
            });

        var controller = BuildController(mediatorMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = BuildHttpContextWithUser()
        };

        var result = await controller.ObterMediaPorUsuarioPorStatusEmAndamento();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Empty(payload);
    }

    private static MediaDexController BuildController(IMediator mediator)
    {
        var uploadService = new UploadService(
            Options.Create(new SshSettings()),
            Options.Create(new StorageSettings { Provider = "Local" })
        );

        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        httpClientFactoryMock.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(new HttpClient());

        var progressionService = new MediaProgressionService(TimeProvider.System);

        return new MediaDexController(mediator, uploadService, httpClientFactoryMock.Object, progressionService);
    }

    private static HttpContext BuildHttpContextWithUser()
    {
        var httpContext = new DefaultHttpContext();
        var identity = new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            },
            "TestAuth");

        httpContext.User = new ClaimsPrincipal(identity);
        return httpContext;
    }
}
