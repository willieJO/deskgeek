using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class UsuarioQuery : IRequest<List<User>>
    {
    }
}
