using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public class LocationDTO
    {
        public string Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int? DistrictId { get; set; }
        public List<ListingDTO>? Listings { get; set; }
    }
}
