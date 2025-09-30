using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Repositories
{
    public interface IUnityOfWork
    {
        Task<int> SaveChangesAsync();
    }
}
