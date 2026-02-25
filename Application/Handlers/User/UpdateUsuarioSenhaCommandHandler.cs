using deskgeek.Application.Commands;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers.Usuario
{
    public class UpdateUsuarioSenhaCommandHandler : IRequestHandler<UpdateUsuarioSenhaCommand, Guid>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UpdateUsuarioSenhaCommandHandler(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<Guid> Handle(UpdateUsuarioSenhaCommand request, CancellationToken cancellationToken)
        {
            var usuario = await _usuarioRepository.GetByIdAsync(request.Id);
            if (usuario == null)
            {
                throw new KeyNotFoundException("Usuario não encontrado");
            }

            if (!request.SenhaAtual.VerifyPassword(usuario.Senha))
            {
                throw new InvalidOperationException("Senha atual inválida.");
            }

            var novaSenhaHash = request.NovaSenha.HashPassword();
            await _usuarioRepository.AtualizarSenhaAsync(request.Id, novaSenhaHash);
            return request.Id;
        }
    }
}
