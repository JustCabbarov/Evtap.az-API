using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilterController : ControllerBase
    {
       private readonly IFilterService _filterService;
        public FilterController(IFilterService filterService)
        {
            _filterService = filterService;
        }
        
        [HttpGet("GetListingsByAdvertType")]
        public async Task<IActionResult> GetListingsByAdvertType(int type)
        {
            var listings = await _filterService.GetListingsByAdvertTypeAsync(type);
            return Ok(listings);
        }
        [HttpGet("GetListingsByCategory")]
        public async Task<IActionResult> GetListingsByCategory(int categoryId)
        {
            var listings = await _filterService.GetListingsByCategoryAsync(categoryId);
            return Ok(listings);
        }
        [HttpGet("GetListingsByPriceRange")]
        public async Task<IActionResult> GetListingsByPriceRange(decimal minPrice, decimal maxPrice)
        {
            var listings = await _filterService.GetListingsByPriceRangeAsync(minPrice, maxPrice);
            return Ok(listings);
        }
        [HttpGet("GetListingsByRooms")]
        public async Task<IActionResult> GetListingsByRooms(int rooms)
        {
            var listings = await _filterService.GetListingsByRoomsAsync(rooms);
            return Ok(listings);
        }
        [HttpGet("GetListingsByLocations")]
        public async Task<IActionResult> GetListingsByLocations( List<int> districtIds)
        {
            var listings = await _filterService.GetListingsByLocationsAsync(districtIds);
            return Ok(listings);
        }
        [HttpGet("GetListingsByMetroStations")]
        public async Task<IActionResult> GetListingsByMetroStations([FromBody] List<int> metroIds)
        {
            var listings = await _filterService.GetListingsByMetroStations(metroIds);
            return Ok(listings);
        }

        [HttpPost("GetListingsByFilter")]
        public async Task<IActionResult> GetListingsByFilter([FromBody] FilterDTO filter)
        {
            var listings = await _filterService.GetListingsByFilterAsync(filter);
            return Ok(listings);
        }

    }
}
