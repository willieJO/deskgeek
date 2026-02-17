using deskgeek.Application.Commands;
using deskgeek.Application.Notification;
using deskgeek.Domain;
using deskgeek.Repository;
using deskgeek.Shared;
using AutoMapper;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers
{
    public class CreateMediaCommandHandler : IRequestHandler<CreateMediaCommand, Guid?>
    {
        private readonly MediaRepository _repository;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        private readonly UploadService _uploadService;
        public CreateMediaCommandHandler(MediaRepository repository, IMediator mediator, IMapper mapper, UploadService uploadService)
        {
            _repository = repository;
            _mediator = mediator;
            _mapper = mapper;
            _uploadService = uploadService;
        }

        public async Task<Guid?> Handle(CreateMediaCommand request, CancellationToken cancellationToken)
        {
            string savedFileName = null;
            try
            {
                var objMedia = _mapper.Map<MediaDex>(request);

                if (request.ImagemUpload != null && request.ImagemUpload.Length > 0)
                {
                    byte[] imageBytes;
                    using (var ms = new MemoryStream())
                    {
                        await request.ImagemUpload.CopyToAsync(ms);
                        imageBytes = ms.ToArray();
                    }
                    savedFileName = await _uploadService.UploadImageToServer(imageBytes, request.ImagemUpload.FileName);
                    objMedia.ImagemDirectory = savedFileName;
                }

                await _repository.AddAsync(objMedia);
                return objMedia.Id;

            } catch (Exception e )
            {
                //await Upload.DeleteImageFromServer(savedFileName);
                throw e;
            }
            
            
        }
    }
}
