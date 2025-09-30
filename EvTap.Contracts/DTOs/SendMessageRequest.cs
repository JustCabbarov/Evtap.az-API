using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public record SendMessageRequest
    {
        public int ListingId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
