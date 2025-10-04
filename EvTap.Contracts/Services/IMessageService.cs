


using EvTap.Domain.Entities;

namespace EvTap.Contracts.Services
{
    public interface IMessageService
    {

        Task<IEnumerable<Message>> GetConversationAsync(string userId, string otherUserId, int? listingId = null);


        Task<List<Message>> GetUserMessagesAsync(string userId);


        Task<List<Message>> GetUnreadMessagesAsync(string userId);


        Task<List<Message>> GetAdminMessagesAsync();


        Task<Message> SendMessageToListingOwnerAsync(string senderId, int listingId, string content);


        Task<Message> SendDirectMessageAsync(string senderId, string receiverId, string content);


        Task<Message> SendMessageToAdminAsync(string userId, string content);


        Task MarkAsReadAsync(int messageId);


        Task MarkConversationAsReadAsync(string userId, string otherUserId);
    
    Task<Message> SendReplyAsync(string senderId, string receiverId, int? listingId, string content);
    }
}