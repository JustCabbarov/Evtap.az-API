using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Entities
{
    public class City : BaseEntity
    {
  
        public string Name { get; set; }

        public ICollection<District> ?Districts { get; set; }
    }
}
