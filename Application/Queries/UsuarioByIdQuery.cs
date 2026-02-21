using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class UsuarioByIdQuery : IRequest<User?>
    {
        public Guid Id { get; set; }
    }

}
