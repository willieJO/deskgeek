using APIFinancia.Application.Commands;
using APIFinancia.Domain;
using APIFinancia.Repository;
using AutoMapper;
using desksaveanime.Application.Queries;
using MediatR;

namespace desksaveanime.Application.Handlers.Media
{
    public class MediaDexQueryCommandHandle : IRequestHandler<MediaDexQuery, List<MediaDex>>
    {

        private readonly MediaRepository _repository;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        public MediaDexQueryCommandHandle(MediaRepository repository, IMediator mediator, IMapper mapper)
        {
            _repository = repository;
            _mediator = mediator;
            _mapper = mapper;
        }

        public async Task<List<MediaDex>> Handle(MediaDexQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAllById(request.Id);
        }
    }
}
