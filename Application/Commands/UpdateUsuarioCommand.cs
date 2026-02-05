using MediatR;

namespace APIFinancia.Application.Commands
{
    public class UpdateUsuarioCommand : IRequest<Guid>
    {
        public Guid Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Senha { get; set; }

    }
}
