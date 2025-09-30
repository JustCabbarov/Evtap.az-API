using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetroStationController : ControllerBase
    {
        private readonly IGenericService<MetroStationDTO, MetroStation> _genericService;

        public MetroStationController(IGenericService<MetroStationDTO, MetroStation> genericService)
        {
            _genericService = genericService;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllAsync()
        {
            var metroStations = await _genericService.GetAllAsync();
            var resutl = metroStations.Select(c => new
            {
                id = c.Id,
                name = c.Name

            }).OrderBy(c => c.name);
            return Ok(resutl);
        }
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            var metroStation = await _genericService.GetByIdAsync(id);
            return Ok(metroStation);
        }
        [HttpPost("Create")]
        public async Task<IActionResult> AddAsync(MetroStationDTO metroStationDTO)
        {
            var createdMetroStation = await _genericService.AddAsync(metroStationDTO);
            return Ok(createdMetroStation);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateAsync(MetroStationDTO metroStationDTO)
        {
            var updatedMetroStation = await _genericService.UpdateAsync(metroStationDTO);
            return Ok(updatedMetroStation);
        }
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _genericService.DeleteAsync(id);
            return Ok();
        }
       
    }
}
