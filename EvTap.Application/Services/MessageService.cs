using EvTap.Application.Exceptions;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;

namespace EvTap.Application.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IGenericRepository<Listing> _listingRepository;
        private readonly IMessageNotifier _notifier;

        public MessageService(
            IMessageRepository messageRepository,
            IGenericRepository<Listing> listingRepository,
            IMessageNotifier notifier)
        {
            _messageRepository = messageRepository;
            _listingRepository = listingRepository;
            _notifier = notifier;
        }

        public async Task<IEnumerable<Message>> GetConversationAsync(string userId, string otherUserId, int? listingId = null)
        {
            return await _messageRepository.GetConversationAsync(userId, otherUserId, listingId);
        }

        // YENİ: İstifadəçinin mesajlarını gətir
        public async Task<List<Message>> GetUserMessagesAsync(string userId)
        {
            var sentMessages = await _messageRepository.GetSentMessagesAsync(userId);
            var receivedMessages = await _messageRepository.GetReceivedMessagesAsync(userId);

            // Bütün mesajları birləşdir və tarixə görə sırala
            var allMessages = sentMessages.Concat(receivedMessages)
                .OrderByDescending(m => m.SentAt)
                .ToList();

            return allMessages;
        }

        // YENİ: Oxunmamış mesajlar
        public async Task<List<Message>> GetUnreadMessagesAsync(string userId)
        {
            return await _messageRepository.GetUnreadMessagesAsync(userId);
        }

        // YENİ: Admin mesajlarını gətir
        public async Task<List<Message>> GetAdminMessagesAsync()
        {
            return await _messageRepository.GetMessagesToAdminAsync();
        }

        public async Task<Message> SendMessageToListingOwnerAsync(string senderId, int listingId, string content)
        {
            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
                throw new NotFoundException("Listing tapılmadı");

            if (listing.UserId.ToString() == senderId)
                throw new Exception("Öz elanına mesaj göndərə bilməzsən");

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = listing.UserId.ToString(),
                Content = content,
                ListingId = listingId,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            var savedMessage = await _messageRepository.AddAsync(message);

           
            await _notifier.NotifyMessageReceivedAsync(savedMessage);

            return savedMessage;
        }

        public async Task<Message> SendMessageToAdminAsync(string userId, string content)
        {
            var message = new Message
            {
                SenderId = userId,
                ReceiverId = null, // Admin mesajlarında receiver null olur
                Content = content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            var savedMessage = await _messageRepository.AddAsync(message);

            // Bütün adminlərə real-time bildirim göndər
            await _notifier.NotifyMessageReceivedToGroupAsync("Admins", savedMessage);

            return savedMessage;
        }

        public async Task MarkAsReadAsync(int messageId)
        {
            var message = await _messageRepository.GetByIdAsync(messageId);
            if (message != null && !message.IsRead)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;

                // Oxundu bildirimi göndər
                await _notifier.NotifyMessageReadAsync(message.Id, message.SenderId);
            }
        }

        // YENİ: Bütün konversasiyanı oxundu kimi işarələ
        public async Task MarkConversationAsReadAsync(string userId, string otherUserId)
        {
            await _messageRepository.MarkMessagesAsReadAsync(userId, otherUserId);
        }
    }
}