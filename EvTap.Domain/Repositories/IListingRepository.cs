using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Domain.Repositories
{
    public interface IListingRepository
    {
      Task <Listing> GetListingtDetailByIdAsync(int id);
      Task <List<Listing>> GetListingtDetailAsync();
      
        Task<List<Listing>> GelListingByUserIdAsync(string userId);
    }
}
