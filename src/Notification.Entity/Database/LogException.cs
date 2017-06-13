using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.Database
{
    public class LogException
    {
        public string message { get; set; }

        public string source { get; set; }

        public string stackTrace { get; set; }
    }
}
