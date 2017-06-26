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
    public class CourseRepository : SGPRepository
    {
        public IEnumerable<Course> Get(string calendarYear)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Course>(
                    @"SELECT cur.cur_id AS Id, cur.cur_nome	AS Name
                    FROM ACA_CalendarioCurso cac WITH(NOLOCK)
                    INNER JOIN ACA_CalendarioAnual as cal with(nolock) ON cal.cal_id = cac.cal_id
                    INNER JOIN ACA_Curso cur WITH(NOLOCK) ON cur.cur_id = cac.cur_id AND cur.cur_situacao <> 3
                    WHERE cal.cal_ano = @calendarYear",
                    new { calendarYear = calendarYear });
                return query;
            }
        }
    }
}
