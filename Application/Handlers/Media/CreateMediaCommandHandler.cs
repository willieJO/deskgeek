using System.Globalization;
using AutoMapper;
using deskgeek.Application.Commands;
using deskgeek.Domain;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;

namespace deskgeek.Application.Handlers
{
    public class CreateMediaCommandHandler : IRequestHandler<CreateMediaCommand, Guid?>
    {
        private readonly MediaRepository _repository;
        private readonly IMapper _mapper;
        private readonly UploadService _uploadService;
        private readonly TimeProvider _timeProvider;

        public CreateMediaCommandHandler(
            MediaRepository repository,
            IMapper mapper,
            UploadService uploadService,
            TimeProvider timeProvider)
        {
            _repository = repository;
            _mapper = mapper;
            _uploadService = uploadService;
            _timeProvider = timeProvider;
        }

        public async Task<Guid?> Handle(CreateMediaCommand request, CancellationToken cancellationToken)
        {
            request.imagemUrl = NormalizeOptionalString(request.imagemUrl);
            request.UrlMidia = NormalizeOptionalString(request.UrlMidia);
            request.CapituloAtual = NormalizeOptionalNumberString(request.CapituloAtual);
            request.TotalCapitulos = NormalizeOptionalNumberString(request.TotalCapitulos);

            var objMedia = _mapper.Map<MediaDex>(request);
            if (string.IsNullOrWhiteSpace(objMedia.TipoMidia))
            {
                objMedia.TipoMidia = "Anime";
            }

            var capituloAtual = ParseIntNaoNegativo(objMedia.CapituloAtual) ?? 0;
            var totalCapitulos = ParseIntNaoNegativo(objMedia.TotalCapitulos);
            if (totalCapitulos.HasValue)
            {
                capituloAtual = Math.Min(capituloAtual, totalCapitulos.Value);
            }

            objMedia.CapituloEsperadoBase = capituloAtual;
            objMedia.CapituloEsperadoReferenciaUtc = _timeProvider.GetUtcNow();

            if (request.ImagemUpload != null && request.ImagemUpload.Length > 0)
            {
                byte[] imageBytes;
                using (var ms = new MemoryStream())
                {
                    await request.ImagemUpload.CopyToAsync(ms, cancellationToken);
                    imageBytes = ms.ToArray();
                }

                var savedFileName = await _uploadService.UploadImageToServer(imageBytes, request.ImagemUpload.FileName);
                objMedia.ImagemDirectory = savedFileName;
            }

            await _repository.AddAsync(objMedia);
            return objMedia.Id;
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
