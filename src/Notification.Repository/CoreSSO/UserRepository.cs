﻿using Dapper;
using Notification.Entity.Database.SGP;
using Notification.Repository.Connections;
using Notification.Repository.SGP;
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
		                    UG.usg_situacao <> 3 AND G.gru_situacao <> 3 
		                    AND UG.usu_id = @userId AND G.sis_id IN @ltSystem
	                    GROUP BY sis_id
                    ) AS T1
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id
                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id
                    WHERE
                        UG.usg_situacao <> 3 AND G.gru_situacao <> 3 
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
		                    UG.usg_situacao <> 3 AND G.gru_situacao <> 3 
		                    AND UG.usu_id = @userId AND G.sis_id = @systemId
	                    GROUP BY sis_id
                    ) AS T1
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id
                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id
                    WHERE 
                        G.gru_id in @ltGroup	
                        AND UG.usg_situacao <> 3 
                        AND G.gru_situacao <> 3 
                    GROUP BY ug.usu_id",
                     new { userId = userId, systemId = systemId, ltGroup = ltGroup });
                return query;
            }
        }

        

        /// <summary>
        /// 
        /// </summary>
        /// <param name="userId">ID Usuário logado</param>
        /// <param name="groupId">ID Grupo usuário logado</param>
        /// <param name="ltSystem">Filtro: Lista de sistemas da qual o usuário logado tem permissão</param>
        /// <param name="ltGroup">Filtro: Lista de grupos de mesma visão ou abaixo do usuário logado</param>
        /// <param name="ltAdministrativeUnit">Filtro: Lista de unidades administrativas que o usuário logado possui permissão</param>
        /// <returns></returns>
        public IEnumerable<User> GetByVisionAll(Guid userId, Guid groupId, IEnumerable<int> ltSystem, IEnumerable<Guid> ltGroup, IEnumerable<Guid> ltSchoolSuperior, IEnumerable<Guid> ltSchoolUA)
        {

            SchoolRepository school = new SchoolRepository();
            IEnumerable<Guid> ltAUPermission = school.GetAUByPermission(userId, groupId, ltSchoolSuperior, null, ltSchoolUA);

            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(@"SELECT
                    DISTINCT
                    ug.usu_id as Id 
                    FROM (
                    
                    SELECT  g.sis_id 
                    FROM SYS_UsuarioGrupo AS UG WITH(NOLOCK)
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id 

                    WHERE 
                    UG.usg_situacao <> 3 AND G.gru_situacao <> 3 
                    AND UG.usu_id = @usu_idLogado ");

                if (ltSystem != null && ltSystem.Any())
                    sb.Append(" AND G.sis_id IN @idsSistema");

                sb.Append(@" GROUP BY sis_id) AS T1
                    INNER JOIN SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id and g.gru_situacao<>3
                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id AND ug.usg_situacao<>3
                    INNER JOIN SYS_UsuarioGrupoUA AS UGUA WITH(NOLOCK) ON UGUA.gru_id = UG.gru_id AND UGUA.usu_id = UG.usu_id

                    WHERE
                     (g.vis_id >= (SELECT vis_id FROM SYS_Grupo as gruLogado WITH(NOLOCK) where gruLogado.gru_id=@gru_idLogado))");

                if(ltGroup !=null && ltGroup.Any())
                {
                    sb.Append(@" AND g.gru_id in  @idsGrupo");
                }

                //Buscar todas uad's que ele possui permissão, incluindo uad's filhas (se houverem)
                sb.Append(@" AND ugua.uad_id IN @idsUADPermissao ");
                
                var query = context.Query<User>(
                   sb.ToString()
                    ,
                     new { usu_idLogado = userId
                     , gru_idLogado= groupId
                     , idsSistema = ltSystem
                     , idsGrupo = ltGroup
                     , idsUADPermissao = ltAUPermission
                     , idsDRE = ltSchoolSuperior
                     , idsUAD = ltSchoolUA });
                return query;
            }
        }

        /// <summary>
        /// Busca o usuário (nome e id) solicitado no parâmetro
        /// Para ser exibido o nome do usuário logado no cabeçalho da página, por exemplo.
        /// </summary>
        /// <param name="userId">Id do Usuário</param>
        /// <returns></returns>
        public Notification.Entity.API.CoreSSO.User Get(Guid userId)
        {
            //a entidade User não é a do namespace DataBase, pois não é o mesmo objeto que está sendo gravado no MongoDB.
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Notification.Entity.API.CoreSSO.User>(
                    @"SELECT
                            usu_id as Id, 
                            pes_nome as Name 
                        FROM SYS_Usuario AS USU WITH(NOLOCK)
                        INNER JOIN PES_Pessoa as PES WITH(NOLOCK) ON pes.pes_id=usu.pes_id
	                    WHERE 
		                    usu.usu_id=@usu_id 
                            and USU.usu_situacao <>3
                            and PES.pes_situacao<>3",
                     new { usu_id = userId });
                return query.FirstOrDefault();
            }
        }
    }
}
