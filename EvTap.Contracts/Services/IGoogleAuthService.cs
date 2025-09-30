using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.Services
{
    public interface IGoogleAuthService
    {
        Task<string> HandleGoogleLoginAsync();
    }
}
