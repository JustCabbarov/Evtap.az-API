using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvTap.Contracts.Services
{



    public interface IPaymentService
    {
        Task<string> CreatePaymentSessionAsync(int listingId, decimal amount);
        Task<bool> ConfirmPaymentAsync(string sessionId);
    }


}
