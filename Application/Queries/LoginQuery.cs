using MediatR;

namespace APIFinancia.Application.Queries
{
    public class LoginQuery : IRequest<string>
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
