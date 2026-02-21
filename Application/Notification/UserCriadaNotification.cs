using MediatR;

namespace deskgeek.Application.Notification
{
    public class UserCriadaNotification : INotification
    {
        public Guid Id { get; set; }
        public string Usuario { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }
}
