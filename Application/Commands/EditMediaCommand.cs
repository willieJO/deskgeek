using MediatR;

namespace desksaveanime.Application.Commands
{
    public class EditMediaCommand : IRequest<Guid?>
    {
        public Guid Id { get; set; }
        public Guid Userid { get; set; }
        public string? Nome { get; set; }
        public string? TotalCapitulos { get; set; }
        public string? CapituloAtual { get; set; }
        public string? Status { get; set; }
        public string? DiaNovoCapitulo { get; set; }
        public IFormFile? ImagemUpload { get; set; }
        public string? ImagemDirectory { get; set; }
        public string? imagemUrl { get; set; }

    }
}
