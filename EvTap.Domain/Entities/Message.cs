using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class Message : BaseEntity
    {
     
        public string SenderId { get; set; }
        public ApplicationUser Sender { get; set; }

        public string? ReceiverId { get; set; }
        public ApplicationUser Receiver { get; set; }

        public string Content { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }  
        public DateTime? ReadAt { get; set; }
        public int? ListingId { get; set; }
        public Listing Listing { get; set; }

    }


}
