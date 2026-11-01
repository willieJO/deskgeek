using deskgeek.Application.Commands;
using deskgeek.Application.Handlers;
using deskgeek.Application.Validators;
using deskgeek.Backend.Tests.Email;
using deskgeek.Domain;
using deskgeek.Repository;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace deskgeek.Backend.Tests.Services;

public class LibraryOrganizationTests
{
    [Theory]
    [InlineData("11", "11", true)]
    [InlineData("12", "11", true)]
    [InlineData(" 11 ", " 11 ", true)]
    [InlineData("10", "11", false)]
    [InlineData("", "11", false)]
    [InlineData("0", "0", false)]
    [InlineData("11", "", false)]
    [InlineData("11", "-1", false)]
    [InlineData("11", "1.5", false)]
    public void Completion_UsesOnlyActualProgressAndPositiveKnownTotals(string current, string total, bool complete)
    {
        var media = new MediaDex { CapituloAtual = current, TotalCapitulos = total, CapituloEsperadoAtual = 100, Status = "Em andamento", NotificarLancamentos = false, OrdemPersonalizada = 4 };
        Assert.Equal(complete, MediaCompletionRules.Apply(media));
        Assert.Equal(complete ? "Finalizado" : "Em andamento", media.Status);
        Assert.False(media.NotificarLancamentos);
        Assert.Equal(4, media.OrdemPersonalizada);
        if (complete) Assert.False(MediaCompletionRules.Apply(media));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Repository_FinalizesOnCreationAndProgressUpdates(bool creating)
    {
        await using var fixture = new EmailTestDatabase();
        var repository = new MediaRepository(fixture.Db, null!);
        var media = creating ? new MediaDex { UserId = fixture.User.Id, Nome = "Novo", TotalCapitulos = "12", Status = "Em andamento" } : await fixture.Db.MediaDex.SingleAsync();
        media.CapituloAtual = "12";
        if (creating) await repository.AddAsync(media); else await repository.UpdateAsync(media);
        fixture.Db.ChangeTracker.Clear();
        Assert.Equal("Finalizado", (await fixture.Db.MediaDex.SingleAsync(x => x.Id == media.Id)).Status);
    }

    [Fact]
    public async Task ProgressUpdate_PreservesOrderSavedSinceTheMediaWasLoaded()
    {
        await using var fixture = new EmailTestDatabase();
        var media = await fixture.Db.MediaDex.SingleAsync();
        await fixture.Db.MediaDex.Where(x => x.Id == media.Id).ExecuteUpdateAsync(x => x.SetProperty(x => x.OrdemPersonalizada, 8));
        media.CapituloAtual = "12";
        await new MediaRepository(fixture.Db, null!).UpdateAsync(media);
        fixture.Db.ChangeTracker.Clear();
        var saved = await fixture.Db.MediaDex.SingleAsync();
        Assert.Equal(8, saved.OrdemPersonalizada);
        Assert.Equal("Finalizado", saved.Status);
    }

    [Fact]
    public async Task Order_PersistsPerOwnerAndAppendsNewWorksWithoutChangingMetadata()
    {
        await using var fixture = new EmailTestDatabase();
        var second = new MediaDex { Nome = "Segundo", UserId = fixture.User.Id, CapituloAtual = "4", NotificarLancamentos = false, Status = "Inativo" };
        var addedLater = new MediaDex { Nome = "Novo", UserId = fixture.User.Id };
        var foreign = new MediaDex { Nome = "Outra conta", UserId = Guid.NewGuid(), OrdemPersonalizada = 7 };
        fixture.Db.AddRange(second, addedLater, foreign);
        await fixture.Db.SaveChangesAsync();
        var handler = new SaveLibraryOrderCommandHandler(fixture.Db);
        var result = await handler.Handle(new() { UserId = fixture.User.Id, MediaIds = [second.Id, fixture.Media.Id] }, default);
        Assert.Equal(new[] { second.Id, fixture.Media.Id, addedLater.Id }, result.Select(x => x.Id));
        fixture.Db.ChangeTracker.Clear();
        var saved = await fixture.Db.MediaDex.SingleAsync(x => x.Id == second.Id);
        Assert.Equal(0, saved.OrdemPersonalizada);
        Assert.Equal("4", saved.CapituloAtual);
        Assert.Equal("Inativo", saved.Status);
        Assert.False(saved.NotificarLancamentos);
        Assert.Equal(7, (await fixture.Db.MediaDex.SingleAsync(x => x.Id == foreign.Id)).OrdemPersonalizada);
    }

    [Fact]
    public async Task Order_RejectsForeignMissingAndDuplicateIdsBeforeAnyChanges()
    {
        await using var fixture = new EmailTestDatabase();
        var foreign = new MediaDex { Nome = "Outra conta", UserId = Guid.NewGuid() };
        fixture.Db.Add(foreign); await fixture.Db.SaveChangesAsync();
        var handler = new SaveLibraryOrderCommandHandler(fixture.Db);
        foreach (var ids in new List<Guid>[] { [], [fixture.Media.Id, fixture.Media.Id], [fixture.Media.Id, foreign.Id], [fixture.Media.Id, Guid.NewGuid()] })
            await Assert.ThrowsAsync<ValidationException>(() => handler.Handle(new() { UserId = fixture.User.Id, MediaIds = ids }, default));
        fixture.Db.ChangeTracker.Clear();
        Assert.All(await fixture.Db.MediaDex.ToListAsync(), x => Assert.Null(x.OrdemPersonalizada));
        var validator = new SaveLibraryOrderCommandValidator();
        Assert.False(validator.Validate(new SaveLibraryOrderCommand { MediaIds = [Guid.Empty] }).IsValid);
    }
}
