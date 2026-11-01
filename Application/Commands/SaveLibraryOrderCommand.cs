using MediatR;

namespace deskgeek.Application.Commands;

public sealed class SaveLibraryOrderCommand : IRequest<List<LibraryOrderItem>>
{
    public Guid UserId { get; set; }
    public List<Guid>? MediaIds { get; set; }
}

public sealed record LibraryOrderItem(Guid Id, int? OrdemPersonalizada);
