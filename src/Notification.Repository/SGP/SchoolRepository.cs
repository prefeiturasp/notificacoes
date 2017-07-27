using Dapper;
using Notification.Entity.API.SGP;
using Notification.Repository.Connections;
using Notification.Repository.CoreSSO;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.SGP
{
    public class SchoolRepository : SGPRepository
    {
        //[TODO]: query que busca escolas da tabela Escolas do Gestão

        public IEnumerable<School> Get(Guid userId, Guid groupId, IEnumerable<Guid> ltSchoolSuperior, IEnumerable<int> listClassificationTypeSchool)
        {
            var groupRep = new GroupRepository();
            var groupUser = groupRep.GetById(groupId);
            
            IEnumerable<Guid> ltAUPermission = null;
            if (groupUser.VisionId > 1)
                ltAUPermission = GetAUByPermission(userId, groupId, ltSchoolSuperior);

            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(
                    @"SELECT
	                    esc.esc_id 'Id',
	                    esc.esc_nome 'Name'
                    FROM
	                    ESC_Escola esc WITH(NOLOCK)
	                    INNER JOIN ESC_EscolaClassificacao ecl WITH(NOLOCK)
		                    ON ecl.esc_id = esc.esc_id
	                    INNER JOIN ESC_TipoClassificacaoEscola tce WITH(NOLOCK)
		                    ON tce.tce_id = ecl.tce_id
		                    AND tce.tce_situacao <> 3
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uad WITH(NOLOCK)
		                    ON uad.ent_id = esc.ent_id
		                    AND uad.uad_id = esc.uad_id
		                    AND uad.uad_situacao <> 3
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK)
		                    ON uadSuperior.ent_id = uad.ent_id
		                    AND uadSuperior.uad_id = ISNULL(esc.uad_idSuperiorGestao, uad.uad_idSuperior)
		                    AND uadSuperior.uad_situacao <> 3
                    WHERE
	                    esc.esc_situacao <> 3");

                if (groupUser.VisionId > 1)
                    sb.Append(" AND uad.uad_id IN @idsUADPermissao ");

                //(SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))");

                if (ltSchoolSuperior != null && ltSchoolSuperior.Any())
                    sb.Append(" AND uadSuperior.uad_id in @idsDRE");

                if (listClassificationTypeSchool != null && listClassificationTypeSchool.Any())
                    sb.Append(" AND tce.tce_id IN @idsTipoClassificacaoEscola");

                sb.Append(" ORDER BY esc.esc_nome");

                var query = context.Query<School>(sb.ToString(),
                    new
                    {
                        usu_idLogado = userId
                        ,
                        gru_idLogado = groupId
                        ,
                        idsDRE = ltSchoolSuperior
                        ,
                        idsUADPermissao = ltAUPermission
                        ,
                        idsTipoClassificacaoEscola = listClassificationTypeSchool
                    }
                    );
                return query;
            }
        }

       
        public IEnumerable<School> GetBySuperior(Guid userId, Guid groupId, Guid schoolSuperiorId)
        {
            var groupRep = new GroupRepository();
            var groupUser = groupRep.GetById(groupId);

            IEnumerable<Guid> ltAUPermission = null;
            if (groupUser.VisionId > 1)
                ltAUPermission = GetAUByPermission(userId, groupId);

            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();

                sb.Append(@"SELECT DISTINCT
	                     esc.esc_id 'Id'
	                    , esc.esc_nome 'Name'
                    FROM 
	                    ESC_Escola esc WITH(NOLOCK)
                    WHERE
	                    esc.esc_situacao <> 3");
                if(groupUser.VisionId >1)
	                    sb.Append(" AND esc.uad_id IN @idsUADPermissao ");
                //(SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))

                sb.Append(" AND esc.uad_idSuperiorGestao = @idDre");
                sb.Append(" ORDER BY esc.esc_nome");

                var query = context.Query<School>(

               sb.ToString(),
                     new
                     {
                         usu_idLogado = userId
                         ,
                         gru_idLogado = groupId
                         ,
                         idsUADPermissao = ltAUPermission
                        ,
                         idDre = schoolSuperiorId
                     }
                     );
                return query;
            }
        }

        /// <summary>
        /// Busca todas as UA's filhas. caso não tenha nenhuma, busca todas que o usuário tenha permissão.
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="groupId"></param>
        /// <param name="ltSchoolSuperior"></param>
        /// <returns></returns>
        /// 
        [System.Obsolete("método em desuso. substituindo a function de permissão do coresso")]
        public IEnumerable<Guid> GetAUBySuperior(Guid userId, Guid groupId, IEnumerable<Guid> ltSchoolSuperior)
        {
            return null;
            //using (var context = new SqlConnection(stringConnection))
            //{
            //    StringBuilder sb = new StringBuilder();
            //    sb.Append(@"SELECT DISTINCT
            //             esc.uad_id
            //        FROM
            //            ESC_Escola esc WITH(NOLOCK)
            //        WHERE
            //            esc.esc_situacao <> 3
            //            AND esc.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))");

            //    if (ltSchoolSuperior.Any())
            //        sb.Append(@" AND esc.uad_idSuperiorGestao in @idDre");

            //    var query = context.Query<Guid>(
            //       sb.ToString(),
            //        new
            //        {
            //            usu_idLogado = userId,
            //            gru_idLogado = groupId,
            //            idDre = ltSchoolSuperior
            //        }
            //        );
            //    return query;
            //}
        }


        /// <summary>
        /// Retorna todas as UAD's que um usuário tem permissão naquele grupo.
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="groupId"></param>
        /// <param name="ltSchoolSuperior"></param>
        /// <param name="ltSchoolUA"></param>
        /// <param name="ltSchoolID"></param>
        /// <returns></returns>
        public IEnumerable<Guid> GetAUByPermission(Guid userId, Guid groupId, IEnumerable<Guid> ltSchoolSuperior = null, IEnumerable<int> ltSchoolID = null, IEnumerable<Guid> ltSchoolUA = null)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(@"select esc.uad_id
		            from Synonym_SYS_UsuarioGrupoUA as usg with(nolock)
		            inner join ESC_Escola as esc on usg.uad_id= esc.uad_idSuperiorGestao
		            where usg.usu_id= @usu_idLogado
		            and usg.gru_id= @gru_idLogado
		            and (select top 1 vis_id from synonym_sys_grupo as gru with(nolock) where gru.gru_id=@gru_idLogado)=2");
                if (ltSchoolSuperior != null && ltSchoolSuperior.Any())
                    sb.Append(" AND esc.uad_idSuperiorGestao in @idsDRES");

                if (ltSchoolUA != null && ltSchoolUA.Any())
                    sb.Append(" AND esc.uad_id in @idsUAS");
                else if (ltSchoolID != null && ltSchoolID.Any())
                    sb.Append(" AND esc.esc_id in @idsESC");

                sb.Append(
                @" UNION
	
	            select usg.uad_id
		            from Synonym_SYS_UsuarioGrupoUA as usg with(nolock)
		            where usg.usu_id= @usu_idLogado
		            and usg.gru_id= @gru_idLogado");

                if (ltSchoolUA != null && ltSchoolUA.Any())
                    sb.Append(" AND usg.uad_id in @idsUAS");
                //else if (ltSchoolID != null && ltSchoolID.Any())
                //    sb.Append(" AND esc.esc_id in @idsESC");


                var query = context.Query<Guid>(
                   sb.ToString(),
                    new
                    {
                        usu_idLogado = userId,
                        gru_idLogado = groupId,
                        idsDRES = ltSchoolSuperior,
                        idsUAS = ltSchoolUA,
                        idsESC = ltSchoolID
                    }
                    );
                return query;
            }
        }
    }
}
