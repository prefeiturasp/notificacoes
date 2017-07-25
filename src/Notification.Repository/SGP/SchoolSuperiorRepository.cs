using Dapper;
using Notification.Entity.API.CoreSSO;
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
    public class SchoolSuperiorRepository : SGPRepository
    {
        private const string TUA_DIRETORIA = "TIPO_UNIDADE_ADMINISTRATIVA_FILTRO_ESCOLA";

        /// <summary>
        /// Pega o tipo da unidade administrativa (tua_id) Diretoria (DRE), que é a unidade administrativa que contém as escolas.
        /// </summary>
        /// <returns></returns>
        public Guid GetAUType()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<TypeAU>(
                    @"SELECT TOP 1, pac_valor
                        from ACA_ParametroAcademico as pac WITH(NOLOCK)
                        WHERE pac_chave = @pac_chave",
                     new { pac_chave = TUA_DIRETORIA });
                return query.FirstOrDefault().Id;
            }
        }

        //[TODO] consultar equipe gestão sobre o segundo inner join desta query

        //public IEnumerable<SchoolSuperior> Get(Guid userId, Guid groupId )
        //{
        //    using (var context = new SqlConnection(stringConnection))
        //    {
        //        var query = context.Query<SchoolSuperior>(
        //            @"SELECT
        //             uadSuperior.ent_id,
        //             uadSuperior.uad_id,
        //             uadSuperior.uad_codigo,
        //             uadSuperior.uad_nome,
        //             uadSuperior.uad_sigla,
        //             uadSuperior.uad_codigoInep
        //            FROM 
        //             ESC_Escola esc WITH(NOLOCK)
        //             INNER JOIN Synonym_SYS_UnidadeAdministrativa uad WITH(NOLOCK)
        //              ON uad.ent_id = esc.ent_id
        //              AND uad.uad_id = esc.uad_id
        //              AND uad.uad_situacao <> 3
        //             INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK)
        //              ON uadSuperior.ent_id = uad.ent_id
        //              AND uadSuperior.uad_id = ISNULL(esc.uad_idSuperiorGestao, uad.uad_idSuperior)
        //              AND uadSuperior.uad_situacao  <> 3
        //            WHERE
        //             esc.esc_situacao <> 3
        //             AND uad.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))",
        //             new { usu_idLogado = userId, gru_idLogado = groupId }
        //            );
        //        return query;
        //    }
        //}

        public IEnumerable<SchoolSuperior> Get(Guid userId, Guid groupId)
        {
            var groupRep = new GroupRepository();
            var groupUser = groupRep.GetById(groupId);

            SchoolRepository school = new SchoolRepository();
            IEnumerable<Guid> ltAUPermission = null;
            if (groupUser.VisionId > 1)
                ltAUPermission = school.GetAUByPermission(userId, groupId);

            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(@"SELECT DISTINCT
	                     uadSuperior.uad_id 'Id'
	                    , uadSuperior.uad_nome 'Name'

                    FROM 
	                    ESC_Escola esc WITH(NOLOCK)
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uad WITH(NOLOCK)
		                    ON uad.ent_id = esc.ent_id
		                    AND uad.uad_id = esc.uad_id
		                    AND uad.uad_situacao <> 3
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK)
		                    ON uadSuperior.ent_id = uad.ent_id
		                    AND uadSuperior.uad_id = ISNULL(esc.uad_idSuperiorGestao, uad.uad_idSuperior)
		                    AND uadSuperior.uad_situacao  <> 3
                    WHERE
	                    esc.esc_situacao <> 3");

                //Se não for administrador, usa a lista filtrada de usuarioGrupoUA
                if (groupUser.VisionId > 1)
                {
                    sb.Append(" AND uad.uad_id IN @idsUADPermissao");
                }
                sb.Append("ORDER BY uadSuperior.uad_nome");

                var query = context.Query<SchoolSuperior>(
                    sb.ToString(),
                     new
                     {
                         usu_idLogado = userId
                     ,
                         gru_idLogado = groupId
                     ,
                         idsUADPermissao = ltAUPermission
                     }
                    );
                return query;
            }


        }
    }
}
