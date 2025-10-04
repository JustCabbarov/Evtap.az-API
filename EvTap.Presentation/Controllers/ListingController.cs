using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
   
    public class ListingController : ControllerBase
    {
        private readonly IListingService _listingservice;

        public ListingController(IListingService listingservice)
        {
            _listingservice = listingservice;
        }

        [HttpGet("GetAllListings")]
        public async Task<IActionResult> GetAllListings()
        {
            var listings = await _listingservice.GetAllListingsAsync();
            return Ok(listings);
        }
        [HttpPost("CreateListing")]
        public async Task<IActionResult> CreateListing([FromForm]ListingDTO listingDto)
        {
            if (listingDto == null)
                return BadRequest("Listing data cannot be null.");
            var createdListing = await _listingservice.CreateListingAsync(listingDto);
            return Ok(createdListing);
        }

        [HttpGet("GetListingById/{id}")]
        public async Task<IActionResult> GetListingById(int id)
        {
            var listing = await _listingservice.GetListingByIdAsync(id);
            if (listing == null)
                return NotFound("Listing not found.");
            return Ok(listing);
        }
        [HttpDelete("DeleteListing/{id}")]
        public async Task<IActionResult> DeleteListing(int id)
        {
            await _listingservice.DeleteListingAsync(id);
            return Ok(new { Message = "Listing deleted successfully." });
        }
        [HttpPut("UpdateListing")]
        public async Task<IActionResult> UpdateListing([FromForm] ListingDTO listingDto)
        {
            if (listingDto == null)
                return BadRequest("Listing data cannot be null.");
            await _listingservice.UpdateListingAsync(listingDto);
            return Ok(new { Message = "Listing updated successfully." });
        }

        [HttpGet("GetListingDetailById/{id}")]
        public async Task<IActionResult> GetListingDetailById(int id)
        {
            var listing = await _listingservice.GetListingDetailByIdAsync(id);
            if (listing == null)
                return NotFound("Listing not found.");
            return Ok(listing);
        }
        [HttpGet("GetListingsDetail")]
        public async Task<IActionResult> GetListingsDetail()
        {
            var listings = await _listingservice.GetListingsDetailAsync();
            return Ok(listings);
        }

    }
}
