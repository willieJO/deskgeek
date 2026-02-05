using APIFinancia.Application.Commands;
using APIFinancia.Domain;
using APIFinancia.Repository;
using APIFinancia.Shared;
using MediatR;

namespace APIFinancia.Application.Handlers.Usuario
{
    public class UsuarioUpdateCommand : IRequestHandler<UpdateUsuarioCommand, Guid>
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioUpdateCommand(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<Guid> Handle(UpdateUsuarioCommand request, CancellationToken cancellationToken)
        {
            var usuario = new Domain.User
            {
                Id = request.Id,
                Name = request.Nome,
                Email = request.Email,
                Senha = request.Senha.HashPassword()
            };

            await _usuarioRepository.UpdateAsync(usuario);

            return usuario.Id;
        }
    }
}
