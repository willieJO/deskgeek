using deskgeek.Application.Notification;
using MediatR;

namespace deskgeek.Application.LogEvent
{
    public class LogEventUsuarioHandler : INotificationHandler<UserCriadaNotification>
    {
        public Task Handle(UserCriadaNotification notification, CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                Console.WriteLine($"CRIACAO: '{notification.Id} - {notification.Nome}");
            });
        }
    }
}
