using Dapper;
using Notification.Entity.API.SGP;
using Notification.Repository.Connections;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.SGP
{
    public class PositionRepository : SGPRepository
    {
        public IEnumerable<Position> Get()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Position>(
                    @"SELECT crg.crg_id as Id, crg.crg_nome as Name                        
                    FROM RHU_Cargo crg WITH(NOLOCK)
                    WHERE crg.crg_situacao <> 3
                    ORDER BY crg.crg_nome");
                return query;
            }
        }
    }
}
