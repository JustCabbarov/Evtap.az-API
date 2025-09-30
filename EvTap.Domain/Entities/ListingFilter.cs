using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Enums;

namespace EvTap.Domain.Entities
{
    public class ListingFilter : BaseEntity
    {
     
        
            public List<int>? DistrictIds { get; set; }

            // Alqı-satqı növü
            public AdvertType? AdvertType { get; set; }

            // Əmlakın növü / category
            public List<int>? CategoryIds { get; set; }

            // Qiymət filteri
            public decimal? PriceMin { get; set; }
            public decimal? PriceMax { get; set; }

            // Otaq sayı
            public List<int>? Rooms { get; set; }

            // Təmir (Renovation)
            public RenovationType? Renovation { get; set; }

            // Sahə filteri
            public double? AreaMin { get; set; }
            public double? AreaMax { get; set; }

            // Mərtəbə filteri
            public int? FloorMin { get; set; }
            public int? FloorMax { get; set; }

         
            public int? FloorFilterType { get; set; }

            // Satıcı tipi
            public UserType? CreatorType { get; set; }
        

    }
}
