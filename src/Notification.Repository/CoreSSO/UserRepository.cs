using Dapper;
using Notification.Entity.Database.SGP;
using Notification.Repository.Connections;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.CoreSSO
{
    public class UserRepository : CoreSSORepository
    {
        /// <summary>
        /// Busca os usuários filtrado por uma lista de sistemas que o usuário logado tem acesso
        /// </summary>
        /// <param name="userId">Id do Usuário logado</param>
        /// <param name="ltSystem">Filtro: Lista de sistemas </param>
        /// <returns></returns>
        public IEnumerable<User> GetByVisionAdministrator(Guid userId, IEnumerable<int> ltSystem)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<User>(
                    @"SELECT ug.usu_id as Id FROM (
	                    /* Sistemas permitidos */
	                    SELECT g.sis_id FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
	                    WHERE 
		                    UG.usg_situacao != 3 AND G.gru_situacao != 3 
		                    AND UG.usu_id = @userId AND G.sis_id IN @ltSystem
	                    GROUP BY sis_id
                    ) AS T1
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id
                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id
                    GROUP BY ug.usu_id",
                     new { userId = userId, ltSystem = ltSystem });
                return query;
            }
        }

        /// <summary>
        /// Busca os usuários filtrado por um sistema e uma lista de grupos que o usuário logado tem acesso
        /// </summary>
        /// <param name="userId">Id do usuário logado</param>
        /// <param name="systemId">Filtro: Id do sistema</param>
        /// <param name="ltGroup">Filtro: Lista de grupos</param>
        /// <returns></returns>
        public IEnumerable<User> GetByVisionAdministrator(Guid userId, int systemId, IEnumerable<Guid> ltGroup)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<User>(
                    @"SELECT ug.usu_id as Id FROM (
	                    /* Sistemas permitidos */
	                    SELECT g.sis_id FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
	                    WHERE 
		                    UG.usg_situacao != 3 AND G.gru_situacao != 3 
		                    AND UG.usu_id = @userId AND G.sis_id = @systemId
	                    GROUP BY sis_id
                    ) AS T1
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id
                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id
                    WHERE G.gru_id in @ltGroup	
                    GROUP BY ug.usu_id",
                     new { userId = userId, systemId = systemId, ltGroup = ltGroup });
                return query;
            }
        }

        /// <summary>
        /// Busca os usuários filtrado por um sistema, um grupo  e uma lista de Unidades Administrativas que o usuário logado tem acesso
        /// </summary>
        /// <param name="userId">Id do usuário logado</param>
        /// <param name="systemId">Filtro: Id do sistema</param>
        /// <param name="groupId">Filtro: Id do grupo</param>
        /// <param name="ltAdministrativeUnit">Filtro: Lista de Unidade Administrativas</param>
        /// <returns></returns>
        public IEnumerable<User> GetByVisionAdministrator(Guid userId, int systemId, Guid groupId, IEnumerable<Guid> ltAdministrativeUnit)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<User>(
                    @"SELECT ug.usu_id as Id FROM (
	                    /* Sistemas permitidos */
	                    SELECT g.sis_id FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
	                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id
	                    WHERE 
		                    UG.usg_situacao != 3 AND G.gru_situacao != 3 
		                    AND UG.usu_id = @userId AND G.sis_id = @systemId
	                    GROUP BY sis_id
                    ) AS T1
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id
                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id
                    INNER JOIN SYS_UsuarioGrupoUA AS UGUA WITH(NOLOCK) ON UGUA.gru_id = UG.gru_id AND UGUA.usu_id = UG.usu_id
                    WHERE G.gru_id = @groupId AND UGUA.uad_id IN @ltAdministrativeUnit
                    GROUP BY ug.usu_id",
                     new { userId = userId, systemId = systemId, groupId = groupId, ltAdministrativeUnit = ltAdministrativeUnit });
                return query;
            }
        }
    }
}
