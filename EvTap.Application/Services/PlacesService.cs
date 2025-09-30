using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using Microsoft.Extensions.Configuration;

namespace EvTap.Application.Services
{
    public class PlacesService : IPlacesService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public PlacesService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Google:ApiKey"];
        }

        public async Task<List<PlaceDTO>> GetNearbyPlacesAsync(double latitude, double longitude, int radius, string category = null)
        {
            // Category varsa, URL-ə əlavə et
            var typeParam = string.IsNullOrWhiteSpace(category) ? "" : $"&type={category}"; 
            var url = $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={latitude},{longitude}&radius={radius}&type={category}&key={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            var places = new List<PlaceDTO>();

            if (root.TryGetProperty("results", out JsonElement results))
            {
                foreach (var place in results.EnumerateArray())
                {
                    var dto = new PlaceDTO
                    {
                        Name = place.GetProperty("name").GetString(),
                        Address = place.TryGetProperty("vicinity", out var vicinity) ? vicinity.GetString() : "Yoxdur",
                        Latitude = place.GetProperty("geometry").GetProperty("location").GetProperty("lat").GetDouble(),
                        Longitude = place.GetProperty("geometry").GetProperty("location").GetProperty("lng").GetDouble(),
                        Rating = place.TryGetProperty("rating", out var r) ? r.GetDouble() : 0,
                        OpenNow = place.TryGetProperty("opening_hours", out var openingHours) &&
                                  openingHours.TryGetProperty("open_now", out var openNow) &&
                                  openNow.ValueKind != JsonValueKind.Null &&
                                  openNow.GetBoolean()
                    };

                    dto.DistanceKm = GetDistanceInKm(latitude, longitude, dto.Latitude, dto.Longitude);

                    places.Add(dto);
                }
            }

            return places;
        }

        private static double GetDistanceInKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0; // Radius in km

            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }
    }
}
