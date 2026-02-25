using MediatR;

namespace deskgeek.Application.Commands
{
    public class UpdateUsuarioSenhaCommand : IRequest<Guid>
    {
        public Guid Id { get; set; }
        public string SenhaAtual { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}
