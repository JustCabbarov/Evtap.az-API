using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Quartz;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Infrastructure.Jobs
{
    public class ScraperJob : IJob
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IScrapingRepository _scrapingRepository;
        private readonly ILogger<ScraperJob> _logger;

        private static readonly int[] CategoryIds = { 1, 2, 5, 7, 10 };
        private static int _currentIndex = 0;
        private static readonly object _lock = new object();

        public ScraperJob(
            IHttpClientFactory httpClientFactory,
            IScrapingRepository scrapingRepository,
            ILogger<ScraperJob> logger)
        {
            _httpClientFactory = httpClientFactory;
            _scrapingRepository = scrapingRepository;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            int categoryId;
            lock (_lock)
            {
                categoryId = CategoryIds[_currentIndex];
                _currentIndex = (_currentIndex + 1) % CategoryIds.Length;
            }

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

            string graphqlUrl = "https://bina.az/graphql";

            var payload = new
            {
                operationName = "SearchItems",
                variables = new
                {
                    first = 20,
                    filter = new { cityId = "1", categoryId = categoryId.ToString() },
                    sort = "BUMPED_AT_DESC"
                },
                extensions = new
                {
                    persistedQuery = new
                    {
                        version = 1,
                        sha256Hash = "872e9c694c34b6674514d48e9dcf1b46241d3d79f365ddf20d138f18e74554c5"
                    }
                }
            };

            var jsonPayload = new StringContent(
                JsonConvert.SerializeObject(payload),
                Encoding.UTF8,
                "application/json"
            );

            try
            {
                var response = await httpClient.PostAsync(graphqlUrl, jsonPayload);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Error: {response.StatusCode} (Category: {categoryId})");
                    return;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(responseContent);

                var items = data["data"]?["itemsConnection"]?["edges"];
           

                if (items == null)
                {
                    _logger.LogWarning($"No items found for category {categoryId}");
                    return;
                }

                foreach (var item in items)
                {
                    var node = item["node"];
                    if (node == null) continue;

                    string externalId = node["id"]?.ToString() ?? "";

                    
                    if (await _scrapingRepository.ExistsAsync(externalId))
                        continue;
                    var scrapingData = new ScrapingData
                    {
                        ExternalId = externalId,
                        City = node["city"]?["name"]?.ToString() ?? "",
                        Location = node["location"]?["name"]?.ToString() ?? "",
                        Price = node["price"]?["value"]?.ToObject<decimal?>() ?? 0,
                        Currency = node["price"]?["currency"]?.ToString() ?? "",
                        Area = node["area"]?["value"]?.ToObject<double?>() ?? 0,
                        AreaUnit = node["area"]?["units"]?.ToString() ?? "",
                        Rooms = node["rooms"]?.ToObject<int?>() ?? 0,
                        Floor = node["floor"]?.ToObject<int?>() ?? 0,
                        TotalFloors = node["floors"]?.Type == JTokenType.Null
                            ? (int?)null
                            : node["floors"]?.ToObject<int?>(),
                        HasRepair = node["hasRepair"]?.ToObject<bool?>() ?? false,
                        HasMortgage = node["hasMortgage"]?.ToObject<bool?>() ?? false,
                        HasBillOfSale = node["hasBillOfSale"]?.ToObject<bool?>() ?? false,
                        Leased = node["leased"]?.ToObject<bool?>() ?? false,
                        Vipped = node["vipped"]?.ToObject<bool?>() ?? false,
                        Featured = node["featured"]?.ToObject<bool?>() ?? false,
                        UpdatedAt = node["updatedAt"]?.ToObject<DateTime?>(),
                        CreatedAt = node["createdAt"]?.ToObject<DateTime?>(),
                        PublishedAt = node["publishedAt"]?.ToObject<DateTime?>(),

                       
                        CategoryId = categoryId
                    };


                    await _scrapingRepository.AddAsync(scrapingData);
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception occurred while scraping category {categoryId}");
            }
        }
    }
}
