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
    public class DisciplineRepository : SGPRepository
    {
        public IEnumerable<Discipline> Get(string calendarYear, IEnumerable<int> courseId, IEnumerable<string> coursePeriodId)
        {
            var ltCoursePeriod = coursePeriodId.Select(c => new { curId = c.Split('|')[0], crrId = c.Split('|')[1], crpId = c.Split('|')[2] });
            
            StringBuilder sb = new StringBuilder();
            sb.Append(@"SELECT tds.tds_id as Id, tds.tds_nome as Name
                FROM ACA_CalendarioCurso cac WITH(NOLOCK)
                INNER JOIN ACA_CalendarioAnual AS CAL WITH(NOLOCK) ON CAL.cal_id = CAC.cal_id
                INNER JOIN ACA_Curso cur WITH(NOLOCK) ON cac.cur_id = cur.cur_id AND cur.cur_situacao <> 3
                INNER JOIN ACA_Curriculo crr WITH(NOLOCK) ON crr.cur_id = cur.cur_id AND crr.crr_situacao <> 3
                INNER JOIN ACA_CurriculoPeriodo crp WITH(NOLOCK) ON crp.cur_id = crr.cur_id AND crp.crr_id = crr.crr_id AND crp.crp_situacao <> 3
                INNER JOIN ACA_CurriculoDisciplina crd WITH(NOLOCK) ON crd.cur_id = crp.cur_id AND crd.crr_id = crp.crr_id AND crd.crp_id = crp.crp_id AND crd.crd_situacao <> 3
                INNER JOIN ACA_Disciplina dis WITH(NOLOCK) ON dis.dis_id = crd.dis_id AND dis.dis_situacao <> 3
                INNER JOIN ACA_TipoDisciplina tds WITH(NOLOCK) ON tds.tds_id = dis.tds_id AND tds.tds_situacao <> 3");

            if (ltCoursePeriod.Any())
            {
                sb.Append(" INNER JOIN (");

                foreach (var item in ltCoursePeriod)
                {
                    sb.Append(string.Format("SELECT {0} AS CUR_ID, {1} AS CRR_ID, {2} AS CRP_ID UNION ", item.curId, item.crrId, item.crpId));
                }

                sb.Remove(sb.Length - 7, 7);
                sb.Append(") AS T1 ON T1.cur_id = crp.cur_id AND T1.crr_id = crp.crr_id AND T1.crp_id = crp.crp_id");
            }

            sb.Append(" WHERE CAL.cal_ano = @calendarYear");

            if (courseId != null && courseId.Any())
                sb.Append(" AND cac.cur_id IN @courseId");                       

            sb.Append(" GROUP BY tds.tds_id, tds.tds_nome");

            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Discipline>(sb.ToString(),
                    new { calendarYear = calendarYear, courseId = courseId});
                return query;
            }
        }
    }
}
