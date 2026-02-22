using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using deskgeek.Application.Validators;
using deskgeek.Domain;
using deskgeek.Repository;
using Xunit;

namespace deskgeek.Backend.Tests.Validators;

public class UsuarioCommandValidatorTests
{
    [Fact]
    public async Task Validate_ShouldFail_WhenUsuarioOrEmailAlreadyExists()
    {
        var repo = new FakeUsuarioRepository
        {
            UsuarioExiste = true,
            EmailExiste = true
        };
        var validator = new UsuarioCommandValidator(repo);
        var command = new UsuarioCommand
        {
            Usuario = "ja_existe",
            Email = "ja@existe.com",
            Senha = "123456"
        };

        var result = await validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Usuario");
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
    }

    [Fact]
    public async Task Validate_ShouldPass_WhenUsuarioAndEmailAreAvailable()
    {
        var repo = new FakeUsuarioRepository
        {
            UsuarioExiste = false,
            EmailExiste = false
        };
        var validator = new UsuarioCommandValidator(repo);
        var command = new UsuarioCommand
        {
            Usuario = "novo_usuario",
            Email = "novo@usuario.com",
            Senha = "123456"
        };

        var result = await validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    private sealed class FakeUsuarioRepository : IUsuarioRepository
    {
        public bool UsuarioExiste { get; init; }
        public bool EmailExiste { get; init; }

        public Task<bool> EmailExisteAsync(string email) => Task.FromResult(EmailExiste);
        public Task<bool> UsuarioExisteAsync(string usuario) => Task.FromResult(UsuarioExiste);

        public Task AddAsync(User usuario) => throw new NotImplementedException();
        public Task UpdateAsync(User usuairo) => throw new NotImplementedException();
        public Task DeleteAsync(User usuario) => throw new NotImplementedException();
        public Task<User?> GetByIdAsync(Guid id) => throw new NotImplementedException();
        public Task<User?> GetByUsuarioAsync(string usuario) => throw new NotImplementedException();
        public Task<List<User>> GetAll() => throw new NotImplementedException();
        public Task<List<UsuarioResumo>> BuscarPorUsuarioAsync(string termo, int limite) => throw new NotImplementedException();
        public Task<string> GetUserId(LoginQuery usuario) => throw new NotImplementedException();
    }
}
