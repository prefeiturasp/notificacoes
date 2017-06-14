//using Dapper;
using Dapper;
using Notification.Repository.Connections;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.CoreSSO
{
    public class SystemRepository : CoreSSORepository
    {
        public IEnumerable<Notification.Entity.API.CoreSSO.System> Get(Guid userId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Notification.Entity.API.CoreSSO.System>(
                    @"SELECT S.SIS_ID AS Id, S.SIS_NOME AS Name, S.SIS_CAMINHO AS Url, S.SIS_URLIMAGEM AS Image FROM ( 
	                    SELECT G.sis_id	FROM
                            SYS_UsuarioGrupo AS UG WITH(NOLOCK) 
                        INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
                        WHERE UG.usg_situacao = 1AND G.gru_situacao = 1	AND UG.usu_id = @userId
	                    GROUP BY G.sis_id) as T1
                    INNER JOIN SYS_SISTEMA AS S WITH(NOLOCK) ON S.sis_id = t1.sis_id
                    WHERE S.sis_situacao = 1",
                     new { userId = userId });
                return query;
            }
        }
    }
}
