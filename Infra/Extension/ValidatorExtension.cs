using APIFinancia.Application.Validators;
using FluentValidation;

namespace APIFinancia.Infra.Extension
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
