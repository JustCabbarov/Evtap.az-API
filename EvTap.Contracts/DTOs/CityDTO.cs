using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.DTOs
{
    public record CityDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }

    }
}
