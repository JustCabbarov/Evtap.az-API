using EvTap.Application.Exceptions;
using EvTap.Application.Services;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AgencyController : ControllerBase
    {
        private readonly IGenericService<AgencyDTO,Agency> _agencyService;

        public AgencyController(IGenericService<AgencyDTO, Agency> agencyService)
        {
            _agencyService = agencyService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var agency = await _agencyService.GetByIdAsync(id);
           
            return Ok(agency);
        }
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllAsync()
        {
            var agency = await _agencyService.GetAllAsync(q =>
               q.Include(c=>c.Listings)
           );
            var result = agency.Select(c => new
            {
                id=c.Id,
               name=c.Name,
                description=c.Description,
                phoneNumber=c.PhoneNumber,
                email=c.Email,
                address=c.Address,
                listings = c.Listings.Select(l => new
                {
                    l.Id,
                    l.Title
                })
            }).OrderBy(c => c.name);

            return Ok(result);
        }
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AgencyDTO agencyDto)
        {
           
            var createdAgency = await _agencyService.AddAsync(agencyDto);
            return Ok(createdAgency);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AgencyDTO agencyDto)
        {
           
            var updatedAgency = await _agencyService.UpdateAsync(agencyDto);
            
            return Ok(updatedAgency);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _agencyService.DeleteAsync(id);
           
            return NoContent();
        }

    }
}
