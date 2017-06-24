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
    public class CoursePeriodRepository : SGPRepository
    {
        public IEnumerable<CoursePeriod> Get(string calendarYear, IEnumerable<int> courseId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(@"SELECT cast(crp.cur_id as varchar(8)) + '|' + cast(crp.crr_id as varchar(8)) + '|' + cast(crp.crp_id as varchar(8)) as Id, crp.crp_descricao as Name, crp.crp_descricao
                    FROM ACA_Curso cur WITH(NOLOCK)
	                INNER JOIN ACA_Curriculo crr WITH(NOLOCK) ON crr.cur_id = cur.cur_id AND crr.crr_situacao <> 3
	                INNER JOIN ACA_CurriculoPeriodo crp WITH(NOLOCK) ON crp.cur_id = crr.cur_id AND crp.crr_id = crr.crr_id AND crp.crp_situacao <> 3
	                INNER JOIN ACA_calendarioCurso AS CAC WITH(NOLOCK) on cac.cur_id = cur.cur_id
	                INNER JOIN ACA_CalendarioAnual AS CAL WITH(NOLOCK) on cal.cal_id = cac.cal_id
                    WHERE cur.cur_situacao <> 3
		                AND CAL.cal_ano = @calendarYear");

                if (courseId != null && courseId.Any())
                    sb.Append(" AND cur.cur_id IN @courseId");
                
                var query = context.Query<CoursePeriod>(sb.ToString(),
                    new { calendarYear = calendarYear, courseId = courseId });
                return query;
            }
        }
    }
}
