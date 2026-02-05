using APIFinancia.Domain;
using MediatR;

namespace desksaveanime.Application.Queries
{
    public class MediaDexEmAndamentoQuery : IRequest<List<MediaDex>>
    {
        public Guid Id { get; set; } 
    }
}
