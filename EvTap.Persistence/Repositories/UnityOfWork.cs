using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Repositories;
using EvTap.Persistence.Data;
using static EvTap.Persistence.Repositories.UnityOfWork;

namespace EvTap.Persistence.Repositories
{
     public class UnityOfWork : IUnityOfWork
        {
            private readonly AppDbContext _context;

            public UnityOfWork(AppDbContext context)
            {
                _context = context;
            }

            public async Task<int> SaveChangesAsync()
            {
                return await _context.SaveChangesAsync();
            }
        }
    
}
