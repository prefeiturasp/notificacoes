﻿using Dapper;
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
        /// Busca os Grupos de mesma ou inferior visão do Grupo que o usuário está logado
        /// </summary>
        /// <param name="userId">Id do usuário</param>
        /// <param name="systemId">Id do sistema</param>
        /// <param name="groupId">Id do grupo passado no header</param>
        /// <returns></returns>
        public IEnumerable<Group> GetGroupDown(Guid userId, int systemId, Guid groupId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Group>(
                    @"SELECT GP.gru_id AS Id, GP.gru_nome AS Name, GP.sis_id as SystemId, GP.vis_id AS VisionId
	                    FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
	                	INNER JOIN SYS_GRUPO AS GP WITH(NOLOCK) ON GP.sis_id = G.sis_id 
                            AND GP.vis_id >= (select vis_id from sys_grupo as gruVisao where gruVisao.gru_id=@groupId)
                        WHERE UG.usg_situacao <> 3 
                        AND G.gru_situacao <> 3 
                        AND GP.gru_situacao <> 3
                        AND G.sis_id = @systemId 
                        AND UG.usu_id = @userId
                        GROUP BY GP.gru_id, GP.gru_nome, GP.sis_id, GP.vis_id
                        ORDER BY GP.gru_nome",
                    
                    new { systemId = systemId
                            , userId = userId
                            , groupId = groupId
                    });
                return query;
            }
        }

        /// <summary>
        /// Busca os Grupos do usuário
        /// </summary>
        /// <param name="userId">Id do usuário</param>
        /// <param name="systemId">Id do sistema</param>
        /// <returns></returns>
        public IEnumerable<Group> Get(Guid userId, int systemId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Group>(
                    @"SELECT G.gru_id AS Id, G.gru_nome AS Name, G.sis_id as SystemId, G.vis_id AS VisionId
	                    FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
                        WHERE UG.usg_situacao <> 3 
                            AND G.gru_situacao <> 3
                            AND G.sis_id = @systemId 
                            AND UG.usu_id = @userId
                            AND G.vis_id < 4
                        ORDER BY G.gru_nome",
                    new { systemId = systemId, userId = userId });
                return query;
            }
        }

        public Group GetById(Guid groupId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Group>(
                    @"SELECT G.gru_id AS Id, G.gru_nome AS Name, G.sis_id as SystemId, G.vis_id AS VisionId
	                    FROM SYS_Grupo AS G WITH(NOLOCK)
                        WHERE G.gru_id = @groupId",
                    new { groupId = groupId });
                return query.FirstOrDefault();
            }
        }
    }
}
