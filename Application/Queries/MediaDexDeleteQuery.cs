using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class MediaDexDeleteQuery : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}
