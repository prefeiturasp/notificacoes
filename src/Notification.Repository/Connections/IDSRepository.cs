using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.Connections
{
    public abstract class IDSRepository
    {
        internal readonly string stringConnection;

        public IDSRepository()
        {
            stringConnection = Connection.Get("IDS");
        }
    }
}
