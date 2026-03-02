using deskgeek.Application.Commands;
using deskgeek.Application.Validators;
using Xunit;

namespace deskgeek.Backend.Tests.Validators;

public class MediaCommandValidatorsTests
{
    [Fact]
    public async Task CreateValidator_ShouldPass_WhenUrlMidiaIsEmpty()
    {
        var validator = new CreateMediaCommandValidator();
        var command = new CreateMediaCommand
        {
            Nome = "Naruto",
            UrlMidia = ""
        };

        var result = await validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task CreateValidator_ShouldFail_WhenUrlMidiaIsNotHttpOrHttps()
    {
        var validator = new CreateMediaCommandValidator();
        var command = new CreateMediaCommand
        {
            Nome = "Naruto",
            UrlMidia = "ftp://example.com/watch"
        };

        var result = await validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName == nameof(CreateMediaCommand.UrlMidia)
            && e.ErrorMessage.Contains("URL válida", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateValidator_ShouldPass_WhenUrlMidiaIsHttps()
    {
        var validator = new CreateMediaCommandValidator();
        var command = new CreateMediaCommand
        {
            Nome = "Naruto",
            UrlMidia = "https://example.com/watch"
        };

        var result = await validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task EditValidator_ShouldFail_WhenUrlMidiaExceedsMaxLength()
    {
        var validator = new EditMediaCommandValidator();
        var command = new EditMediaCommand
        {
            Nome = "Naruto",
            UrlMidia = "https://example.com/" + new string('a', 2050)
        };

        var result = await validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName == nameof(EditMediaCommand.UrlMidia)
            && e.ErrorMessage.Contains("2048", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateValidator_ShouldFail_WhenCapituloAtualIsGreaterThanTotalCapitulos()
    {
        var validator = new CreateMediaCommandValidator();
        var command = new CreateMediaCommand
        {
            Nome = "Naruto",
            CapituloAtual = "12",
            TotalCapitulos = "10"
        };

        var result = await validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.ErrorMessage.Contains("não pode ser maior", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task EditValidator_ShouldFail_WhenCapituloAtualIsNegative()
    {
        var validator = new EditMediaCommandValidator();
        var command = new EditMediaCommand
        {
            Nome = "Naruto",
            CapituloAtual = "-1"
        };

        var result = await validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName == nameof(EditMediaCommand.CapituloAtual)
            && e.ErrorMessage.Contains("inteiro maior ou igual a zero", StringComparison.OrdinalIgnoreCase));
    }
}
