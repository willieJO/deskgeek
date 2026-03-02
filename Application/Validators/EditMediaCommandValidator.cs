using System.Globalization;
using deskgeek.Application.Commands;
using FluentValidation;

namespace deskgeek.Application.Validators
{
    public class EditMediaCommandValidator : AbstractValidator<EditMediaCommand>
    {
        public EditMediaCommandValidator()
        {
            RuleFor(x => x.Nome)
                .NotEmpty().WithMessage("O nome é obrigatório na edição.");

            When(x => !string.IsNullOrWhiteSpace(x.CapituloAtual), () =>
            {
                RuleFor(x => x.CapituloAtual)
                    .Must(BeNonNegativeInteger)
                    .WithMessage("Capítulo atual deve ser um inteiro maior ou igual a zero.");
            });

            When(x => !string.IsNullOrWhiteSpace(x.TotalCapitulos), () =>
            {
                RuleFor(x => x.TotalCapitulos)
                    .Must(BeNonNegativeInteger)
                    .WithMessage("Total de capítulos deve ser um inteiro maior ou igual a zero.");
            });

            RuleFor(x => x)
                .Must(HaveCapituloAtualLessOrEqualToTotalWhenBothProvided)
                .WithMessage("Capítulo atual não pode ser maior que o total de capítulos.");

            When(x => !string.IsNullOrWhiteSpace(x.UrlMidia), () =>
            {
                RuleFor(x => x.UrlMidia)
                    .Cascade(CascadeMode.Stop)
                    .MaximumLength(2048).WithMessage("A URL da mídia deve ter no máximo 2048 caracteres.")
                    .Must(BeValidHttpUrl).WithMessage("A URL da mídia deve ser uma URL válida (http/https).");
            });
        }

        private static bool BeValidHttpUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return true;

            return Uri.TryCreate(url, UriKind.Absolute, out var uri)
                   && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }

        private static bool BeNonNegativeInteger(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return true;

            return int.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
                   && parsed >= 0;
        }

        private static bool HaveCapituloAtualLessOrEqualToTotalWhenBothProvided(EditMediaCommand command)
        {
            var hasCapitulo = TryParseNonNegative(command.CapituloAtual, out var capituloAtual);
            var hasTotal = TryParseNonNegative(command.TotalCapitulos, out var totalCapitulos);

            if (!hasCapitulo || !hasTotal)
            {
                return true;
            }

            return capituloAtual <= totalCapitulos;
        }

        private static bool TryParseNonNegative(string? value, out int parsed)
        {
            parsed = 0;
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            if (!int.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out parsed))
            {
                return false;
            }

            return parsed >= 0;
        }
    }
}
