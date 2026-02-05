using APIFinancia.Application.Queries;
using APIFinancia.Domain;
using APIFinancia.Repository;
using MediatR;

namespace APIFinancia.Application.Handlers.Usuario
{
    public class UsuarioByIdQueryHandler : IRequestHandler<UsuarioByIdQuery, Domain.User>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioByIdQueryHandler(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<Domain.User> Handle(UsuarioByIdQuery request, CancellationToken cancellationToken)
        {
            return await _usuarioRepository.GetByIdAsync(request.Id);
        }
    }

}
