using APIFinancia.Application.Commands;
using APIFinancia.Application.Queries;
using FluentValidation;

namespace APIFinancia.Application.Validators
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

