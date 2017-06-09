using Dapper;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.CoreSSO
{
    public class GroupRepository : CoreSSORepository
    {
        public IEnumerable<Group> Get(Guid userId, int systemId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Group>(
                    @"SELECT G.gru_id AS Id, G.gru_nome AS Name, G.sis_id as SystemId, G.vis_id AS VisionId
	                    FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
	                    WHERE UG.usg_situacao = 1 AND G.gru_situacao = 1 AND G.sis_id = @systemId /*AND UG.usu_id = ''*/",
                    new { systemId = systemId});
                return query;
            }
        }
    }
}
