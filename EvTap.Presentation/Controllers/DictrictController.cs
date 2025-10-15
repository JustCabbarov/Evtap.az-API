using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DictrictController : ControllerBase
    {
        private readonly IGenericService<DistrictDTO,District> _genericService;
        public DictrictController(IGenericService<DistrictDTO, District> genericService)
        {
            _genericService = genericService;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllAsync()
        {
            var districts = await _genericService.GetAllAsync(c=>c.Include(c=>c.Locations).ThenInclude(c=>c.Listings)); 
            var result = districts.Select(d => new
            {
                id = d.Id,
                name = d.Name,
                location= d.Locations.Select(l=>new 
                {
                    
                    l.Address,
                    listings = l.Listings.Select(li=> new 
                    {
                        li.Id,
                        li.Title
                    })
                })
            })
            .OrderBy(d => d.name); 
            return Ok(result);
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            var district = await _genericService.GetByIdAsync(id);
            return Ok(district);
        }
        [HttpPost("Create")]
        public async Task<IActionResult> AddAsync(DistrictDTO districtDTO)
        {
            var createdDistrict = await _genericService.AddAsync(districtDTO);
            return Ok(createdDistrict);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateAsync(DistrictDTO districtDTO)
        {
            var updatedDistrict = await _genericService.UpdateAsync(districtDTO);
            return Ok(updatedDistrict);
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
