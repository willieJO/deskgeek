using APIFinancia.Application.Queries;
using APIFinancia.Domain;
using APIFinancia.Infra;
using APIFinancia.Shared;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace APIFinancia.Repository
{
    public class MediaRepository
    {
        private readonly AppDbContext _context;
        private readonly ADOContext _ADOContext;

        public MediaRepository(AppDbContext context, ADOContext aDOContext)
        {
            _context = context;
            _ADOContext = aDOContext;
        }
        public async Task<List<MediaDex>> GetAllById(Guid id)
        {
            var list = await _context.MediaDex.Where(x => x.UserId == id).ToListAsync();
            return list;
        }
        public async Task AddAsync(MediaDex usuario)
        {
            await _context.MediaDex.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }
        public async Task<List<MediaDex>> GetAllByIdEmAndamento(Guid id)
        {
            var list = await _context.MediaDex
                .Where(x => x.UserId == id && x.Status != null && x.Status == "Em andamento")
                .ToListAsync();
            return list;
        }
        public async Task UpdateAsync(MediaDex usuario)
        {
            _context.MediaDex.Update(usuario);
            await _context.SaveChangesAsync();
        }
        public async Task<bool> DeleteAsync(Guid id)
        {
            var entity = await _context.MediaDex.FindAsync(id);
            if (entity == null)
                return false;
            _context.MediaDex.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
