using deskgeek.Domain;
using deskgeek.Repository;
using AutoMapper;
using deskgeek.Application.Queries;
using MediatR;

namespace deskgeek.Application.Handlers.Media
{
    public class MediaDexEmAndamentoQueryHandler : IRequestHandler<MediaDexEmAndamentoQuery, List<MediaDex>>
    {
        private readonly MediaRepository _repository;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public MediaDexEmAndamentoQueryHandler(MediaRepository repository, IMediator mediator, IMapper mapper)
        {
            _repository = repository;
            _mediator = mediator;
            _mapper = mapper;
        }

        public async Task<List<MediaDex>> Handle(MediaDexEmAndamentoQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAllByIdEmAndamento(request.Id);
        }
    }
}
