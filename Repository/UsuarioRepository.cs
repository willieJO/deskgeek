using deskgeek.Application.Queries;
using deskgeek.Domain;
using deskgeek.Infra;
using deskgeek.Shared;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace deskgeek.Repository
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly AppDbContext _context;
        private readonly ADOContext _ADOContext;

        public UsuarioRepository(AppDbContext context, ADOContext aDOContext)
        {
            _context = context;
            _ADOContext = aDOContext;
        }

        public async Task AddAsync(User usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }
        public async Task<bool> EmailExisteAsync(string email)
        {
            var emailNormalizado = (email ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(emailNormalizado))
            {
                return false;
            }

            const string sql = @"
        SELECT CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM Usuario 
                WHERE Email = @Email
            ) THEN 1
            ELSE 0
        END";
            using (SqlCommand command = new SqlCommand(sql, _ADOContext.connection))
            {
                command.Parameters.AddWithValue("@Email", emailNormalizado);
                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result) == 1;
            }
        }
        public async Task<bool> UsuarioExisteAsync(string usuario)
        {
            var usuarioNormalizado = (usuario ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(usuarioNormalizado))
            {
                return false;
            }
            var usuarioUpper = usuarioNormalizado.ToUpper();

            return await _context.Usuarios
                .AsNoTracking()
                .AnyAsync(x => x.Usuario.ToUpper() == usuarioUpper);
        }

        public async Task DeleteAsync(User usuario)
        {
            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task<List<User>> GetAll()
        {
            return  await _context.Usuarios.ToListAsync();
        }

        public Task<User?> GetByIdAsync(Guid id)
        {
            return _context.Usuarios.FirstOrDefaultAsync(x => x.Id == id);
        }
        public Task<User?> GetByUsuarioAsync(string usuario)
        {
            var usuarioNormalizado = (usuario ?? string.Empty).Trim();
            var usuarioUpper = usuarioNormalizado.ToUpper();
            return _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Usuario.ToUpper() == usuarioUpper);
        }
        public async Task<List<UsuarioResumo>> BuscarPorUsuarioAsync(string termo, int limite)
        {
            var termoNormalizado = (termo ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(termoNormalizado))
            {
                return new List<UsuarioResumo>();
            }

            var limiteSeguro = Math.Clamp(limite, 1, 20);
            var termoUpper = termoNormalizado.ToUpper();

            return await _context.Usuarios
                .AsNoTracking()
                .Where(x => x.Usuario.ToUpper().StartsWith(termoUpper))
                .OrderBy(x => x.Usuario)
                .Select(x => new UsuarioResumo
                {
                    Id = x.Id,
                    Usuario = x.Usuario
                })
                .Take(limiteSeguro)
                .ToListAsync();
        }
        public async Task<string> GetUserId(LoginQuery usuario)
        {
            var sql = $@"SELECT Id,Email,Senha from Usuario
                        WHERE Email = @Email";
            using (SqlCommand command = new SqlCommand(sql, _ADOContext.connection))
            {
                try
                {
                    command.Parameters.AddWithValue("@Email", usuario.Email);
                    var resultado = await _ADOContext.SearchQueryAsync<User>(command);
                    var user = resultado.FirstOrDefault();

                    if (user != null && usuario.Password.VerifyPassword(user.Senha))
                    {
                        return user.Id.ToString();
                    }
                    return "0";
                }
                catch (Exception ex)
                {
                    throw ex;
                }
            }
        }

        public async Task UpdateAsync(User usuairo)
        {
            var existeUsuario = await _context.Usuarios.FindAsync(usuairo.Id);
            if (existeUsuario == null)
            {
                throw new KeyNotFoundException("Usuario não encontrado");
            }
            existeUsuario.Usuario = usuairo.Usuario;
            existeUsuario.Email = usuairo.Email;
            existeUsuario.Senha = usuairo.Senha;
            await _context.SaveChangesAsync();
        }
    }
}
