using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class Location : BaseEntity
    {
        public string Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public int? DistrictId { get; set; }
        public District? District { get; set; }



        [JsonIgnore]
        public ICollection<Listing> Listings { get; set; }
    }

}
