using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Domain.Repositories
{
    public interface IMessageRepository
    {
        Task<Message> AddAsync(Message message);
        Task<List<Message>> GetConversationAsync(string userId, string otherUserId, int? listingId = null);
        Task<Message> GetByIdAsync(int messageId);
        Task<List<Message>> GetSentMessagesAsync(string userId);
        Task<List<Message>> GetReceivedMessagesAsync(string userId);
        Task<List<Message>> GetUnreadMessagesAsync(string userId);
        Task<List<Message>> GetMessagesToAdminAsync();
        Task MarkMessagesAsReadAsync(string userId, string otherUserId);


    }

}
