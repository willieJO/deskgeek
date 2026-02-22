using deskgeek.Application.Queries;
using deskgeek.Application.Validators;
using Xunit;

namespace deskgeek.Backend.Tests.Validators;

public class LoginQuerieValidatorTests
{
    private readonly LoginQuerieValidator _validator = new();

    [Fact]
    public void Validate_ShouldHaveErrors_WhenEmailAndPasswordAreInvalid()
    {
        var command = new LoginQuery
        {
            Email = "invalido",
            Password = "123"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
        Assert.Contains(result.Errors, e => e.PropertyName == "Password");
    }

    [Fact]
    public void Validate_ShouldPass_WhenEmailAndPasswordAreValid()
    {
        var command = new LoginQuery
        {
            Email = "user@test.com",
            Password = "123456"
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
