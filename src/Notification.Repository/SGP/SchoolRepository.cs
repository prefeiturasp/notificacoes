﻿using Dapper;
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
    public class SchoolRepository : SGPRepository
    {
        //[TODO]: query que busca escolas da tabela Escolas do Gestão

        public IEnumerable<School> Get(Guid userId, Guid groupId, IEnumerable<Guid> listSchoolSuperior, IEnumerable<int> listClassificationTypeSchool)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(
                    @"SELECT
	                    esc.esc_id 'Id',
	                    esc.ent_id,
	                    esc.uad_id,
	                    esc.esc_codigo,
	                    esc.esc_nome 'Name',
	                    esc.esc_codigoInep,
	                    esc.uad_idSuperiorGestao,
	                    esc.esc_controleSistema,
	                    esc.esc_terceirizada
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
	                    esc.esc_situacao <> 3
	                    AND uad.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))");

                if (listSchoolSuperior != null && listSchoolSuperior.Any())
                    sb.Append(" AND uadSuperior.uad_id in @idsDRE");

                if(listClassificationTypeSchool != null && listClassificationTypeSchool.Any())
                    sb.Append(" AND tce.tce_id IN @idsTipoClassificacaoEscola");

                sb.Append(" ORDER BY esc.esc_nome");

                var query = context.Query<School>(sb.ToString(),
                    new
                    {
                        usu_idLogado = userId
                        ,gru_idLogado = groupId
                        ,idsDRE = listSchoolSuperior
                        ,idsTipoClassificacaoEscola = listClassificationTypeSchool
                    }
                    );
                return query;
            }
        }

        public IEnumerable<School> GetBySuperior(Guid userId, Guid groupId, Guid schoolSuperiorId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<School>(
                    @"SELECT DISTINCT
	                     esc.esc_id 'Id'
	                    , esc.esc_nome 'Name'
                    FROM 
	                    ESC_Escola esc WITH(NOLOCK)
                    WHERE
	                    esc.esc_situacao <> 3
	                    AND esc.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))
                        AND esc.uad_idSuperiorGestao = @idDre",
                    new
                    {
                        usu_idLogado = userId , gru_idLogado = groupId, idDre = schoolSuperiorId
                    }
                    );
                return query;
            }
        }
    }
}
