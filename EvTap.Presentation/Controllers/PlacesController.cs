using EvTap.Contracts.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlacesController : ControllerBase
    {
        private readonly IPlacesService _placesService;

        public PlacesController(IPlacesService placesService)
        {
            _placesService = placesService;
        }

        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearbyPlaces(
            [FromQuery] double lat,
            [FromQuery] double lng,
            [FromQuery] int radius = 1500,
            [FromQuery] string? category = null) 
        {
            var results = await _placesService.GetNearbyPlacesAsync(lat, lng, radius, category);
            return Ok(results);
        }
    }
}
