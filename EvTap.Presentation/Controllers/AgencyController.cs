using EvTap.Application.Exceptions;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var agencies = await _agencyService.GetAllAsync();
            
            return Ok(agencies);
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
