using deskgeek.Application.Queries;
using deskgeek.Domain;

namespace deskgeek.Repository
{
    public interface IUsuarioRepository
    {
        Task AddAsync(User usuario);
        Task UpdateAsync(User usuairo);
        Task DeleteAsync(User usuario);
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByUsuarioAsync(string usuario);
        Task<List<User>> GetAll();
        Task<List<UsuarioResumo>> BuscarPorUsuarioAsync(string termo, int limite);
        Task<bool> EmailExisteAsync(string email);
        Task<bool> UsuarioExisteAsync(string usuario);
        Task<string> GetUserId(LoginQuery usuario);
    }
}
