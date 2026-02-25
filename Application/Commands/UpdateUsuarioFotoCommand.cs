using MediatR;
using Microsoft.AspNetCore.Http;

namespace deskgeek.Application.Commands
{
    public class UpdateUsuarioFotoCommand : IRequest<string>
    {
        public Guid Id { get; set; }
        public IFormFile? Foto { get; set; }
    }
}
