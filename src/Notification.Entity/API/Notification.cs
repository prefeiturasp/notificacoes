using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.API
{
    public class Notification
    {
        public Guid Id { get; set; }

        public string SenderName { get; set; }

        public Recipient Recipient { get; set; }

        public int MessageType { get; set; }

        /// <summary>
        /// Data Hora em formato ISODate
        /// </summary>
        public DateTime DateStartNotification { get; set; }

        /// <summary>
        /// Data Hora em formato ISODate
        /// </summary>
        public Nullable<DateTime> DateEndNotification { get; set; }

        public string Title { get; set; }

        public string Message { get; set; }
    }
}
