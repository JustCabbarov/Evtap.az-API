using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvTap.Domain.Entities;

namespace EvTap.Contracts.Services
{
    public interface IMessageNotifier
    {
        Task NotifyMessageReceivedAsync(Message message);
        Task NotifyMessageReceivedToGroupAsync(string group, Message message);
        Task NotifyMessageReadAsync(int messageId, string receiverId);
      

    }

}
