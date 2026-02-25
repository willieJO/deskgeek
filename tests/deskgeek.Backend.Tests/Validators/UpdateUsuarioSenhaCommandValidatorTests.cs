using deskgeek.Application.Commands;
using deskgeek.Application.Validators;
using Xunit;

namespace deskgeek.Backend.Tests.Validators;

public class UpdateUsuarioSenhaCommandValidatorTests
{
    private readonly UpdateUsuarioSenhaCommandValidator _validator = new();

    [Fact]
    public async Task Validate_ShouldFail_WhenNewPasswordMatchesCurrent()
    {
        var result = await _validator.ValidateAsync(new UpdateUsuarioSenhaCommand
        {
            Id = Guid.NewGuid(),
            SenhaAtual = "123456",
            NovaSenha = "123456"
        });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("diferente", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Validate_ShouldPass_WhenPasswordsAreValid()
    {
        var result = await _validator.ValidateAsync(new UpdateUsuarioSenhaCommand
        {
            Id = Guid.NewGuid(),
            SenhaAtual = "123456",
            NovaSenha = "abcdef"
        });

        Assert.True(result.IsValid);
    }
}
