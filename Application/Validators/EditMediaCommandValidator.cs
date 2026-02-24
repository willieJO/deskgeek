using deskgeek.Application.Commands;
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
    }
}
