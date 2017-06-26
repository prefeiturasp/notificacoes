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
    public class CalendarRepository : SGPRepository
    {
        public IEnumerable<Calendar> Get()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Calendar>(
                    @"SELECT
	                    ACA.cal_ano 'Name'
                    FROM
	                    ACA_CalendarioAnual AS ACA WITH(NOLOCK)
                    WHERE
	                    ACA.cal_ano <= YEAR(GETDATE())
	                    AND ACA.cal_situacao <> 3
                    GROUP BY
	                    ACA.cal_ano");
                return query;
            }
        }
    }
}
