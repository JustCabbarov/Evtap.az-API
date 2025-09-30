using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class AIAnalysisRequest : BaseEntity
    {
       

        public int ListingId { get; set; }
        public Listing Listing { get; set; }

        public string Prompt { get; set; } = string.Empty;


        public string? Response { get; set; }


       
        public DateTime? CompletedAt { get; set; }
        public bool IsSuccess { get; set; }       
    }

}
