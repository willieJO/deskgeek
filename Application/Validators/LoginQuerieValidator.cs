using APIFinancia.Application.Commands;
using APIFinancia.Application.Queries;
using FluentValidation;

namespace APIFinancia.Application.Validators
{
    public class LoginQuerieValidator : AbstractValidator<LoginQuery>
    {
        public LoginQuerieValidator()
        {
            RuleFor(x => x.Email)
               .NotEmpty().WithMessage("O email é obrigatório.")
               .EmailAddress().WithMessage("Formato de email invalido");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("A senha é obrigatória.")
                .MinimumLength(6).WithMessage("A senha deve ter pelo menos 6 caracteres.");
        }
    }
}

