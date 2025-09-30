using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Contracts.Services
{

    public interface IGenericService<TVM, TEntity> where TEntity : BaseEntity, new()
    {
        Task<TVM> GetByIdAsync(int id);
        Task<IEnumerable<TVM>> GetAllAsync();
        Task<TVM> AddAsync(TVM entity);
        Task<TVM> UpdateAsync(TVM entity);
        Task<bool> DeleteAsync(int id);

    }
   
}
