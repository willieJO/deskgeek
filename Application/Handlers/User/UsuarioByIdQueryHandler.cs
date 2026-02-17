using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Repository;
using MediatR;

namespace deskgeek.Application.Handlers.Usuario
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
