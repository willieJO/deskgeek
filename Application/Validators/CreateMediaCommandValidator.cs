using deskgeek.Application.Commands;
using deskgeek.Application.Queries;
using FluentValidation;

namespace deskgeek.Application.Validators
{
    public class CreateMediaCommandValidator : AbstractValidator<CreateMediaCommand>
    {
        public CreateMediaCommandValidator()
        {
            RuleFor(x => x.Nome)
               .NotEmpty().WithMessage("O nome é obrigatório.");
        }
    }
}

