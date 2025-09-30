using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Contracts.DTOs;
using EvTap.Domain.Entities;

namespace EvTap.Contracts.Services
{
    public interface IFilterService
    {
        Task<List<ListingDTO>> GetListingsByAdvertTypeAsync(int type);
        Task<List<ListingDTO>> GetListingsByCategoryAsync(int categoryId);
        Task<List<ListingDTO>> GetListingsByPriceRangeAsync(decimal minPrice, decimal maxPrice);
        Task<List<ListingDTO>> GetListingsByRoomsAsync(int rooms);
        Task<List<ListingDTO>> GetListingsByLocationsAsync(List<int> districtIds);
        Task<List<ListingDTO>> GetListingsByMetroStations(List<int> metroIds);
        Task<List<ListingDTO>> GetListingsByFilterAsync(FilterDTO filter);
    }
}
