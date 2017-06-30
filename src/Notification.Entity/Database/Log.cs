using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.Database
{
    public class Log
    {
        public Guid id { get; set; }

        public DateTime date { get; set; }

        public string level { get; set; }

        public string message { get; set; }

        public LogException exception { get; set; }
    }
}
