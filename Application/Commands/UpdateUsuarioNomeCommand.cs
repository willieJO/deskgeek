using MediatR;

namespace deskgeek.Application.Commands
{
    public class UpdateUsuarioNomeCommand : IRequest<Guid>
    {
        public Guid Id { get; set; }
        public string Usuario { get; set; } = string.Empty;
    }
}
