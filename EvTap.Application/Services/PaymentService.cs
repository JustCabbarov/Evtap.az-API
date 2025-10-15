using Stripe.Checkout;
using Stripe;
using EvTap.Domain.Repositories;
using EvTap.Domain.Entities;
using EvTap.Contracts.Services;
using Microsoft.Extensions.Configuration;

namespace EvTap.Application.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IGenericRepository<Listing> _listingRepository;
        private readonly IConfiguration _configuration;

        public PaymentService(IGenericRepository<Listing> listingRepository, IConfiguration configuration)
        {
            _listingRepository = listingRepository;
            _configuration = configuration;
            StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];
        }

        public async Task<string> CreatePaymentSessionAsync(int listingId, decimal amount)
        {
            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null || listing.IsPremium)
                throw new KeyNotFoundException("Elan tapılmadı və ya artıq VIPdir.");

            // Frontend URL-ləri configdən götürmək daha düzgündür
            var frontendBaseUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:5501"; 

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            UnitAmount = (long)(amount * 100),
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = listing.Title
                            }
                        },
                        Quantity = 1
                    }
                },
                Mode = "payment",
                Metadata = new Dictionary<string, string>
                {
                    { "listingId", listingId.ToString() }
                },
                SuccessUrl = $"{frontendBaseUrl}/Payment.html?sessionId={{CHECKOUT_SESSION_ID}}",

                CancelUrl = $"{frontendBaseUrl}/cancel.html"
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);
            return session.Url;
        }

        public async Task<bool> ConfirmPaymentAsync(string sessionId)
        {
            var service = new SessionService();
            var session = await service.GetAsync(sessionId);

            if (session.PaymentStatus != "paid")
                return false;

            if (!session.Metadata.TryGetValue("listingId", out var listingIdStr) ||
                !int.TryParse(listingIdStr, out var listingId))
                return false;

            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
                return false;

            listing.IsPremium = true;
            await _listingRepository.UpdateAsync(listing);
            return true;
        }
    }
}
