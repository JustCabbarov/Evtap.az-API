using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Contracts.Services
{
    public interface ITokenHandler
    {
        Task <string> CreateAccessTokenAsync(ApplicationUser user);
        Task<bool> ValidateTokenAsync(string token);
    }
}
