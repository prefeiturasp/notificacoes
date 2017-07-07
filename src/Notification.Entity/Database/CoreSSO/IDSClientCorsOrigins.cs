using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.Database.CoreSSO
{
    public class IDSClientCorsOrigins
    {
        public int Id { get; set; }

        public int ClientId { get; set; }

        public string Origin { get; set; }
    }
}
