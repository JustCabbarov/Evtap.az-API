using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class ListingFutures : BaseEntity
    {

        
        public string Name { get; set; }     
        public string Description { get; set; }

        public ICollection<Listing> Listings { get; set; }
    }
}
