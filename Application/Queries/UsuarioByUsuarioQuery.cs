using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class UsuarioByUsuarioQuery : IRequest<User?>
    {
        public string Usuario { get; set; } = string.Empty;
    }
}
