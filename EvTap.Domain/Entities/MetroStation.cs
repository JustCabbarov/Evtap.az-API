using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class MetroStation : BaseEntity
    {
        public string Name { get; set; }

       
        public ICollection<ListingMetro> ListingMetros { get; set; }
    }
}
