using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using EvTap.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Persistence.Repositories
{
    public class FilterRepository : IFilterRepository
    {
        private readonly AppDbContext _context;

        public FilterRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Listing>> GetListingsByAdvertTypeAsync(int type)
        {
            var data = await _context.Listings
                .AsNoTracking()
                .Include(l => l.Category)
                .Include(l => l.Images)
                .Include(l => l.Location)
                .Include(l => l.ListingMetros)
                    .ThenInclude(lm => lm.MetroStation)
                .Where(l => !l.IsDeleted && (int)l.AdvertType == type)
                .ToListAsync();

            return data;
        }

        public async Task<List<Listing>> GetListingsByCategoryAsync(int categoryId)
        {
            var listings = await _context.Listings
                .AsNoTracking()
                .Include(l => l.Category)
                .Include(l => l.Images)
                .Include(l => l.ListingMetros)
                    .ThenInclude(lm => lm.MetroStation)
                .Where(l => !l.IsDeleted && l.CategoryId == categoryId)
                .ToListAsync();

            return listings;
        }

        public async Task<List<Listing>> GetListingsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            var listings = await _context.Listings
                .AsNoTracking()
                .Where(l => !l.IsDeleted && l.Price >= minPrice && l.Price <= maxPrice)
                .ToListAsync();

            return listings;
        }

        public async Task<List<Listing>> GetListingsByRoomsAsync(int rooms)
        {
            var listings = await _context.Listings
                .AsNoTracking()
                .Where(l => !l.IsDeleted && l.Rooms == rooms)
                .ToListAsync();

            return listings;
        }

        public async Task<List<Listing>> GetListingsByLocationsAsync(List<int> districtIds)
        {
            var listings = await _context.Listings
                .AsNoTracking()
                .Where(l => !l.IsDeleted &&
                            l.Location != null &&
                            l.Location.DistrictId.HasValue &&
                            districtIds.Contains(l.Location.DistrictId.Value))
                .ToListAsync();

            return listings;
        }

        public async Task<List<Listing>> GetListingsByMetroStations(List<int> metroIds)
        {
            var listings = await _context.Listings
                .AsNoTracking()
                .Where(l => !l.IsDeleted &&
                            l.ListingMetros.Any(lm => metroIds.Contains(lm.MetroStationId)))
                .ToListAsync();

            return listings;
        }

        public async Task<List<Listing>> GetListingsByFilterAsync(ListingFilter filter)
        {
            IQueryable<Listing> query = _context.Listings
                .AsNoTracking()
                .Include(l => l.Location)
                .Include(l => l.Category)
                .Include(l => l.Images)
                .Include(l => l.ListingMetros)
                .Where(l => !l.IsDeleted); // 🔹 əsas filter

            // Rayon filteri
            if (filter.DistrictIds != null && filter.DistrictIds.Any())
            {
                query = query.Where(l => l.Location != null
                                        && l.Location.DistrictId.HasValue
                                        && filter.DistrictIds.Contains(l.Location.DistrictId.Value));
            }

            // Metro filteri
            if (filter.MetroStationIds != null && filter.MetroStationIds.Any())
            {
                query = query.Where(l => l.ListingMetros.Any(lm => filter.MetroStationIds.Contains(lm.MetroStationId)));
            }

            // Elan növü (alqı-satqı, kirayə)
            if (filter.AdvertType.HasValue)
                query = query.Where(l => l.AdvertType == filter.AdvertType.Value);

            // Əmlak növü (category)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
                query = query.Where(l => filter.CategoryIds.Contains(l.CategoryId));

            // Qiymət aralığı
            if (filter.PriceMin.HasValue)
                query = query.Where(l => l.Price >= filter.PriceMin.Value);
            if (filter.PriceMax.HasValue)
                query = query.Where(l => l.Price <= filter.PriceMax.Value);

            // Otaq sayı
            if (filter.Rooms != null && filter.Rooms.Any())
            {
                if (filter.Rooms.Contains(5))
                {
                    query = query.Where(l =>
                        l.Rooms.HasValue &&
                        (filter.Rooms.Contains(l.Rooms.Value) || l.Rooms.Value >= 5));
                }
                else
                {
                    query = query.Where(l =>
                        l.Rooms.HasValue &&
                        filter.Rooms.Contains(l.Rooms.Value));
                }
            }

            // Təmir vəziyyəti
            if (filter.Renovation.HasValue)
                query = query.Where(l => l.Renovation == filter.Renovation.Value);

            // Sahə aralığı
            if (filter.AreaMin.HasValue)
                query = query.Where(l => l.Area.HasValue && l.Area.Value >= filter.AreaMin.Value);
            if (filter.AreaMax.HasValue)
                query = query.Where(l => l.Area.HasValue && l.Area.Value <= filter.AreaMax.Value);

            // Mərtəbə aralığı
            if (filter.FloorMin.HasValue)
                query = query.Where(l => l.Floor.HasValue && l.Floor.Value >= filter.FloorMin.Value);
            if (filter.FloorMax.HasValue)
                query = query.Where(l => l.Floor.HasValue && l.Floor.Value <= filter.FloorMax.Value);

            // Mərtəbə növü
            if (filter.FloorFilterType.HasValue)
            {
                switch (filter.FloorFilterType.Value)
                {
                    case 1: // Aralıq mərtəbə
                        query = query.Where(l => l.Floor.HasValue && l.Floor.Value > 1);
                        break;
                    case 2: // Orta mərtəbələr
                        query = query.Where(l => l.Floor.HasValue &&
                                                 l.TotalFloors.HasValue &&
                                                 l.Floor.Value < l.TotalFloors.Value);
                        break;
                    case 3: // Sonuncu mərtəbə
                        query = query.Where(l => l.Floor.HasValue &&
                                                 l.TotalFloors.HasValue &&
                                                 l.Floor.Value == l.TotalFloors.Value);
                        break;
                }
            }

            // Elan yaradan tip (mülk sahibi / agent)
            if (filter.CreatorType.HasValue)
            {
                query = query.Where(l => (int)l.CreatorType == (int)filter.CreatorType.Value);
            }

            return await query.ToListAsync();
        }
    }
}
