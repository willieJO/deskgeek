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
        }
    }
}
