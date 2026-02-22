using deskgeek.Application.Commands;
using deskgeek.Application.Handlers;
using deskgeek.Application.Notification;
using deskgeek.Domain;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;
using Moq;
using Xunit;

namespace deskgeek.Backend.Tests.Handlers;

public class UsuarioCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldTrimAndHashPassword_AndPublishNotification()
    {
        var repositoryMock = new Mock<IUsuarioRepository>();
        var mediatorMock = new Mock<IMediator>();
        User? capturedUser = null;

        repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => capturedUser = user)
            .Returns(Task.CompletedTask);

        mediatorMock
            .Setup(m => m.Publish(It.IsAny<UserCriadaNotification>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = new UsuarioCommandHandler(repositoryMock.Object, mediatorMock.Object);
        var command = new UsuarioCommand
        {
            Usuario = "  usuario_teste  ",
            Email = "  user@test.com  ",
            Senha = "SenhaSuperSecreta123"
        };

        var id = await handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, id);
        Assert.NotNull(capturedUser);
        Assert.Equal("usuario_teste", capturedUser!.Usuario);
        Assert.Equal("user@test.com", capturedUser.Email);
        Assert.NotEqual(command.Senha, capturedUser.Senha);
        Assert.True(command.Senha.VerifyPassword(capturedUser.Senha));

        repositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
        mediatorMock.Verify(
            m => m.Publish(It.IsAny<UserCriadaNotification>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }
}
