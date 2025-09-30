using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using EvTap.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EvTap.Persistence.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly AppDbContext _context;

        public MessageRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Message> AddAsync(Message message)
        {
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }

        public async Task<List<Message>> GetConversationAsync(string userId, string otherUserId, int? listingId = null)
        {
            return await _context.Messages
                .Where(m =>
                    ((m.SenderId == userId && m.ReceiverId == otherUserId) ||
                    (m.SenderId == otherUserId && m.ReceiverId == userId)) &&
                    (listingId == null || m.ListingId == listingId))
                .OrderBy(m => m.SentAt)
                .ToListAsync();
        }

        public async Task<Message> GetByIdAsync(int messageId)
        {
            return await _context.Messages.FindAsync(messageId);
        }

      
        public async Task<List<Message>> GetSentMessagesAsync(string userId)
        {
            return await _context.Messages
                .Where(m => m.SenderId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();
        }

        // YENİ: İstifadəçiyə gələn mesajlar
        public async Task<List<Message>> GetReceivedMessagesAsync(string userId)
        {
            return await _context.Messages
                .Where(m => m.ReceiverId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();
        }

        // YENİ: Oxunmamış mesajlar
        public async Task<List<Message>> GetUnreadMessagesAsync(string userId)
        {
            return await _context.Messages
                .Where(m => m.ReceiverId == userId && !m.IsRead)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();
        }

        // YENİ: Adminə göndərilən mesajlar
        public async Task<List<Message>> GetMessagesToAdminAsync()
        {
            return await _context.Messages
                .Where(m => m.ReceiverId == null) // Admin mesajları
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();
        }

        // YENİ: Mesajları oxundu kimi işarələ
        public async Task MarkMessagesAsReadAsync(string userId, string otherUserId)
        {
            var messages = await _context.Messages
                .Where(m => m.ReceiverId == userId && m.SenderId == otherUserId && !m.IsRead)
                .ToListAsync();

            foreach (var message in messages)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}