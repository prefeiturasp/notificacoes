using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.CoreSSO
{
    public abstract class CoreSSORepository
    {
        internal readonly string stringConnection;

        public CoreSSORepository()
        {
            stringConnection = Connection.Get("CoreSSO");
        }
    }
}
