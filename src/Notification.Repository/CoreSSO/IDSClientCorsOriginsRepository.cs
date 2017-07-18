using Dapper;
using Notification.Entity.Database.CoreSSO;
using Notification.Repository.Connections;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.CoreSSO
{
    public class IDSClientCorsOriginsRepository : IDSRepository
    {
        public IEnumerable<IDSClientCorsOrigins> Get()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<IDSClientCorsOrigins>(
                    @"SELECT Id, ClientId, Origin FROM IDS_ClientCorsOrigins WITH(NOLOCK)");
                return query;
            }
        }
    }
}
