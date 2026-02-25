using deskgeek.Application.Commands;
using deskgeek.Repository;
using FluentValidation;

namespace deskgeek.Application.Validators
{
    public class UpdateUsuarioNomeCommandValidator : AbstractValidator<UpdateUsuarioNomeCommand>
    {
        public UpdateUsuarioNomeCommandValidator(IUsuarioRepository usuarioRepository)
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Usuário inválido.");

            RuleFor(x => x.Usuario)
                .NotEmpty().WithMessage("O usuário é obrigatório.")
                .Must(usuario => (usuario ?? string.Empty).Trim().Length >= 3)
                .WithMessage("O usuário deve ter pelo menos 3 caracteres.")
                .MustAsync(async (command, usuario, cancellation) =>
                {
                    var existe = await usuarioRepository.UsuarioExisteAsync((usuario ?? string.Empty).Trim(), command.Id);
                    return !existe;
                }).WithMessage("Usuario ja cadastrado");
        }
    }
}
