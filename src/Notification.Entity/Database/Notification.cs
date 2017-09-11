using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.Database
{
    public class Notification
    {
        public Guid Id { get; set; }

        public Guid SenderId { get; set; }

        public string SenderName { get; set; }

        public IEnumerable<NotificationRecipient> Recipient { get; set; }

        public int MessageType { get; set; }

        public DateTime DateStartNotification { get; set; }

        public Nullable<DateTime> DateEndNotification { get; set; }

        public string Title { get; set; }

        public string Message { get; set; }
    }
}
