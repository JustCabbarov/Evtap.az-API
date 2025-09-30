using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace EvTap.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public UserType UserType { get; set; }

        public ICollection<Listing> Listings { get; set; }



        public ICollection<Message> SentMessages { get; set; }


        public ICollection<Message> ReceivedMessages { get; set; }

    }
}
