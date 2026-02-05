using APIFinancia.Domain;
using MediatR;

namespace APIFinancia.Application.Queries
{
    public class UsuarioQuery : IRequest<List<User>>
    {
    }
}
