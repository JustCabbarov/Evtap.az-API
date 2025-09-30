using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public class FilterDTO
    {
        public List<int>? DistrictIds { get; set; }
        public int? AdvertType { get; set; }
        public List<int>? CategoryIds { get; set; }
        public decimal? PriceMin { get; set; }
        public decimal? PriceMax { get; set; }
        public List<int>? Rooms { get; set; }
        public int? Renovation { get; set; }
        public double? AreaMin { get; set; }
        public double? AreaMax { get; set; }
        public int? FloorMin { get; set; }
        public int? FloorMax { get; set; }
        public int? FloorFilterType { get; set; }
        public int? CreatorType { get; set; }
    }
}
