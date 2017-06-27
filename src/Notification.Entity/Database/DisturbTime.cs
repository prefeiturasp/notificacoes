using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.Database
{
    public class DisturbTime
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public int TimeMinutes { get; set; }
    }
}
