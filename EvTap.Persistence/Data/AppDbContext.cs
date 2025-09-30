
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;



namespace EvTap.Persistence.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
       

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }





        public DbSet<City> Cities { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Agency> Agencies { get; set; }
        public DbSet<MetroStation> MetroStations { get; set; }
        public DbSet<ListingMetro> listingMetros { get; set; }
        public DbSet<District> Districts { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<ListingFutures> ListingFutures { get; set; }
        public DbSet<ListingImage> ListingImages { get; set; }
        public DbSet<ListingFilter> ListingFilters { get; set; }
        public DbSet<Listing> Listings { get; set; }
        public DbSet<AIAnalysisRequest> AIAnalysisRequests { get; set; }
        public DbSet<Message> Messages { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            
            builder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.SentMessages) 
                .HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);

            
            builder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(m => m.ReceiverId).OnDelete(DeleteBehavior.Restrict);

                base.OnModelCreating(builder);

            builder.Entity<ListingMetro>()
                .HasKey(lm => new { lm.ListingId, lm.MetroStationId });

            builder.Entity<IdentityRole>().HasData(
          new IdentityRole { Id = Guid.NewGuid().ToString(), Name = "Admin", NormalizedName = "ADMIN" },
          new IdentityRole { Id = Guid.NewGuid().ToString(),Name = "User", NormalizedName = "USER" },
          new IdentityRole { Id = Guid.NewGuid().ToString(), Name = "Agency", NormalizedName = "AGENCY" }
      );

        }
    }


}
