using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class MediaDexByIdQuery : IRequest<MediaDex?>
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
    }
}
