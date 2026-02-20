using MediatR;
using System.ComponentModel.DataAnnotations.Schema;

namespace deskgeek.Application.Commands
{
    public class CreateMediaCommand : IRequest<Guid?>
    {
        public Guid Id { get; set; }
        public Guid Userid {get;set;}
        public string Nome { get; set; }
        public string? TotalCapitulos { get; set; }
        public string? CapituloAtual { get; set; }
        public string? Status { get; set; }
        public string? TipoMidia { get; set; }
        public string? DiaNovoCapitulo { get; set; }
        public IFormFile? ImagemUpload { get; set; }
        public string? ImagemDirectory { get; set; }
        public string? imagemUrl { get; set; }

    }
}
