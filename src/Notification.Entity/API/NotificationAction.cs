using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.API
{
    public class NotificationAction
    {
        public Guid NotificationId { get; set; }

        public Nullable<bool> Read { get; set; }

        public Nullable<int> DelayId { get; set; }
    }
}
