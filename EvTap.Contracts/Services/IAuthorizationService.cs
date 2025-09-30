using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Contracts.DTOs;
using Microsoft.AspNetCore.Identity;

namespace EvTap.Contracts.Services
{
    public interface IAuthorizationService
    {
        Task<string> LoginAsync(LoginDTO loginDTO);
        Task<IdentityResult> RegisterAsync(RegisterDTO registerDTO);
        Task LogoutAsync();
        Task<IdentityResult> ConfirmEmailAsync(string userId, string token);

      

    }
}
