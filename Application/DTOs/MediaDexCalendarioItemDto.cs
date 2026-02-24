namespace deskgeek.Application.DTOs
{
    public class MediaDexCalendarioItemDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? DiaNovoCapitulo { get; set; }
        public string? ImagemDirectory { get; set; }
        public string? imagemUrl { get; set; }
    }
}
