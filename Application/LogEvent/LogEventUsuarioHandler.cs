using APIFinancia.Application.Notification;
using MediatR;

namespace APIFinancia.Application.LogEvent
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
