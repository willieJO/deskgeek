using deskgeek.Application.Commands;
using deskgeek.Application.Handlers;
using deskgeek.Application.Validators;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace deskgeek.Backend.Tests.Email;

public class EmailPreferencesTests
{
    [Fact]
    public async Task PreferenceCommands_RequireExplicitValue_AndAcceptFalse()
    {
        var userValidator = new UpdateUsuarioEmailsCommandValidator();
        var mediaValidator = new UpdateMediaEmailsCommandValidator();
        Assert.False((await userValidator.ValidateAsync(new UpdateUsuarioEmailsCommand())).IsValid);
        Assert.False((await mediaValidator.ValidateAsync(new UpdateMediaEmailsCommand())).IsValid);
        Assert.True((await userValidator.ValidateAsync(new UpdateUsuarioEmailsCommand { ReceberEmailsLancamentos = false })).IsValid);
        Assert.True((await mediaValidator.ValidateAsync(new UpdateMediaEmailsCommand { NotificarLancamentos = false })).IsValid);
    }

    [Fact]
    public async Task MediaPreference_RejectsAnotherUsersWork_AndDoesNotResetProgression()
    {
        await using var test = new EmailTestDatabase();
        var handler = new UpdateMediaEmailsCommandHandler(test.Db);
        var unauthorized = await handler.Handle(new UpdateMediaEmailsCommand { UserId = Guid.NewGuid(), MediaId = test.Media.Id, NotificarLancamentos = false }, default);
        Assert.Null(unauthorized);
        Assert.True((await test.Db.MediaDex.SingleAsync()).NotificarLancamentos);
        var baseline = test.Media.CapituloEsperadoReferenciaUtc;
        Assert.False(await handler.Handle(new UpdateMediaEmailsCommand { UserId = test.User.Id, MediaId = test.Media.Id, NotificarLancamentos = false }, default));
        test.Db.ChangeTracker.Clear();
        var saved = await test.Db.MediaDex.SingleAsync();
        Assert.False(saved.NotificarLancamentos);
        Assert.Equal(baseline, saved.CapituloEsperadoReferenciaUtc);
        Assert.Equal(test.Media.CapituloAtual, saved.CapituloAtual);
    }

    [Fact]
    public async Task GlobalPreference_PreservesIndividualSelections()
    {
        await using var test = new EmailTestDatabase();
        var handler = new UpdateUsuarioEmailsCommandHandler(test.Db);
        Assert.False(await handler.Handle(new UpdateUsuarioEmailsCommand { Id = test.User.Id, ReceberEmailsLancamentos = false }, default));
        Assert.True((await test.Db.MediaDex.SingleAsync()).NotificarLancamentos);
        Assert.True(await handler.Handle(new UpdateUsuarioEmailsCommand { Id = test.User.Id, ReceberEmailsLancamentos = true }, default));
    }

    [Fact]
    public void Migration_MatchesCurrentSqlServerModel()
    {
        using var db = new deskgeek.Infra.AppDbContext(new DbContextOptionsBuilder<deskgeek.Infra.AppDbContext>()
            .UseSqlServer("Server=localhost;Database=MigrationModelCheck;Integrated Security=true;TrustServerCertificate=true").Options);
        Assert.False(db.Database.HasPendingModelChanges());
    }

    [Fact]
    public async Task NewWorks_CanBeCreatedWithRemindersDisabled()
    {
        await using var test = new EmailTestDatabase();
        test.Db.MediaDex.Add(new deskgeek.Domain.MediaDex { Nome = "Silenciado", UserId = test.User.Id, NotificarLancamentos = false });
        await test.Db.SaveChangesAsync();
        test.Db.ChangeTracker.Clear();
        Assert.False((await test.Db.MediaDex.SingleAsync(x => x.Nome == "Silenciado")).NotificarLancamentos);
    }
}
