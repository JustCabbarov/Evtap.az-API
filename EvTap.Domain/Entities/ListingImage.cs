using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class ListingImage : BaseEntity
    {
        public string ImageUrl { get; set; }
        public bool IsCover { get; set; } 
        public int? ListingId { get; set; }
   
    }
}
