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
        public IEnumerable<CoursePeriod> Get()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<CoursePeriod>(
                    @"SELECT
	                    crp.cur_id,
	                    crp.crr_id,
	                    crp.crp_id,
	                    crp.crp_ordem,
	                    crp.crp_descricao,
	                    crp.crp_controleTempo,
	                    crp.crp_ciclo,
	                    crp.crp_concluiNivelEnsino,
	                    crp.tcp_id,
	                    crp.tci_id
                    FROM
	                    ACA_Curso cur WITH(NOLOCK)
	                    INNER JOIN ACA_Curriculo crr WITH(NOLOCK)
		                    ON crr.cur_id = cur.cur_id
		                    AND crr.crr_situacao <> 3
	                    INNER JOIN ACA_CurriculoPeriodo crp WITH(NOLOCK)
		                    ON crp.cur_id = crr.cur_id
		                    AND crp.crr_id = crr.crr_id
		                    AND crp.crp_situacao <> 3
                    WHERE
	                    cur.cur_situacao <> 3
	                    AND cur.cur_id IN @idsCurso");
                return query;
            }
        }
    }
}
