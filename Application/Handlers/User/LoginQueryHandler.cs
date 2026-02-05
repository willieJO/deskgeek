using APIFinancia.Application.Queries;
using APIFinancia.Domain;
using APIFinancia.Repository;
using APIFinancia.Shared;
using MediatR;
using Newtonsoft.Json.Linq;

namespace APIFinancia.Application.Handlers.User
{
    public class LoginQueryHandler : IRequestHandler<LoginQuery, string>
    {
        private readonly IUsuarioRepository _userRepository;

        public LoginQueryHandler(IUsuarioRepository userRepository)
        {
            _userRepository = userRepository;
        }


        public async Task<string> Handle(LoginQuery request, CancellationToken cancellationToken)
        {
            return await _userRepository.GetUserId(request);   
        }
    }
}
