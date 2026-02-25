using deskgeek.Application.Commands;
using deskgeek.Application.Handlers.Usuario;
using deskgeek.Domain;
using deskgeek.Repository;
using deskgeek.Shared;
using Moq;
using Xunit;

namespace deskgeek.Backend.Tests.Handlers;

public class UpdateUsuarioSenhaCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldThrow_WhenCurrentPasswordIsInvalid()
    {
        var repositoryMock = new Mock<IUsuarioRepository>();
        repositoryMock
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync(new User
            {
                Id = Guid.NewGuid(),
                Usuario = "willi",
                Email = "user@test.com",
                Senha = "123456".HashPassword()
            });

        var handler = new UpdateUsuarioSenhaCommandHandler(repositoryMock.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new UpdateUsuarioSenhaCommand
            {
                Id = Guid.NewGuid(),
                SenhaAtual = "senha_errada",
                NovaSenha = "654321"
            }, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldPersistHashedNewPassword_WhenCurrentPasswordIsValid()
    {
        var userId = Guid.NewGuid();
        string? senhaPersistida = null;

        var repositoryMock = new Mock<IUsuarioRepository>();
        repositoryMock
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(new User
            {
                Id = userId,
                Usuario = "willi",
                Email = "user@test.com",
                Senha = "123456".HashPassword()
            });
        repositoryMock
            .Setup(x => x.AtualizarSenhaAsync(userId, It.IsAny<string>()))
            .Callback<Guid, string>((_, hash) => senhaPersistida = hash)
            .Returns(Task.CompletedTask);

        var handler = new UpdateUsuarioSenhaCommandHandler(repositoryMock.Object);
        var command = new UpdateUsuarioSenhaCommand
        {
            Id = userId,
            SenhaAtual = "123456",
            NovaSenha = "abcdef"
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(userId, result);
        Assert.NotNull(senhaPersistida);
        Assert.NotEqual("abcdef", senhaPersistida);
        Assert.True("abcdef".VerifyPassword(senhaPersistida!));
    }
}
