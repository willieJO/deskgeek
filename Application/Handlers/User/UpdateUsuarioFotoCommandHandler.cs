using deskgeek.Application.Commands;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers.Usuario
{
    public class UpdateUsuarioFotoCommandHandler : IRequestHandler<UpdateUsuarioFotoCommand, string>
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly UploadService _uploadService;

        public UpdateUsuarioFotoCommandHandler(IUsuarioRepository usuarioRepository, UploadService uploadService)
        {
            _usuarioRepository = usuarioRepository;
            _uploadService = uploadService;
        }

        public async Task<string> Handle(UpdateUsuarioFotoCommand request, CancellationToken cancellationToken)
        {
            if (request.Foto == null)
            {
                throw new InvalidOperationException("Arquivo de foto não informado.");
            }

            var usuario = await _usuarioRepository.GetByIdAsync(request.Id);
            if (usuario == null)
            {
                throw new KeyNotFoundException("Usuario não encontrado");
            }

            await using var ms = new MemoryStream();
            await request.Foto.CopyToAsync(ms, cancellationToken);
            var savedFileName = await _uploadService.UploadImageToServer(ms.ToArray(), request.Foto.FileName);

            await _usuarioRepository.AtualizarFotoPerfilAsync(request.Id, savedFileName);
            return savedFileName;
        }
    }
}
