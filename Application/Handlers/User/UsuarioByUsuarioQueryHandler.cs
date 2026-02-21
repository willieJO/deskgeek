using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Repository;
using MediatR;

namespace deskgeek.Application.Handlers.Usuario
{
    public class UsuarioByUsuarioQueryHandler : IRequestHandler<UsuarioByUsuarioQuery, User?>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioByUsuarioQueryHandler(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<User?> Handle(UsuarioByUsuarioQuery request, CancellationToken cancellationToken)
        {
            return await _usuarioRepository.GetByUsuarioAsync(request.Usuario);
        }
    }
}
