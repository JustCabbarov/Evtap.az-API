using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvTap.Presentation.Controllers
{
    
    [Route("api/[controller]")]
    [ApiController]
    public class CityController : ControllerBase
    {
        private readonly IGenericService<CityDTO,City> _genericService;

        public CityController(IGenericService<CityDTO, City> genericService)
        {
            _genericService = genericService;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllAsync()
        {
            var cities = await _genericService.GetAllAsync(); 
            var result = cities.Select(c => new
            {
                id = c.Id,
                name = c.Name
            }).OrderBy(c => c.name);
            return Ok(result);
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {

            var city = await _genericService.GetByIdAsync(id);
            return Ok(city);
        }
        [HttpPost("Create")]
        public async Task<IActionResult> AddAsync(CityDTO cityDTO)
        {
            var createdCity = await _genericService.AddAsync(cityDTO);
            return Ok(createdCity);
        }

        [HttpPut]
        
       public async Task<IActionResult> UpdateAsync( CityDTO cityDTO)
        {
            var updatedCity = await _genericService.UpdateAsync( cityDTO);
            return Ok(updatedCity);
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
