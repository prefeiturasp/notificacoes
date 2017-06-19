using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.SignalR
{
    public class Notification
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string Message { get; set; }
    }
}
