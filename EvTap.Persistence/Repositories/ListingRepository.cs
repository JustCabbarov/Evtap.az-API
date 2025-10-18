using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Repositories;
using EvTap.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Persistence.Repositories
{
    public class ListingRepository : IListingRepository
    {
        private readonly AppDbContext _db;

        public ListingRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Listing>> GelListingByUserIdAsync(string userId)
        {
            var data = await _db.Listings
      .Include(l => l.Category)
      .Include(l => l.Images)
      .Include(l => l.Location)
      .Include(l => l.ListingMetros)
          .ThenInclude(lm => lm.MetroStation)
      .Where(l => l.UserId == userId && l.IsDeleted == false)
      .ToListAsync();

            return data;

        }
        public async Task<List<Listing>> GetListingtDetailAsync()
        {
            var data = await _db.Listings
                .Include(l => l.Category)
                .Include(l => l.Images)
                .Include(l => l.Location)
                .Include(l => l.ListingMetros)
                    .ThenInclude(lm => lm.MetroStation)
                .Where(l => l.IsDeleted == false)
                .ToListAsync();

            return data;
        }


        public Task<Listing> GetListingtDetailByIdAsync(int id)
        {
            var data = _db.Listings
                .Include(l => l.Category)
                .Include(l => l.Images)
                .Include(l => l.Location)
                .Include(l => l.ListingMetros)
                    .ThenInclude(lm => lm.MetroStation)
                .FirstOrDefaultAsync(l => l.Id == id && l.IsDeleted == false);

            return data;
        }

    }
}
