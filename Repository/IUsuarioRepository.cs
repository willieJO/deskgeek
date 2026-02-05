using APIFinancia.Application.Queries;
using APIFinancia.Domain;

namespace APIFinancia.Repository
{
    public interface IUsuarioRepository
    {
        Task AddAsync(User usuario);
        Task UpdateAsync(User usuairo);
        Task DeleteAsync(User usuario);
        Task<User> GetByIdAsync(Guid id);
        Task<List<User>> GetAll();
        Task<bool> EmailExisteAsync(string email);
        Task<string> GetUserId(LoginQuery usuario);
    }
}
