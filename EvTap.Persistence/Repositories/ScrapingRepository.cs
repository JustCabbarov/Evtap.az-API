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
    public class ScrapingRepository : IScrapingRepository
    {
        private readonly ScrapingDbContext _db;

        public ScrapingRepository(ScrapingDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(ScrapingData data)
        {
            _db.ScrapingDatas.Add(data);
            await _db.SaveChangesAsync();
        }
        public async Task<bool> ExistsAsync(string externalId)
        {
            return await _db.ScrapingDatas.AnyAsync(x => x.ExternalId == externalId);
        
        }

    }

}
