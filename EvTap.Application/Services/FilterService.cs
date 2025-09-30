using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;

namespace EvTap.Application.Services
{
    public class FilterService : IFilterService
    {
        private readonly IFilterRepository _filterRepo;
        private readonly IMapper _mapper;

        public FilterService(IFilterRepository filterRepo, IMapper mapper)
        {
            _filterRepo = filterRepo;
            _mapper = mapper;
        }

        public async Task<List<ListingDTO>> GetListingsByAdvertTypeAsync(int type)
        {
            var listings = await _filterRepo.GetListingsByAdvertTypeAsync(type);
            return _mapper.Map<List<ListingDTO>>(listings);
        }

        public async Task<List<ListingDTO>> GetListingsByCategoryAsync(int categoryId)
        {
            var listings = await _filterRepo.GetListingsByCategoryAsync(categoryId);
            return _mapper.Map<List<ListingDTO>>(listings);
        }

        public async Task<List<ListingDTO>> GetListingsByFilterAsync(FilterDTO filter)
        {
            var filterEntity = _mapper.Map<ListingFilter>(filter);
            var listings = await _filterRepo.GetListingsByFilterAsync(filterEntity);
            return _mapper.Map<List<ListingDTO>>(listings);
        }

        public async Task<List<ListingDTO>> GetListingsByLocationsAsync(List<int> districtIds)
        {
            var listings = await _filterRepo.GetListingsByLocationsAsync(districtIds);
            return _mapper.Map<List<ListingDTO>>(listings);
        }

        public async Task<List<ListingDTO>> GetListingsByMetroStations(List<int> metroIds)
        {
            var listings = await _filterRepo.GetListingsByMetroStations(metroIds);
            return _mapper.Map<List<ListingDTO>>(listings);
        }

        public async Task<List<ListingDTO>> GetListingsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            var listings = await _filterRepo.GetListingsByPriceRangeAsync(minPrice, maxPrice);
            return _mapper.Map<List<ListingDTO>>(listings);
        }

        public async Task<List<ListingDTO>> GetListingsByRoomsAsync(int rooms)
        {
            var listings = await _filterRepo.GetListingsByRoomsAsync(rooms);
            return _mapper.Map<List<ListingDTO>>(listings);
        }
    }
}
