using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Contracts.DTOs
{
    public class MetroStationDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public ICollection<ListingMetro>?ListingMetros { get; set; }
        public ICollection<Listing>? Listings { get; set; }
    }

}
