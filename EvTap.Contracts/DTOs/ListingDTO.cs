using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;
using EvTap.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace EvTap.Contracts.DTOs
{
    public class ListingDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }

        public AdvertType AdvertType { get; set; }
        public int? Rooms { get; set; }
        public int? Floor { get; set; }
        public int? TotalFloors { get; set; }
        public double? Area { get; set; }

        public RenovationType Renovation { get; set; }
        public ListingType CreatorType { get; set; }
        public bool IsPremium { get; set; }
        public DateTime? PremiumExpireDate { get; set; }

        public List<IFormFile> Image { get; set; }
        public List<int> MetroIds { get; set; } = new List<int>();
        public int CategoryId { get; set; }

        public int? AgencyId { get; set; }
        public string UserId { get; set; }

        public LocationDTO Location { get; set; }
    }
}
