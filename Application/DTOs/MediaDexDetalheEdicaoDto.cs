namespace deskgeek.Application.DTOs
{
    public class MediaDexDetalheEdicaoDto
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? TipoMidia { get; set; }
        public string? Status { get; set; }
        public string? DiaNovoCapitulo { get; set; }
        public string? TotalCapitulos { get; set; }
        public string? CapituloAtual { get; set; }
        public string? ImagemDirectory { get; set; }
        public string? imagemUrl { get; set; }
        public string? UrlMidia { get; set; }
        public int? CapituloEsperadoAtual { get; set; }
    }
}
