using deskgeek.Application.Commands;
using deskgeek.Infra;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace deskgeek.Application.Handlers;

public sealed class SaveLibraryOrderCommandHandler(AppDbContext db) : IRequestHandler<SaveLibraryOrderCommand, List<LibraryOrderItem>>
{
    public async Task<List<LibraryOrderItem>> Handle(SaveLibraryOrderCommand command, CancellationToken cancellationToken)
    {
        var ids = command.MediaIds ?? [];
        if (ids.Count == 0 || ids.Distinct().Count() != ids.Count) throw new ValidationException("A ordem deve conter obras distintas.");
        var collection = await db.MediaDex.Where(x => x.UserId == command.UserId).ToListAsync(cancellationToken);
        var byId = collection.ToDictionary(x => x.Id);
        if (ids.Any(id => !byId.ContainsKey(id))) throw new ValidationException("A biblioteca mudou ou contém uma obra indisponível. Atualize a lista e tente novamente.");
        var selected = ids.ToHashSet();
        // New works added while the modal was open follow the saved selection without losing their own data.
        var ordered = ids.Select(id => byId[id]).Concat(collection.Where(x => !selected.Contains(x.Id))
            .OrderBy(x => x.OrdemPersonalizada ?? int.MaxValue).ThenBy(x => x.Nome).ThenBy(x => x.Id)).ToList();
        for (var position = 0; position < ordered.Count; position++) ordered[position].OrdemPersonalizada = position;
        // EF saves all position changes in one transaction; other media fields remain untouched.
        await db.SaveChangesAsync(cancellationToken);
        return ordered.Select(x => new LibraryOrderItem(x.Id, x.OrdemPersonalizada)).ToList();
    }
}
