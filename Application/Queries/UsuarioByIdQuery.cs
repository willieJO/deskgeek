using APIFinancia.Domain;
using MediatR;

namespace APIFinancia.Application.Queries
{
    public class UsuarioByIdQuery : IRequest<User>
    {
        public Guid Id { get; set; }
    }

}
