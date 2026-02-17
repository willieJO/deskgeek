using deskgeek.Application.Commands;
using deskgeek.Domain;
using deskgeek.Repository;
using AutoMapper;
using deskgeek.Application.Commands;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers.Media
{
    public class EditMediaCommandHandler : IRequestHandler<EditMediaCommand, Guid?>
    {
        private readonly MediaRepository _repository;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        private readonly UploadService _uploadService;
        public EditMediaCommandHandler(MediaRepository repository, IMediator mediator, IMapper mapper, UploadService uploadService)
        {
            _repository = repository;
            _mediator = mediator;
            _mapper = mapper;
            _uploadService = uploadService;
        }

        public async Task<Guid?> Handle(EditMediaCommand request, CancellationToken cancellationToken)
        {
            try {
                var objMedia = _mapper.Map<MediaDex>(request);
                if (request.ImagemUpload != null && request.ImagemUpload.Length > 0)
                {
                    byte[] imageBytes;
                    using (var ms = new MemoryStream())
                    {
                        await request.ImagemUpload.CopyToAsync(ms);
                        imageBytes = ms.ToArray();
                    }
                    var savedFileName = await _uploadService.UploadImageToServer(imageBytes, request.ImagemUpload.FileName);
                    objMedia.ImagemDirectory = savedFileName;
                }
                await _repository.UpdateAsync(objMedia);
                return objMedia.Id;
            }
            catch (Exception e)
            {
                throw e;
            }
        }

    }
}
