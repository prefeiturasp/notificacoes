using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.Connections
{
    public abstract class SGPRepository
    {
        internal readonly string stringConnection;

        public SGPRepository()
        {
            stringConnection = Connection.Get("SGP");
        }
    }
}
