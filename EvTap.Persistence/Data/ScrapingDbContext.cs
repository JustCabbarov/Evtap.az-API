using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Persistence.Data
{
    public class ScrapingDbContext : DbContext
    {

        public ScrapingDbContext(DbContextOptions<ScrapingDbContext> options) : base(options) { }
        public DbSet<ScrapingData> ScrapingDatas { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {

            builder.Entity<ScrapingData>()
            .HasIndex(x => x.ExternalId)
             .IsUnique();

        }
    }
}
