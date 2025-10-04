using EvTap.Contracts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using System.Threading.Tasks;

// Assuming IMessageService is available via DI

[Authorize]
public class ChatHub : Hub
{
    private readonly IMessageService _messageService;

  
    public ChatHub(IMessageService messageService)
    {
        _messageService = messageService;
    }

   
    public async Task SendMessageToListing(int listingId, string content)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return; 

   
        await _messageService.SendMessageToListingOwnerAsync(senderId, listingId, content);
    }

 
    public async Task SendDirectMessage(string receiverId, string content)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

     
        await _messageService.SendDirectMessageAsync(senderId, receiverId, content);
    }


   
    public async Task JoinConversation(string otherUserId, int? listingId)
    {
        var currentUserId = Context.UserIdentifier;
        var groupName = GetConversationGroupName(currentUserId, otherUserId, listingId);

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        await Clients.Caller.SendAsync("JoinedGroup", groupName);
    }

 
    public async Task LeaveConversation(string otherUserId, int? listingId)
    {
        var currentUserId = Context.UserIdentifier;
        var groupName = GetConversationGroupName(currentUserId, otherUserId, listingId);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    private string GetConversationGroupName(string userId1, string userId2, int? listingId)
    {
        var users = new[] { userId1, userId2 }.OrderBy(id => id).ToArray();
        var baseName = $"conversation_{users[0]}_{users[1]}";
        return listingId.HasValue ? $"{baseName}_listing{listingId}" : baseName;
    }
}