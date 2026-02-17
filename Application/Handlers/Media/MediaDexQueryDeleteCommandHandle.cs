using deskgeek.Domain;
using deskgeek.Repository;
using AutoMapper;
using deskgeek.Application.Queries;
using MediatR;

namespace deskgeek.Application.Handlers.Media
{
    public class MediaDexQueryDeleteCommandHandle : IRequestHandler<MediaDexDeleteQuery, bool>
    {

        private readonly MediaRepository _repository;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        public MediaDexQueryDeleteCommandHandle(MediaRepository repository, IMediator mediator, IMapper mapper)
        {
            _repository = repository;
            _mediator = mediator;
            _mapper = mapper;
        }

        public async Task<bool> Handle(MediaDexDeleteQuery request, CancellationToken cancellationToken)
        {
            try
            {
                await _repository.DeleteAsync(request.Id);
                return true;    
            } catch(Exception ex) {
                throw ex;
            }
        }
    }
}
