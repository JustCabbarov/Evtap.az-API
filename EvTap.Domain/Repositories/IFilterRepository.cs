using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Domain.Repositories
{
    public interface IFilterRepository
    {

        Task<List<Listing>> GetListingsByAdvertTypeAsync(int type);
        Task<List<Listing>> GetListingsByCategoryAsync(int categoryId);
        Task<List<Listing>> GetListingsByPriceRangeAsync(decimal minPrice, decimal maxPrice);
        Task<List<Listing>> GetListingsByRoomsAsync(int rooms);
        Task<List<Listing>> GetListingsByLocationsAsync(List<int> districtIds);
        Task<List<Listing>> GetListingsByMetroStations(List<int> metroIds);
        Task<List<Listing>> GetListingsByFilterAsync(ListingFilter filter);

    }
}
