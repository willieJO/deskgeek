using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using deskgeek.Application.Validators;
using deskgeek.Domain;
using deskgeek.Repository;
using Xunit;

namespace deskgeek.Backend.Tests.Validators;

public class UpdateUsuarioNomeCommandValidatorTests
{
    [Fact]
    public async Task Validate_ShouldFail_WhenUsuarioAlreadyExistsForAnotherUser()
    {
        var repo = new FakeUsuarioRepository { UsuarioExisteOutro = true };
        var validator = new UpdateUsuarioNomeCommandValidator(repo);

        var result = await validator.ValidateAsync(new UpdateUsuarioNomeCommand
        {
            Id = Guid.NewGuid(),
            Usuario = "duplicado"
        });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Usuario");
    }

    [Fact]
    public async Task Validate_ShouldPass_WhenUsuarioAvailable()
    {
        var repo = new FakeUsuarioRepository { UsuarioExisteOutro = false };
        var validator = new UpdateUsuarioNomeCommandValidator(repo);

        var result = await validator.ValidateAsync(new UpdateUsuarioNomeCommand
        {
            Id = Guid.NewGuid(),
            Usuario = "novo_nome"
        });

        Assert.True(result.IsValid);
    }

    private sealed class FakeUsuarioRepository : IUsuarioRepository
    {
        public bool UsuarioExisteOutro { get; init; }

        public Task<bool> UsuarioExisteAsync(string usuario, Guid ignoreId) => Task.FromResult(UsuarioExisteOutro);
        public Task<bool> UsuarioExisteAsync(string usuario) => Task.FromResult(UsuarioExisteOutro);
        public Task<bool> EmailExisteAsync(string email) => throw new NotImplementedException();
        public Task AddAsync(User usuario) => throw new NotImplementedException();
        public Task UpdateAsync(User usuairo) => throw new NotImplementedException();
        public Task DeleteAsync(User usuario) => throw new NotImplementedException();
        public Task<User?> GetByIdAsync(Guid id) => throw new NotImplementedException();
        public Task<User?> GetByUsuarioAsync(string usuario) => throw new NotImplementedException();
        public Task<List<User>> GetAll() => throw new NotImplementedException();
        public Task<List<UsuarioResumo>> BuscarPorUsuarioAsync(string termo, int limite) => throw new NotImplementedException();
        public Task<string> GetUserId(LoginQuery usuario) => throw new NotImplementedException();
        public Task AtualizarNomeAsync(Guid id, string usuario) => throw new NotImplementedException();
        public Task AtualizarSenhaAsync(Guid id, string senhaHash) => throw new NotImplementedException();
        public Task AtualizarFotoPerfilAsync(Guid id, string? fotoPerfilArquivo) => throw new NotImplementedException();
    }
}
