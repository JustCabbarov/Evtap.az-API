using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Domain.Repositories
{
    public interface IScrapingRepository
    {
        Task AddAsync(ScrapingData data);
        Task<bool> ExistsAsync(string externalId);
       


    }
}
