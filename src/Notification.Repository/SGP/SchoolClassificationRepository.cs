using Dapper;
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
    public class SchoolClassificationRepository : SGPRepository
    {
        public IEnumerable<SchoolClassification> Get(Guid userId, Guid groupId, IEnumerable<Guid> listSchoolSuperior)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(@"SELECT
	                    tce.tce_id 'Id',
	                    tce.tce_nome 'Name',
	                    tce.tce_permiteQualquerCargoEscola
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

                var query = context.Query<SchoolClassification>(
                    sb.ToString(),
                    new
                    {
                        usu_idLogado = userId,
                        gru_idLogado = groupId,
                        idDre = listSchoolSuperior
                    });
                return query;
            }
        }
    }
}
