using APIFinancia.Domain;
using APIFinancia.Repository;
using AutoMapper;
using desksaveanime.Application.Queries;
using MediatR;

namespace desksaveanime.Application.Handlers.Media
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
