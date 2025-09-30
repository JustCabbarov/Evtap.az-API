
using EvTap.Domain.Entities;
using EvTap.Domain.Enums;

public class Listing : BaseEntity
{
    public string Title { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }

    public AdvertType AdvertType { get; set; }

    public int? Rooms { get; set; }
    public int? Floor { get; set; }
    public int? TotalFloors { get; set; }
    public double? Area { get; set; }

    public RenovationType Renovation { get; set; }
    public ListingType CreatorType { get; set; }
    public bool IsPremium { get; set; }
    public DateTime? PremiumExpireDate { get; set; }

    // Category
    public int CategoryId { get; set; }
    public Category Category { get; set; }

    // Agency
    public int? AgencyId { get; set; }
    public Agency? Agency { get; set; }

    // User
    public string UserId { get; set; }
    public ApplicationUser User { get; set; }

    // Location
    public int LocationId { get; set; }
    public Location Location { get; set; }

    // Collections
    public ICollection<ListingImage> Images { get; set; }
    public ICollection<ListingFutures> Features { get; set; }

    // Metro Many-to-Many
    public ICollection<ListingMetro> ListingMetros { get; set; }
}