using Microsoft.AspNetCore.Mvc;
using EvTap.Contracts.Services;

namespace EvTap.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private const decimal STANDARD_AMOUNT = 10m; // Standart qiymət: 10 USD

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        // Ödəniş sessiyası yarat
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment(int listingId)
        {
            try
            {
                var url = await _paymentService.CreatePaymentSessionAsync(listingId, STANDARD_AMOUNT);
                return Ok(new { paymentUrl = url });
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("success")]
        public async Task<IActionResult> Success(string sessionId)
        {
            var result = await _paymentService.ConfirmPaymentAsync(sessionId);
            if (result)
            {
                // Ödəniş uğurludursa, frontend-ə yönləndiririk
                return Redirect("http://localhost:5501/index.html?payment=success");
            }

            // Əks halda xəta səhifəsinə yönləndir
            return Redirect("http://localhost:5501/error.html?reason=payment_failed");
        }


        // Ödəniş ləğv oldu
        [HttpGet("cancel")]
        public IActionResult Cancel()
        {
            return BadRequest(new { message = "Ödəniş ləğv edildi." });
        }
    }
}
