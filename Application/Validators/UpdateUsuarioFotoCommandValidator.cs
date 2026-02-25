using deskgeek.Application.Commands;
using FluentValidation;

namespace deskgeek.Application.Validators
{
    public class UpdateUsuarioFotoCommandValidator : AbstractValidator<UpdateUsuarioFotoCommand>
    {
        private static readonly HashSet<string> ExtensoesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };
        private static readonly HashSet<string> ContentTypesPermitidos = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp"
        };

        private const long MaxBytes = 2 * 1024 * 1024;

        public UpdateUsuarioFotoCommandValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Usuário inválido.");

            RuleFor(x => x.Foto)
                .NotNull().WithMessage("A foto é obrigatória.")
                .Must(file => file != null && file.Length > 0).WithMessage("A foto é obrigatória.")
                .Must(file => file == null || file.Length <= MaxBytes)
                .WithMessage("A foto deve ter no máximo 2MB.")
                .Must(file => file == null || ExtensoesPermitidas.Contains(Path.GetExtension(file.FileName)))
                .WithMessage("Formato de foto inválido. Use jpg, jpeg, png ou webp.");

            RuleFor(x => x.Foto)
                .Must(file => file == null || string.IsNullOrWhiteSpace(file.ContentType) || ContentTypesPermitidos.Contains(file.ContentType))
                .WithMessage("Content-Type de foto inválido.");
        }
    }
}
