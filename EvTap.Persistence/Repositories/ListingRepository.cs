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

        public async Task<List<Listing>> GetListingtDetailAsync()
        {
          var data= await _db.Listings.Include(l=>l.Category).Include(l=>l.Location).Include(l=>l.ListingMetros).ThenInclude(_db=>_db.MetroStation).ToListAsync();
            return data;

        }

        public Task<Listing> GetListingtDetailByIdAsync(int id)
        {
          var data=  _db.Listings.Include(l => l.Category).Include(l => l.Location).Include(l => l.ListingMetros).ThenInclude(_db => _db.MetroStation).FirstOrDefaultAsync(l=>l.Id==id);
            return data;
        }
    }
}
