

using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.SignalR;

namespace EvTap.Presentation.Notifier
{
    public class SignalRMessageNotifier : IMessageNotifier
    {
        private readonly IHubContext<ChatHub> _hubContext;
        // NOTE: ILogger requires a concrete type or interface for its generic parameter.
        private readonly ILogger<SignalRMessageNotifier> _logger;

        public SignalRMessageNotifier(IHubContext<ChatHub> hubContext, ILogger<SignalRMessageNotifier> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task NotifyMessageReceivedAsync(Message message)
        {
            // Log the attempt before checking ReceiverId
            _logger.LogInformation("Attempting to notify message received: SenderId={SenderId}, ReceiverId={ReceiverId}",
                message.SenderId, message.ReceiverId);

            if (!string.IsNullOrEmpty(message.ReceiverId))
            {
                // 1. Send direct notification to the receiver (e.g., for a quick toast/badge update)
                await _hubContext.Clients.User(message.ReceiverId)
                    .SendAsync("ReceiveMessage", message);

                // 2. Send notification to the conversation group (e.g., for updating the chat window)
                var groupName = GetConversationGroupName(message.SenderId, message.ReceiverId, message.ListingId);
                await _hubContext.Clients.Group(groupName)
                    .SendAsync("NewMessage", message);
            }
            else
            {
                // This block handles messages where ReceiverId is null (like messages to Admin group)
                _logger.LogWarning("Message received without a specific ReceiverId for standard notification: SenderId={SenderId}",
                    message.SenderId);
            }
        }

        public async Task NotifyMessageReceivedToGroupAsync(string group, Message message)
        {
            // Used for sending messages to a non-user-specific group (e.g., "Admins")
            _logger.LogInformation("Notifying group {Group} of new message: SenderId={SenderId}",
                group, message.SenderId);

            await _hubContext.Clients.Group(group)
                .SendAsync("ReceiveGroupMessage", message);
        }

        public async Task NotifyMessageReadAsync(int messageId, string senderId)
        {
            // Notifies the original sender that their message has been read by the receiver.
            _logger.LogInformation("Notifying sender {SenderId} that MessageId={MessageId} was read.",
                senderId, messageId);

            await _hubContext.Clients.User(senderId)
                .SendAsync("MessageRead", messageId);
        }

        private string GetConversationGroupName(string userId1, string userId2, int? listingId)
        {
            // Ensures the group name is always consistent regardless of sender/receiver order
            var users = new[] { userId1, userId2 }.OrderBy(id => id).ToArray();
            var baseName = $"conversation_{users[0]}_{users[1]}";

            // Appends ListingId to distinguish conversations about different listings 
            // between the same two users.
            return listingId.HasValue ? $"{baseName}_listing{listingId}" : baseName;
        }
    }
}