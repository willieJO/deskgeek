using APIFinancia.Domain;
using MediatR;

namespace desksaveanime.Application.Queries
{
    public class MediaDexDeleteQuery : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}
