using deskgeek.Application.Commands;
using FluentValidation;

namespace deskgeek.Application.Validators;

public sealed class SaveLibraryOrderCommandValidator : AbstractValidator<SaveLibraryOrderCommand>
{
    public SaveLibraryOrderCommandValidator()
    {
        RuleFor(x => x.MediaIds).NotEmpty().WithMessage("Selecione as obras que deseja organizar.");
        When(x => x.MediaIds is not null, () =>
        {
            RuleFor(x => x.MediaIds).Must(ids => ids!.Distinct().Count() == ids.Count).WithMessage("A ordem contém obras repetidas.");
            RuleForEach(x => x.MediaIds!).NotEmpty().WithMessage("Obra inválida na ordenação.");
        });
    }
}
