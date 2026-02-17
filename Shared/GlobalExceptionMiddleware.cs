using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace deskgeek.Shared
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (JsonException jsonEx) 
            {
                _logger.LogError(jsonEx, "Erro ao desserializar JSON");

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    message = "Erro ao processar os dados enviados. Verifique os formatos e valores."
                };

                await context.Response.WriteAsJsonAsync(response);
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex, "Erro inesperado");

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    message = "Erro interno no servidor."
                };

                await context.Response.WriteAsJsonAsync(response);
            }
        }
    }

}
