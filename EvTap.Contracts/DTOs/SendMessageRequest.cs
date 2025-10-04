using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public class SendMessageRequst
    {
        public string? ReceiverId { get; set; }

        public int? ListingId { get; set; }

        public string Content { get; set; } = string.Empty;

        public bool IsAdminMessage { get; set; } = false;
    }
}