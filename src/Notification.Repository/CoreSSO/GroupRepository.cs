using Dapper;
using Notification.Entity.API.CoreSSO;
using Notification.Repository.Connections;
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
        /// <summary>
        /// Busca os Grupos de mesma ou inferior visão do Grupo que o usuário está associado
        /// </summary>
        /// <param name="userId">Id do usuário</param>
        /// <param name="systemId">Id do sistema</param>
        /// <returns></returns>
        public IEnumerable<Group> GetGroupDown(Guid userId, int systemId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Group>(
                    @"SELECT GP.gru_id AS Id, GP.gru_nome AS Name, GP.sis_id as SystemId, GP.vis_id AS VisionId
	                    FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
	                	INNER JOIN SYS_GRUPO AS GP WITH(NOLOCK) ON GP.sis_id = G.sis_id AND GP.vis_id >= G.vis_id
                        WHERE UG.usg_situacao = 1 AND G.gru_situacao = 1 AND G.sis_id = @systemId /*AND UG.usu_id = ''*/",
                    new { systemId = systemId});
                return query;
            }
        }
    }
}
