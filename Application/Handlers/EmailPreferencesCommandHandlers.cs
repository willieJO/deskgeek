using deskgeek.Application.Commands;
using deskgeek.Infra;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace deskgeek.Application.Handlers;

public sealed class UpdateUsuarioEmailsCommandHandler(AppDbContext db) : IRequestHandler<UpdateUsuarioEmailsCommand, bool>
{
    public async Task<bool> Handle(UpdateUsuarioEmailsCommand command, CancellationToken cancellationToken)
    {
        var user = await db.Usuarios.SingleOrDefaultAsync(x => x.Id == command.Id, cancellationToken) ?? throw new KeyNotFoundException("Usuário não encontrado.");
        user.ReceberEmailsLancamentos = command.ReceberEmailsLancamentos ?? throw new InvalidOperationException("Preferência não informada.");
        await db.SaveChangesAsync(cancellationToken);
        return user.ReceberEmailsLancamentos;
    }
}

public sealed class UpdateMediaEmailsCommandHandler(AppDbContext db) : IRequestHandler<UpdateMediaEmailsCommand, bool?>
{
    public async Task<bool?> Handle(UpdateMediaEmailsCommand command, CancellationToken cancellationToken)
    {
        var media = await db.MediaDex.SingleOrDefaultAsync(x => x.Id == command.MediaId && x.UserId == command.UserId, cancellationToken);
        if (media is null) return null;
        media.NotificarLancamentos = command.NotificarLancamentos ?? throw new InvalidOperationException("Preferência não informada.");
        await db.SaveChangesAsync(cancellationToken);
        return media.NotificarLancamentos;
    }
}
