using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.Database
{
    public class NotificationRecipient
    {
        public Guid UserId { get; set; }

        public bool Read { get; set; }

        public Nullable<DateTime> DelayDate { get; set; }
    }
}
