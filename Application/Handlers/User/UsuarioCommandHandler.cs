using deskgeek.Application.Commands;
using deskgeek.Application.Notification;
using deskgeek.Domain;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers
{
    public class UsuarioCommandHandler : IRequestHandler<UsuarioCommand, Guid>
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMediator _mediator;

        public UsuarioCommandHandler(IUsuarioRepository usuarioRepository, IMediator mediator)
        {
            _usuarioRepository = usuarioRepository;
            _mediator = mediator;
        }

        public async Task<Guid> Handle(UsuarioCommand request, CancellationToken cancellationToken)
        {
            var usuario = new Domain.User
            {
                Name = request.Nome,
                Email = request.Email,
                Senha = request.Senha.HashPassword()
            };
            await _usuarioRepository.AddAsync(usuario);
            await _mediator.Publish(new UserCriadaNotification { Id = usuario.Id, Nome = usuario.Name });
            return usuario.Id;
        }
    }
}
