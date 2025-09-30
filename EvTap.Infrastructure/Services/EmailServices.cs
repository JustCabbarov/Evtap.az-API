using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;

namespace EvTap.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly string _fromEmail = "evtap.az1@gmail.com";
        private readonly string _password = "kbqb lpov tble jxjk";

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            using var smtp = new SmtpClient("smtp.gmail.com", 587)
            {
                Credentials = new NetworkCredential(_fromEmail, _password),
                EnableSsl = true
            };

            var mail = new MailMessage(_fromEmail, toEmail)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            await smtp.SendMailAsync(mail);
        }
    }
}
