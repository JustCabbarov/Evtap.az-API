using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public record RegisterDTO
    {
        public string? Email { get; set; }
        public string Password { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
