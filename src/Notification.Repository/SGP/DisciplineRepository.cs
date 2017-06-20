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
        public IEnumerable<Discipline> Get()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Discipline>(
                    @"SELECT
	                    tds.tds_id,
	                    tds.tds_nome
                    FROM
	                    ACA_CalendarioCurso cac WITH(NOLOCK)
	                    INNER JOIN ACA_Curso cur WITH(NOLOCK)
		                    ON cac.cur_id = cur.cur_id
		                    AND cur.cur_situacao <> 3
	                    INNER JOIN ACA_Curriculo crr WITH(NOLOCK)
		                    ON crr.cur_id = cur.cur_id
		                    AND crr.crr_situacao <> 3
	                    INNER JOIN ACA_CurriculoPeriodo crp WITH(NOLOCK)
		                    ON crp.cur_id = crr.cur_id
		                    AND crp.crr_id = crr.crr_id
		                    AND crp.crp_situacao <> 3
	                    INNER JOIN ACA_CurriculoDisciplina crd WITH(NOLOCK)
		                    ON crd.cur_id = crp.cur_id
		                    AND crd.crr_id = crp.crr_id
		                    AND crd.crp_id = crp.crp_id
		                    AND crd.crd_situacao <> 3
	                    INNER JOIN ACA_Disciplina dis WITH(NOLOCK)
		                    ON dis.dis_id = crd.dis_id
		                    AND dis.dis_situacao <> 3
	                    INNER JOIN ACA_TipoDisciplina tds WITH(NOLOCK)
		                    ON tds.tds_id = dis.tds_id
		                    AND tds.tds_situacao <> 3
                    WHERE
	                    cac.cal_id IN @idsCalendario
	                    AND cac.cur_id IN @idsCurso
	                    AND crp.crp_id IN @idsPeriodo
                    GROUP BY
	                    tds.tds_id,
	                    tds.tds_nome");
                return query;
            }
        }
    }
}
