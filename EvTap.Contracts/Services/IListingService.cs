using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Contracts.DTOs;

namespace EvTap.Contracts.Services
{
    public interface IListingService
    { 
        Task <IEnumerable<Listing>> GetAllListingsAsync();
        Task<Listing> GetListingByIdAsync(int listingId);
        Task<Listing> CreateListingAsync(ListingDTO listing);
        Task UpdateListingAsync(ListingDTO listing);
        Task DeleteListingAsync(int listingId);

        Task<Listing> GetListingDetailByIdAsync(int listingId);
        Task<List<Listing>> GetListingsDetailAsync();
    }
}
