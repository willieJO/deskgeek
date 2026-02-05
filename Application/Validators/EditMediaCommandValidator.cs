using APIFinancia.Application.Commands;
using desksaveanime.Application.Commands;
using FluentValidation;

namespace desksaveanime.Application.Validators
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
