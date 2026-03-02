using System.Globalization;
using deskgeek.Application.Commands;
using deskgeek.Application.Services;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers.Media
{
    public class EditMediaCommandHandler : IRequestHandler<EditMediaCommand, Guid?>
    {
        private readonly MediaRepository _repository;
        private readonly UploadService _uploadService;
        private readonly IMediaProgressionService _mediaProgressionService;
        private readonly TimeProvider _timeProvider;

        public EditMediaCommandHandler(
            MediaRepository repository,
            UploadService uploadService,
            IMediaProgressionService mediaProgressionService,
            TimeProvider timeProvider)
        {
            _repository = repository;
            _uploadService = uploadService;
            _mediaProgressionService = mediaProgressionService;
            _timeProvider = timeProvider;
        }

        public async Task<Guid?> Handle(EditMediaCommand request, CancellationToken cancellationToken)
        {
            var mediaExistente = await _repository.GetByIdAndUserIdAsync(request.Id, request.Userid);
            if (mediaExistente == null)
            {
                return null;
            }

            var capituloEsperadoAnterior = _mediaProgressionService.CalcularCapituloEsperadoAtual(mediaExistente);

            mediaExistente.Nome = NormalizeOptionalString(request.Nome) ?? mediaExistente.Nome;

            if (request.TipoMidia != null)
            {
                mediaExistente.TipoMidia = NormalizeOptionalString(request.TipoMidia);
            }

            if (request.Status != null)
            {
                mediaExistente.Status = NormalizeOptionalString(request.Status);
            }

            if (request.DiaNovoCapitulo != null)
            {
                mediaExistente.DiaNovoCapitulo = NormalizeOptionalString(request.DiaNovoCapitulo);
            }

            if (request.TotalCapitulos != null)
            {
                mediaExistente.TotalCapitulos = NormalizeOptionalNumberString(request.TotalCapitulos);
            }

            if (request.CapituloAtual != null)
            {
                mediaExistente.CapituloAtual = NormalizeOptionalNumberString(request.CapituloAtual);
            }

            if (request.imagemUrl != null)
            {
                mediaExistente.imagemUrl = NormalizeOptionalString(request.imagemUrl);
            }

            if (request.UrlMidia != null)
            {
                mediaExistente.UrlMidia = NormalizeOptionalString(request.UrlMidia);
            }

            if (request.ImagemUpload != null && request.ImagemUpload.Length > 0)
            {
                byte[] imageBytes;
                using (var ms = new MemoryStream())
                {
                    await request.ImagemUpload.CopyToAsync(ms, cancellationToken);
                    imageBytes = ms.ToArray();
                }

                var savedFileName = await _uploadService.UploadImageToServer(imageBytes, request.ImagemUpload.FileName);
                mediaExistente.ImagemDirectory = savedFileName;
            }
            else if (!string.IsNullOrWhiteSpace(request.ImagemDirectory))
            {
                mediaExistente.ImagemDirectory = request.ImagemDirectory;
            }

            var capituloAtualNovo = ParseIntNaoNegativo(mediaExistente.CapituloAtual) ?? 0;
            var totalCapitulosNovo = ParseIntNaoNegativo(mediaExistente.TotalCapitulos);
            var baseRebalanceada = capituloAtualNovo > capituloEsperadoAnterior
                ? capituloAtualNovo
                : capituloEsperadoAnterior;

            if (totalCapitulosNovo.HasValue)
            {
                baseRebalanceada = Math.Min(baseRebalanceada, totalCapitulosNovo.Value);
            }

            mediaExistente.CapituloEsperadoBase = baseRebalanceada;
            mediaExistente.CapituloEsperadoReferenciaUtc = _timeProvider.GetUtcNow();

            await _repository.UpdateAsync(mediaExistente);
            return mediaExistente.Id;
        }

        private static string? NormalizeOptionalString(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static string? NormalizeOptionalNumberString(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var trimmed = value.Trim();
            if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed >= 0)
            {
                return parsed.ToString(CultureInfo.InvariantCulture);
            }

            return trimmed;
        }

        private static int? ParseIntNaoNegativo(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            if (int.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed >= 0)
            {
                return parsed;
            }

            return null;
        }
    }
}
