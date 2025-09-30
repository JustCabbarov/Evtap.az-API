using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessageController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            var senderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (senderId == null)
                return Unauthorized();

            var message = await _messageService.SendMessageToListingOwnerAsync(
                senderId,
                request.ListingId,
                request.Content
            );

            return Ok(message);
        }

        [HttpPost("send-to-admin")]
        public async Task<IActionResult> SendMessageToAdmin([FromBody] AdminMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest("Mesaj boş ola bilməz");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var message = await _messageService.SendMessageToAdminAsync(userId, request.Content);
            return Ok(message);
        }

        [HttpGet("conversation/{otherUserId}")]
        public async Task<IActionResult> GetConversation(string otherUserId, [FromQuery] int? listingId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var conversation = await _messageService.GetConversationAsync(userId, otherUserId, listingId);
            return Ok(conversation);
        }

        [HttpGet("my-messages")]
        public async Task<IActionResult> GetMyMessages()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var messages = await _messageService.GetUserMessagesAsync(userId);
            return Ok(messages);
        }

        // YENİ: Oxunmamış mesajlar
        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadMessages()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var messages = await _messageService.GetUnreadMessagesAsync(userId);
            return Ok(messages);
        }

        // YENİ: Admin mesajlarını gətir (sadəcə adminlər üçün)
        [HttpGet("admin-messages")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminMessages()
        {
            var messages = await _messageService.GetAdminMessagesAsync();
            return Ok(messages);
        }

        [HttpPost("mark-as-read/{messageId}")]
        public async Task<IActionResult> MarkAsRead(int messageId)
        {
            await _messageService.MarkAsReadAsync(messageId);
            return Ok();
        }

       
        [HttpPost("mark-conversation-read/{otherUserId}")]
        public async Task<IActionResult> MarkConversationAsRead(string otherUserId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            await _messageService.MarkConversationAsReadAsync(userId, otherUserId);
            return Ok();
        }
    }
}