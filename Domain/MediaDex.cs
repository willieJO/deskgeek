using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace deskgeek.Domain
{
    public class MediaDex
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string Nome { get; set; }    
        public string? TotalCapitulos { get; set; }
        public string? CapituloAtual { get; set; }
        public string? Status { get; set; }
        public string? DiaNovoCapitulo { get; set; }
        [NotMapped]
        public IFormFile ImagemUpload { get; set; }
        public string? ImagemDirectory { get; set; }
        public string? imagemUrl { get; set; }
    }
}
