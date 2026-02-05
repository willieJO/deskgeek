using MediatR;

namespace APIFinancia.Application.Notification
{
    public class UserCriadaNotification : INotification
    {
        public Guid Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Senha { get; set; }
    }
}
