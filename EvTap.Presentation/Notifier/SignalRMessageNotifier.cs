using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace EvTap.Presentation.Notifier
{
    public class SignalRMessageNotifier : IMessageNotifier
    {
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<SignalRMessageNotifier> _logger;

        public SignalRMessageNotifier(IHubContext<ChatHub> hubContext, ILogger<SignalRMessageNotifier> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task NotifyMessageReceivedAsync(Message message)
        {
            if (!string.IsNullOrEmpty(message.ReceiverId))
            {
                await _hubContext.Clients.User(message.ReceiverId)
                    .SendAsync("ReceiveMessage", message);

               
                var groupName = GetConversationGroupName(message.SenderId, message.ReceiverId, message.ListingId);
                await _hubContext.Clients.Group(groupName)
                    .SendAsync("NewMessage", message);
            }
        }

        public async Task NotifyMessageReceivedToGroupAsync(string group, Message message)
        {
            await _hubContext.Clients.Group(group)
                .SendAsync("ReceiveGroupMessage", message);
        }

        public async Task NotifyMessageReadAsync(int messageId, string senderId)
        {
            await _hubContext.Clients.User(senderId)
                .SendAsync("MessageRead", messageId);
        }

        private string GetConversationGroupName(string userId1, string userId2, int? listingId)
        {
            var users = new[] { userId1, userId2 }.OrderBy(id => id).ToArray();
            var baseName = $"conversation_{users[0]}_{users[1]}";
            return listingId.HasValue ? $"{baseName}_listing{listingId}" : baseName;
        }
    }
}
