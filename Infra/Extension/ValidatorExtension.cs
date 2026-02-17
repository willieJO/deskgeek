using deskgeek.Application.Validators;
using FluentValidation;

namespace deskgeek.Infra.Extension
{
    public static class ValidatorExtension
    {
        public static IServiceCollection AddValidator(this IServiceCollection services)
        {
            services.AddValidatorsFromAssemblyContaining<UsuarioCommandValidator>();
            services.AddValidatorsFromAssemblyContaining<LoginQuerieValidator>();
            return services;
        }
    }
}
