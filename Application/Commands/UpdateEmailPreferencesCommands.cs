using MediatR;

namespace deskgeek.Application.Commands;

public sealed class UpdateUsuarioEmailsCommand : IRequest<bool>
{
    public Guid Id { get; set; }
    public bool? ReceberEmailsLancamentos { get; set; }
}

public sealed class UpdateMediaEmailsCommand : IRequest<bool?>
{
    public Guid UserId { get; set; }
    public Guid MediaId { get; set; }
    public bool? NotificarLancamentos { get; set; }
}
