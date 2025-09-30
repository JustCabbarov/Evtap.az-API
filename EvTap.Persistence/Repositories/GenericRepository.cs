using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using EvTap.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Persistence.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity, new()
    {
        private readonly AppDbContext _context;
        private readonly DbSet<T> _dbSet;


        public GenericRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task<T> AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);

            return entity;

        }

        public async Task<T> DeleteAsync(int id)
        {
            var entity = await _dbSet.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                throw new Exception("Entity not found");



            entity.IsDeleted = true;
            _dbSet.Update(entity);

            return entity;
        }

        public async Task<List<T>> GetAllAsync()
        {
            var entities = await _dbSet.AsNoTracking().Where(e => !e.IsDeleted).ToListAsync();
            return entities;
        }

        public async Task<T> GetByIdAsync(int id)
        {
            var entity = await _dbSet.AsNoTracking().Where(e => !e.IsDeleted).FirstOrDefaultAsync(e => e.Id == id);
            if (entity == null)
            {
                throw new Exception("Entity not found");
            }
            return entity;
        }

        public async Task<T> UpdateAsync(T entity)
        {

            var existingEntity = await _dbSet.FindAsync(entity.Id); 
            if (existingEntity == null)
                throw new Exception("Entity tapılmadı");

            _context.Entry(existingEntity).CurrentValues.SetValues(entity);
            await _context.SaveChangesAsync();


            return existingEntity;
        }
    }
}
