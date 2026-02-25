using deskgeek.Application.Commands;
using deskgeek.Application.Validators;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace deskgeek.Backend.Tests.Validators;

public class UpdateUsuarioFotoCommandValidatorTests
{
    private readonly UpdateUsuarioFotoCommandValidator _validator = new();

    [Fact]
    public async Task Validate_ShouldFail_WhenExtensionIsInvalid()
    {
        var file = BuildFormFile("avatar.gif", "image/gif", 128);

        var result = await _validator.ValidateAsync(new UpdateUsuarioFotoCommand
        {
            Id = Guid.NewGuid(),
            Foto = file
        });

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task Validate_ShouldPass_WhenPhotoIsValid()
    {
        var file = BuildFormFile("avatar.png", "image/png", 1024);

        var result = await _validator.ValidateAsync(new UpdateUsuarioFotoCommand
        {
            Id = Guid.NewGuid(),
            Foto = file
        });

        Assert.True(result.IsValid);
    }

    private static IFormFile BuildFormFile(string fileName, string contentType, int size)
    {
        var bytes = new byte[size];
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, size, "foto", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
