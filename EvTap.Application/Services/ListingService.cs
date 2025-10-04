using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using EvTap.Application.Exceptions;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace EvTap.Application.Services
{
    public class ListingService : IListingService
    {
        private readonly IGenericRepository<Listing> _listingRepository;
        private readonly IListingRepository _customListingRepository;
        private readonly IGenericRepository<Location> _locationRepository;
        private readonly IUnityOfWork _unityOfWork;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ListingService> _logger;

        public ListingService(IGenericRepository<Listing> listingRepository, IMapper mapper, IWebHostEnvironment env, ILogger<ListingService> logger, IGenericRepository<Location> locationRepository, IUnityOfWork unityOfWork, IListingRepository customListingRepository)
        {
            _listingRepository = listingRepository;
            _mapper = mapper;
            _env = env;
            _logger = logger;
            _locationRepository = locationRepository;
            _unityOfWork = unityOfWork;
            _customListingRepository = customListingRepository;
        }

        public async Task<Listing> CreateListingAsync(ListingDTO listingDto)
        {
            if (listingDto.Image == null || !listingDto.Image.Any())
                throw new NotNullExceptions("Please upload at least one image.");

            // 🔹 Listing yarat
            var listing = _mapper.Map<Listing>(listingDto);

            // 🔹 Location əlavə et
            if (listingDto.Location != null)
            {
                var location = _mapper.Map<Location>(listingDto.Location);
                await _locationRepository.AddAsync(location);
                await _unityOfWork.SaveChangesAsync();

                listing.LocationId = location.Id;
            }

            // 🔹 Listing-i database-ə əlavə et ki, Id dolsun
            await _listingRepository.AddAsync(listing);
            await _unityOfWork.SaveChangesAsync(); // indi listing.Id mövcuddur

            // 🔹 Images əlavə et
            listing.Images = new List<ListingImage>();
            var rootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsFolder = Path.Combine(rootPath, "uploads", "listings");
            Directory.CreateDirectory(uploadsFolder);

            foreach (var file in listingDto.Image)
            {
                if (!file.ContentType.StartsWith("image/"))
                    throw new Exception("Please upload a valid image file.");
                if (file.Length > 2 * 1024 * 1024)
                    throw new Exception("Image size must be less than 2MB.");

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                listing.Images.Add(new ListingImage
                {
                    ImageUrl = "/uploads/listings/" + fileName,
                    IsCover = false,
                    ListingId = listing.Id // Id artıq mövcuddur
                });
            }

            if (listing.Images.Any())
                listing.Images.First().IsCover = true;

            // 🔹 Metro mapping
            listing.ListingMetros = listingDto.MetroIds
                .Select(id => new ListingMetro
                {
                    MetroStationId = id,
                    ListingId = listing.Id
                })
                .ToList();

            // 🔹 Yenidən update et ki, images və metros database-ə yazılsın
            await _listingRepository.UpdateAsync(listing);
            await _unityOfWork.SaveChangesAsync();

            _logger.LogInformation($"New listing created with ID: {listing.Id}");

            return listing;
        }




        public async Task DeleteListingAsync(int listingId)
        {
            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
                throw new Exception("Listing not found.");

            foreach (var img in listing.Images)
            {
                var filePath = Path.Combine(_env.WebRootPath, img.ImageUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }


            await _listingRepository.DeleteAsync(listingId);
            await _unityOfWork.SaveChangesAsync();
            _logger.LogInformation($"Listing with ID: {listingId} has been deleted.");
        }


        public async Task<IEnumerable<Listing>> GetAllListingsAsync()
        {
            return await _listingRepository.GetAllAsync();
        }

      
        public async Task<Listing> GetListingByIdAsync(int listingId)
        {
            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
                throw new Exception("Listing not found.");
          _logger.LogInformation($"Listing with ID: {listingId} retrieved.");

            return listing;
        }

        public async Task<Listing> GetListingDetailByIdAsync(int listingId)
        {
            var listing = await _customListingRepository.GetListingtDetailByIdAsync(listingId);
            if (listing == null)
                throw new Exception("Listing not found.");
            _logger.LogInformation($"Listing with ID: {listingId} retrieved.");
            var result = _mapper.Map<Listing>(listing);
            return result;
        }

        public async Task<List<Listing>> GetListingsDetailAsync()
        {
            var listings = await _customListingRepository.GetListingtDetailAsync();
            var result = _mapper.Map<List<Listing>>(listings);  
            return result;
        }

        public async Task UpdateListingAsync(ListingDTO listingDto)
        {
            var listing = await _listingRepository.GetByIdAsync(listingDto.Id);
            if (listing == null)
                throw new Exception("Listing not found.");

            _mapper.Map(listingDto, listing);

           
            if (listingDto.Location != null)
            {
                var location = _mapper.Map<Location>(listingDto.Location);
                await _locationRepository.AddAsync(location);

                listing.LocationId = location.Id;
            }

            listing.Images ??= new List<ListingImage>();

            if (listingDto.Image != null && listingDto.Image.Any())
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads/listings");
                Directory.CreateDirectory(uploadsFolder);

                foreach (var file in listingDto.Image)
                {
                    if (!file.ContentType.StartsWith("image/"))
                        throw new Exception("Please upload a valid image file.");
                    if (file.Length > 2 * 1024 * 1024)
                        throw new Exception("Image size must be less than 2MB.");

                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    listing.Images.Add(new ListingImage
                    {
                        ImageUrl = "/uploads/listings/" + fileName,
                        IsCover = false
                    });
                }

                if (listing.Images.Any())
                    listing.Images.First().IsCover = true;
            }

            await _listingRepository.UpdateAsync(listing);
            await _unityOfWork.SaveChangesAsync();
            _logger.LogInformation($"Listing with ID: {listing.Id} has been updated.");
        }

    }
}
