using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Domain.Repositories
{
    public interface IUserRepository
    {
        Task<List<ApplicationUser>> GetAllUsersAsync();

    }
}
