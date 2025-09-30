using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace EvTap.Presentation.Hubs
{
    
    [AllowAnonymous]
    public class ChatHub : Hub
    {
        public async Task SendMessageToUser(string receiverId, string message)
        {
            var senderId = Context.ConnectionId; // test üçün ConnectionId

            if (!string.IsNullOrEmpty(receiverId))
            {
                await Clients.Client(receiverId).SendAsync("ReceiveMessage", new
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    Content = message,
                    SentAt = DateTime.UtcNow
                });
            }
            else
            {
                await Clients.Group("Admins").SendAsync("ReceiveGroupMessage", new
                {
                    SenderId = senderId,
                    Content = message,
                    SentAt = DateTime.UtcNow
                });
            }
        }

        public override async Task OnConnectedAsync()
        {
            // test üçün hər kəsi qruplara əlavə et
            await Groups.AddToGroupAsync(Context.ConnectionId, "Users");
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            await base.OnConnectedAsync();
        }
    }


}
