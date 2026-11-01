using deskgeek.Application.Queries;
using deskgeek.Application.Commands;
using FluentValidation;
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
    public async Task SalvarOrdem_UsesAuthenticatedAccountInsteadOfBody()
    {
        var userId = Guid.NewGuid();
        var command = new SaveLibraryOrderCommand { UserId = Guid.NewGuid(), MediaIds = [Guid.NewGuid()] };
        var mediator = new Mock<IMediator>();
        mediator.Setup(x => x.Send(It.Is<SaveLibraryOrderCommand>(x => x.UserId == userId), It.IsAny<CancellationToken>())).ReturnsAsync(new List<LibraryOrderItem>());
        var controller = BuildController(mediator.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = BuildHttpContextWithUser(userId) };
        Assert.IsType<OkObjectResult>(await controller.SalvarOrdem(command));
        Assert.Equal(userId, command.UserId);
        mediator.VerifyAll();
    }

    [Fact]
    public async Task SalvarOrdem_ValidationMessageWithoutFailuresReturnsBadRequest()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(x => x.Send(It.IsAny<SaveLibraryOrderCommand>(), It.IsAny<CancellationToken>())).ThrowsAsync(new ValidationException("Biblioteca inválida."));
        var controller = BuildController(mediator.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = BuildHttpContextWithUser() };
        var result = Assert.IsType<BadRequestObjectResult>(await controller.SalvarOrdem(new SaveLibraryOrderCommand()));
        Assert.Equal("Biblioteca inválida.", result.Value!.GetType().GetProperty("message")!.GetValue(result.Value));
    }

    [Fact]
    public async Task ObterMediaDetalhePorId_ShouldReturnOk_WhenMediaBelongsToAuthenticatedUser()
    {
        var mediaId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(
                It.Is<MediaDexByIdQuery>(q => q.Id == mediaId && q.UserId == userId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MediaDex
            {
                Id = mediaId,
                UserId = userId,
                Nome = "Steins;Gate",
                TipoMidia = "Anime",
                Status = "Em andamento",
                DiaNovoCapitulo = "Sexta-feira",
                TotalCapitulos = "24",
                CapituloAtual = "8",
                imagemUrl = "https://example.com/image.jpg",
                UrlMidia = "https://example.com/watch"
            });

        var controller = BuildController(mediatorMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = BuildHttpContextWithUser(userId)
        };

        var result = await controller.ObterMediaDetalhePorId(mediaId);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        Assert.NotNull(okResult.Value!.GetType().GetProperty("UrlMidia"));
        Assert.NotNull(okResult.Value!.GetType().GetProperty("CapituloEsperadoAtual"));
    }

    [Fact]
    public async Task ObterMediaDetalhePorId_ShouldReturnNotFound_WhenMediaDoesNotBelongToAuthenticatedUser()
    {
        var mediaId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(m => m.Send(It.IsAny<MediaDexByIdQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MediaDex?)null);

        var controller = BuildController(mediatorMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = BuildHttpContextWithUser(userId)
        };

        var result = await controller.ObterMediaDetalhePorId(mediaId);

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFoundResult.Value);
    }

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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task EditMultipart_DistinguishesMissingImageUrlFromExplicitClearing(bool provided)
    {
        var mediator = new Mock<IMediator>();
        deskgeek.Application.Commands.EditMediaCommand? captured = null;
        mediator.Setup(x => x.Send(It.IsAny<deskgeek.Application.Commands.EditMediaCommand>(), It.IsAny<CancellationToken>()))
            .Callback<IRequest<Guid?>, CancellationToken>((command, _) => captured = (deskgeek.Application.Commands.EditMediaCommand)command)
            .ReturnsAsync(Guid.NewGuid());
        var controller = BuildController(mediator.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = BuildHttpContextWithUser() };
        controller.Request.ContentType = "multipart/form-data";
        var fields = new Dictionary<string, Microsoft.Extensions.Primitives.StringValues> { ["nome"] = "Capa de teste" };
        if (provided) fields["imagemUrl"] = "";
        controller.Request.Form = new FormCollection(fields);
        Assert.IsType<OkObjectResult>(await controller.EditarMedia(Guid.NewGuid()));
        Assert.NotNull(captured);
        Assert.Equal(provided ? "" : null, captured.imagemUrl);
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
        return BuildHttpContextWithUser(Guid.NewGuid());
    }

    private static HttpContext BuildHttpContextWithUser(Guid userId)
    {
        var httpContext = new DefaultHttpContext();
        var identity = new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            },
            "TestAuth");

        httpContext.User = new ClaimsPrincipal(identity);
        return httpContext;
    }
}
