using Dapper;
using Notification.Entity.Database.SGP;
using Notification.Repository.Connections;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.SGP
{
    public class UserSGPRepository : SGPRepository
    {
           /// <summary>
        /// Busca os usuários filtrado por um sistema, um grupo  e uma lista de Unidades Administrativas que o usuário logado tem acesso
        /// </summary>
        /// <param name="userId">Id do usuário logado</param>
        /// <param name="systemId">Filtro: Id do sistema</param>
        /// <param name="groupId">Filtro: Id do grupo</param>
        /// <param name="ltAdministrativeUnit">Filtro: Lista de Unidade Administrativas</param>
        /// <returns></returns>
        public IEnumerable<User> GetByVisionAdministrator(Guid userId, int systemId, IEnumerable<Guid> ltGroup, IEnumerable<Guid> ltSchoolSuperior, IEnumerable<Guid> ltAdministrativeUnit)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(@"SELECT ug.usu_id as Id FROM(
                        /* Sistemas permitidos */
                        SELECT g.sis_id FROM Synonym_SYS_UsuarioGrupo AS UG WITH(NOLOCK)

                        INNER JOIN Synonym_SYS_Grupo AS G WITH(NOLOCK) ON UG.gru_id = G.gru_id

                        WHERE

                            UG.usg_situacao <> 3 AND G.gru_situacao <> 3

                            AND UG.usu_id = @usu_idLogado AND G.sis_id = @systemId

                        GROUP BY sis_id
                    ) AS T1
                INNER JOIN Synonym_SYS_Grupo AS G WITH(NOLOCK) on t1.sis_id = g.sis_id 
                INNER JOIN Synonym_SYS_UsuarioGrupo AS UG WITH(NOLOCK) on UG.gru_id = G.gru_id
                INNER JOIN Synonym_SYS_UsuarioGrupoUA AS UGUA WITH(NOLOCK) ON UGUA.gru_id = UG.gru_id AND UGUA.usu_id = UG.usu_id

                LEFT JOIN esc_escola as esc WITH(NOLOCK) ON esc.uad_id = ugua.uad_id
                    WHERE 
                        g.gru_situacao <> 3
                        and ug.usg_situacao <> 3
                        and esc.esc_situacao <> 3");

                if (ltGroup != null && ltGroup.Any())
                    sb.Append(" AND G.gru_id IN @idsGrupo");
                

                sb.Append(@" AND (
		            ugua.uad_id in
		            (
                        /* visão 2 = Gestor (DRE) busca apenas filhas da DRE */
			            SELECT esc.uad_id
				            FROM Synonym_SYS_UsuarioGrupoUA as usg WITH(NOLOCK)
				            INNER JOIN ESC_Escola as esc WITH(NOLOCK) on usg.uad_id= esc.uad_idSuperiorGestao 
				            INNER JOIN synonym_sys_unidadeAdministrativa as uadSuperior WITH(NOLOCK) ON uadSuperior.uad_id=esc.uad_idSuperiorGestao
				            WHERE 
                                esc.esc_situacao<>3
                                 AND uadSuperior.uad_situacao<>3");

                
                if (ltGroup != null && ltGroup.Any())
                {
                    sb.Append(" AND usg.gru_id IN @idsGrupo");
                    sb.Append(@" AND (select top 1 vis_id from synonym_sys_grupo as gru WITH(NOLOCK)
                                    WHERE 
                                         gru.gru_id IN @idsGrupo
                                         AND gru.gru_situacao <> 3) = 2");
                }


                if (ltSchoolSuperior != null && ltSchoolSuperior.Any())
                    sb.Append(" AND esc.uad_idSuperiorGestao IN @idsDRES");


                if (ltSchoolSuperior != null && ltSchoolSuperior.Any())
                    sb.Append(@" AND esc.uad_id IN @idsUAD ");
                

                sb.Append(@" UNION 
	        
                /* Qualquer outra visão, incluindo gestor. Busca suas próprias UAD's ou DRE's que possui permissão.*/

			    SELECT usg.uad_id 
				    FROM Synonym_SYS_UsuarioGrupoUA AS usg WITH(NOLOCK) 
				    INNER JOIN synonym_sys_unidadeAdministrativa AS uad with(nolock) ON usg.uad_id=uad.uad_id 
				    LEFT JOIN ESC_Escola AS esc with(nolock) ON usg.uad_id= esc.uad_id 
		
				    WHERE 
                      uad.uad_situacao<>3 
                       AND esc.esc_situacao<>3 ");

                if (ltGroup != null && ltGroup.Any())
                    sb.Append(" AND usg.gru_id IN @idsGrupo");
                
                if (ltAdministrativeUnit != null && ltAdministrativeUnit.Any())
                    sb.Append(" AND usg.uad_id IN @idsUAD");
                

                sb.Append(@") /* fechando uad_id in */
                    ) /* fechando AND */
                ");


                sb.Append(" GROUP BY ug.usu_id");
	    
                    var query = context.Query<User>(sb.ToString(),
                     new {
                         usu_idLogado = userId
                         , systemId = systemId
                         , idsGrupo = ltGroup
                         , idsUAD = ltAdministrativeUnit
                         , idsDRES = ltSchoolSuperior
                     });
                return query;
            }
        }
    }
}
