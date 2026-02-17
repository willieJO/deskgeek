using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class MediaDexQuery : IRequest<List<MediaDex>>
    {
        public Guid Id { get; set; }
    }
}
