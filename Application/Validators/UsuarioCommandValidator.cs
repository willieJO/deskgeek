using APIFinancia.Application.Commands;
using APIFinancia.Repository;
using FluentValidation;

namespace APIFinancia.Application.Validators
{
    public class UsuarioCommandValidator : AbstractValidator<UsuarioCommand>
    {
        public UsuarioCommandValidator(IUsuarioRepository usuarioRepository) {
            RuleFor(x => x.Nome)
               .NotEmpty().WithMessage("O nome é obrigatório.")
               .MinimumLength(3).WithMessage("O nome deve ter pelo menos 3 caracteres.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("O email é obrigatório.")
                .EmailAddress().WithMessage("Email inválido.")
                .MustAsync(async (email, cancellation) =>
                {
                    var existe = await usuarioRepository.EmailExisteAsync(email);
                    return !existe;
                }).WithMessage("Esse e-mail já está cadastrado.");

            RuleFor(x => x.Senha)
                .NotEmpty().WithMessage("A senha é obrigatória.")
                .MinimumLength(6).WithMessage("A senha deve ter pelo menos 6 caracteres.");
        }

    }
}
