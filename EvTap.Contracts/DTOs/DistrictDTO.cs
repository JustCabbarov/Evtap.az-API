using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public record DistrictDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public int CityId { get; set; }
        public ICollection<LocationDTO>? Locations { get; set; }
        public List<ListingDTO>? Listings { get; set; }
    }
}
