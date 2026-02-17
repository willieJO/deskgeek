using deskgeek.Application.Queries;
using MediatR;
using deskgeek.Domain;
using deskgeek.Repository;
namespace deskgeek.Application.Handlers.Usuario
{
    public class UsuarioQueryHandler : IRequestHandler<UsuarioQuery, List<Domain.User>>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioQueryHandler(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<List<Domain.User>> Handle(UsuarioQuery request, CancellationToken cancellationToken)
        {
            return await _usuarioRepository.GetAll();
        }
    }
}
