using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class ScrapingData
    {

      
        
            public int Id { get; set; } 
            public string ExternalId { get; set; } = "";
            public int? CategoryId { get; set; }
            public string? City { get; set; } = "";
            public string? Location { get; set; } = "";
            public decimal  ? Price { get; set; }
            public string? Currency { get; set; } = "";
            public double? Area { get; set; }
            public string? AreaUnit { get; set; } = "";
            public int? Rooms { get; set; }
            public int? Floor { get; set; }
            public int? TotalFloors { get; set; }

       
            public bool? HasRepair { get; set; } 
            public bool? HasMortgage { get; set; } 
            public bool? HasBillOfSale { get; set; } 
            public bool? Leased { get; set; } 
            public bool? Vipped { get; set; } 
            public bool? Featured { get; set; }

       
        public DateTime? UpdatedAt
        {
            get => _updatedAt;
            set => _updatedAt = value?.ToUniversalTime();
        }
        private DateTime? _updatedAt;

        public DateTime? CreatedAt
        {
            get => _createdAt;
            set => _createdAt = value?.ToUniversalTime();
        }
        private DateTime? _createdAt;

        public DateTime? PublishedAt
        {
            get => _publishedAt;
            set => _publishedAt = value?.ToUniversalTime();
        }
        private DateTime? _publishedAt;
    }



    }
