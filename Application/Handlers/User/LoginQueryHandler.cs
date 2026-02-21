using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Repository;
using deskgeek.Shared;
using MediatR;
using Newtonsoft.Json.Linq;

namespace deskgeek.Application.Handlers
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
