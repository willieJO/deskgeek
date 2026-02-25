using deskgeek.Application.Commands;
using deskgeek.Repository;
using MediatR;

namespace deskgeek.Application.Handlers.Usuario
{
    public class UpdateUsuarioNomeCommandHandler : IRequestHandler<UpdateUsuarioNomeCommand, Guid>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UpdateUsuarioNomeCommandHandler(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<Guid> Handle(UpdateUsuarioNomeCommand request, CancellationToken cancellationToken)
        {
            var usuarioNormalizado = request.Usuario.Trim();
            await _usuarioRepository.AtualizarNomeAsync(request.Id, usuarioNormalizado);
            return request.Id;
        }
    }
}
