using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Repository;
using MediatR;

namespace deskgeek.Application.Handlers.Usuario
{
    public class BuscarUsuarioQueryHandler : IRequestHandler<BuscarUsuarioQuery, List<UsuarioResumo>>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public BuscarUsuarioQueryHandler(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<List<UsuarioResumo>> Handle(BuscarUsuarioQuery request, CancellationToken cancellationToken)
        {
            return await _usuarioRepository.BuscarPorUsuarioAsync(request.Termo, request.Limite);
        }
    }
}
