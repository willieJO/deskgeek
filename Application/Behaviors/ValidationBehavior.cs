using FluentValidation;
using FluentValidation.Results;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace deskgeek.Application.Behaviors
{
    public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        private readonly IEnumerable<IValidator<TRequest>> _validators;

        public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        {
            _validators = validators;
        }

        public async Task<TResponse> Handle(
    TRequest request,
    RequestHandlerDelegate<TResponse> next,
    CancellationToken cancellationToken)
        {
            if (_validators.Any())
            {
                var context = new ValidationContext<TRequest>(request);
                var failures = new List<ValidationFailure>();

                // Executa validadores de forma sequencial para evitar concorrência no mesmo DbContext scoped.
                foreach (var validator in _validators)
                {
                    var result = await validator.ValidateAsync(context, cancellationToken);
                    failures.AddRange(result.Errors.Where(f => f != null));
                }

                // Agrupar falhas por PropertyName e garantir que só ocorra uma falha para cada PropertyName
                var groupedFailures = failures
                    .GroupBy(f => f.PropertyName)
                    .Select(group => new
                    {
                        Property = group.Key,
                        Errors = group.Select(f => f.ErrorMessage).Distinct().ToList()  // Evita mensagens duplicadas
                    })
                    .ToList();

                // Verifica se há falhas e lança uma exceção de validação com as falhas agrupadas
                if (groupedFailures.Any())
                {
                    var validationFailures = groupedFailures.SelectMany(group =>
                        group.Errors.Select(errorMessage => new ValidationFailure(group.Property, errorMessage))
                    ).ToList();

                    throw new ValidationException(validationFailures);
                }
            }

            return await next();
        }


    }
}
