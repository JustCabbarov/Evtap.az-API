// FAYL: MessageController.cs

using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using EvTap.Application.Exceptions;

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
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequst request)
        {
            var senderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(senderId))
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest("Mesaj məzmunu boş ola bilməz.");

            try
            {
               
                if (request.IsAdminMessage)
                {
                    var message = await _messageService.SendMessageToAdminAsync(senderId, request.Content);
                    return Ok(message);
                }

                else if (!string.IsNullOrEmpty(request.ReceiverId))
                {
                    // Bu metod həm cavabları, həm də birbaşa mesajları idarə edir.
                    var message = await _messageService.SendReplyAsync(
                        senderId,
                        request.ReceiverId,
                        request.ListingId,
                        request.Content
                    );
                    return Ok(message);
                }

                else if (request.ListingId.HasValue && request.ListingId.Value > 0)
                {
                    var message = await _messageService.SendMessageToListingOwnerAsync(
                        senderId,
                        request.ListingId.Value,
                        request.Content
                    );
                    return Ok(message);
                }

                else
                {
                    return BadRequest("Mesaj göndərmək üçün ListingId və ya ReceiverId təyin olunmalıdır.");
                }
            }
            catch (Exception ex)
            {
                // NotFoundException da bura daxildir
                return BadRequest(ex.Message);
            }
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

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadMessages()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var messages = await _messageService.GetUnreadMessagesAsync(userId);
            return Ok(messages);
        }

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