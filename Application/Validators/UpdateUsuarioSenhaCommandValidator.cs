using deskgeek.Application.Commands;
using FluentValidation;

namespace deskgeek.Application.Validators
{
    public class UpdateUsuarioSenhaCommandValidator : AbstractValidator<UpdateUsuarioSenhaCommand>
    {
        public UpdateUsuarioSenhaCommandValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Usuário inválido.");

            RuleFor(x => x.SenhaAtual)
                .NotEmpty().WithMessage("A senha atual é obrigatória.");

            RuleFor(x => x.NovaSenha)
                .NotEmpty().WithMessage("A nova senha é obrigatória.")
                .MinimumLength(6).WithMessage("A nova senha deve ter pelo menos 6 caracteres.");

            When(
                x => !string.IsNullOrWhiteSpace(x.SenhaAtual) && !string.IsNullOrWhiteSpace(x.NovaSenha),
                () =>
                {
                    RuleFor(x => x)
                        .Must(x => !string.Equals(x.SenhaAtual, x.NovaSenha, StringComparison.Ordinal))
                        .WithMessage("A nova senha deve ser diferente da senha atual.");
                });
        }
    }
}
