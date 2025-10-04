using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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

        public async Task<List<Listing>> GetListingsByAdvertTypeAsync(int Type)
        {
            var listings = _context.Listings.Where(l => (int)l.AdvertType == Type).ToList();
            return listings;

        }

        public async Task<List<Listing>> GetListingsByCategoryAsync(int categoryId)
        {
            var listings = _context.Listings.Where(l => l.CategoryId == categoryId).ToList();
            return listings;
        }


        public async Task<List<Listing>> GetListingsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            var listings = _context.Listings.Where(l => l.Price >= minPrice && l.Price <= maxPrice).ToList();
            return listings;
        }

        public async Task<List<Listing>> GetListingsByRoomsAsync(int rooms)
        {
            var listings = _context.Listings.Where(l => l.Rooms == rooms).ToList();
            return listings;
        }

        public async Task<List<Listing>> GetListingsByLocationsAsync(List<int> districtIds)
        {

            var listings = await _context.Listings
                .Where(l => l.Location != null && districtIds.Contains(l.Location.DistrictId.Value))
                .ToListAsync();

            return listings;
        }





        public async Task<List<Listing>> GetListingsByMetroStations(List<int> metroIds)
        {


            var listings = await _context.Listings
                .Where(l => l.ListingMetros.Any(lm => metroIds.Contains(lm.MetroStationId)))
                .ToListAsync();

            return listings;
        }



        public async Task<List<Listing>> GetListingsByFilterAsync(ListingFilter filter)
        {
            IQueryable<Listing> query = _context.Listings
                .Include(l => l.Location)
                .Include(l => l.Category)
                .Include(l => l.Images)
                // YENİ ƏLAVƏ: Metro filteri üçün əlaqəli cədvəli yüklə
                .Include(l => l.ListingMetros);

            // Rayon (district) filteri
            if (filter.DistrictIds != null && filter.DistrictIds.Any())
            {
                query = query.Where(l => l.Location != null
                                        && l.Location.DistrictId.HasValue
                                        && filter.DistrictIds.Contains(l.Location.DistrictId.Value));
            }

            // DÜZƏLİŞ: Metro stansiyası filteri (ListingMetro cədvəri istifadəsi)
            if (filter.MetroStationIds != null && filter.MetroStationIds.Any())
            {
                query = query.Where(l => l.ListingMetros.Any(lm => filter.MetroStationIds.Contains(lm.MetroStationId)));
            }

            // Alqı-satqı növü filteri
            if (filter.AdvertType.HasValue)
                query = query.Where(l => l.AdvertType == filter.AdvertType.Value);

            // Əmlakın növü / category
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
                query = query.Where(l => filter.CategoryIds.Contains(l.CategoryId));

            // Qiymət filteri
            if (filter.PriceMin.HasValue)
                query = query.Where(l => l.Price >= filter.PriceMin.Value);
            if (filter.PriceMax.HasValue)
                query = query.Where(l => l.Price <= filter.PriceMax.Value);


            if (filter.Rooms != null && filter.Rooms.Any())
            {
                if (filter.Rooms.Contains(5))
                {
                    query = query.Where(l =>
                        l.Rooms.HasValue &&
                        (filter.Rooms.Contains(l.Rooms.Value) || l.Rooms.Value >= 5)
                    );
                }
                else
                {
                    query = query.Where(l =>
                        l.Rooms.HasValue &&
                        filter.Rooms.Contains(l.Rooms.Value)
                    );
                }
            }

            // Təmir (Renovation)
            if (filter.Renovation.HasValue)
                query = query.Where(l => l.Renovation == filter.Renovation.Value);

            // Sahə filteri
            if (filter.AreaMin.HasValue)
                query = query.Where(l => l.Area.HasValue && l.Area.Value >= filter.AreaMin.Value);
            if (filter.AreaMax.HasValue)
                query = query.Where(l => l.Area.HasValue && l.Area.Value <= filter.AreaMax.Value);

            // Mərtəbə filteri (FloorMin / FloorMax)
            if (filter.FloorMin.HasValue)
                query = query.Where(l => l.Floor.HasValue && l.Floor.Value >= filter.FloorMin.Value);
            if (filter.FloorMax.HasValue)
                query = query.Where(l => l.Floor.HasValue && l.Floor.Value <= filter.FloorMax.Value);

            // Mərtəbə filteri rəqəmə görə
            if (filter.FloorFilterType.HasValue)
            {
                switch (filter.FloorFilterType.Value)
                {
                    case 1:
                        query = query.Where(l => l.Floor.HasValue && l.Floor.Value > 1);
                        break;
                    case 2:
                        query = query.Where(l => l.Floor.HasValue
                                                 && l.TotalFloors.HasValue
                                                 && l.Floor.Value < l.TotalFloors.Value);
                        break;
                    case 3:
                        query = query.Where(l => l.Floor.HasValue
                                                 && l.TotalFloors.HasValue
                                                 && l.Floor.Value == l.TotalFloors.Value);
                        break;
                }
            }

            if (filter.CreatorType.HasValue)
            {
                query = query.Where(l => (int)l.CreatorType == (int)filter.CreatorType.Value);
            }

            return await query.ToListAsync();
        }
    }
}

