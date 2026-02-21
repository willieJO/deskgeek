using deskgeek.Application.Commands;
using deskgeek.Repository;
using FluentValidation;

namespace deskgeek.Application.Validators
{
    public class UsuarioCommandValidator : AbstractValidator<UsuarioCommand>
    {
        public UsuarioCommandValidator(IUsuarioRepository usuarioRepository) {
            RuleFor(x => x.Usuario)
               .NotEmpty().WithMessage("O usuário é obrigatório.")
               .Must(usuario => (usuario ?? string.Empty).Trim().Length >= 3)
               .WithMessage("O usuário deve ter pelo menos 3 caracteres.")
               .MustAsync(async (usuario, cancellation) =>
               {
                   var existe = await usuarioRepository.UsuarioExisteAsync((usuario ?? string.Empty).Trim());
                   return !existe;
               }).WithMessage("Usuario ja cadastrado");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("O email é obrigatório.")
                .EmailAddress().WithMessage("Email inválido.")
                .MustAsync(async (email, cancellation) =>
                {
                    var existe = await usuarioRepository.EmailExisteAsync((email ?? string.Empty).Trim());
                    return !existe;
                }).WithMessage("Esse e-mail já está cadastrado.");

            RuleFor(x => x.Senha)
                .NotEmpty().WithMessage("A senha é obrigatória.")
                .MinimumLength(6).WithMessage("A senha deve ter pelo menos 6 caracteres.");
        }

    }
}
