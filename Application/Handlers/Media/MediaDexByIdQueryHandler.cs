using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Repository;
using MediatR;

namespace deskgeek.Application.Handlers.Media
{
    public class MediaDexByIdQueryHandler : IRequestHandler<MediaDexByIdQuery, MediaDex?>
    {
        private readonly MediaRepository _repository;

        public MediaDexByIdQueryHandler(MediaRepository repository)
        {
            _repository = repository;
        }

        public async Task<MediaDex?> Handle(MediaDexByIdQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetByIdAndUserIdAsync(request.Id, request.UserId);
        }
    }
}
