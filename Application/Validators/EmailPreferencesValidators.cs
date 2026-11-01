using deskgeek.Application.Commands;
using FluentValidation;

namespace deskgeek.Application.Validators;

public sealed class UpdateUsuarioEmailsCommandValidator : AbstractValidator<UpdateUsuarioEmailsCommand>
{
    public UpdateUsuarioEmailsCommandValidator() => RuleFor(x => x.ReceberEmailsLancamentos).NotNull().WithMessage("Informe se deseja receber e-mails de lançamento.");
}

public sealed class UpdateMediaEmailsCommandValidator : AbstractValidator<UpdateMediaEmailsCommand>
{
    public UpdateMediaEmailsCommandValidator() => RuleFor(x => x.NotificarLancamentos).NotNull().WithMessage("Informe se deseja receber lembretes desta obra.");
}
