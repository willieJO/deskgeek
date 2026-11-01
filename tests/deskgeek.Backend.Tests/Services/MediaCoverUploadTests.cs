using AutoMapper;
using deskgeek.Application.Commands;
using deskgeek.Application.Handlers;
using deskgeek.Application.Handlers.Media;
using deskgeek.Application.Services;
using deskgeek.Domain;
using deskgeek.Infra;
using deskgeek.Repository;
using deskgeek.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace deskgeek.Backend.Tests.Services;

public class MediaCoverUploadTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Upload_PreservesOriginalBytes_AndReplacesOldThumbnailUrl(bool editing)
    {
        var directory = Path.Combine(Path.GetTempPath(), $"mediadex-cover-test-{Guid.NewGuid():N}");
        try
        {
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
            await db.Database.EnsureCreatedAsync();
            var media = new MediaDex { UserId = Guid.NewGuid(), Nome = "Capa de teste", imagemUrl = "https://s4.anilist.co/file/anilistcdn/media/manga/cover/small/old.jpg" };
            if (editing) { db.MediaDex.Add(media); await db.SaveChangesAsync(); db.ChangeTracker.Clear(); }
            var bytes = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR1cAAAAASUVORK5CYII=");
            await using var stream = new MemoryStream(bytes);
            var file = new FormFile(stream, 0, bytes.Length, "ImagemUpload", "original.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
            var upload = new UploadService(Options.Create(new SshSettings()), Options.Create(new StorageSettings { Provider = "Local", LocalBasePath = directory }));
            // These repository operations use EF only; no ADO/SQL Server connection is needed.
            var repository = new MediaRepository(db, null!);
            if (editing)
            {
                var handler = new EditMediaCommandHandler(repository, upload, new MediaProgressionService(TimeProvider.System), TimeProvider.System);
                await handler.Handle(new EditMediaCommand { Id = media.Id, Userid = media.UserId, Nome = media.Nome, ImagemUpload = file }, default);
            }
            else
            {
                var mapper = new Mock<IMapper>();
                mapper.Setup(x => x.Map<MediaDex>(It.IsAny<CreateMediaCommand>())).Returns(media);
                var handler = new CreateMediaCommandHandler(repository, mapper.Object, upload, TimeProvider.System);
                await handler.Handle(new CreateMediaCommand { Nome = media.Nome, ImagemUpload = file, imagemUrl = media.imagemUrl }, default);
            }
            db.ChangeTracker.Clear();
            var saved = await db.MediaDex.SingleAsync();
            Assert.Null(saved.imagemUrl);
            Assert.NotNull(saved.ImagemDirectory);
            Assert.Equal(bytes, await File.ReadAllBytesAsync(Path.Combine(directory, saved.ImagemDirectory)));
        }
        finally { if (Directory.Exists(directory)) Directory.Delete(directory, recursive: true); }
    }
}
