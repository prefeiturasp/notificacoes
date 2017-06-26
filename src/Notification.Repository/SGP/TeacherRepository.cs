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
    public class TeacherRepository : SGPRepository
    {
        /// <summary>
        /// Retorna docentes baseados em filtros.
        /// </summary>
        /// <returns></returns>
        public IEnumerable<Teacher> Get(Guid userId, Guid groupId, IEnumerable<string> listCalendar,  IEnumerable<Guid> listSchoolSuperior, IEnumerable<int> listClassificationTypeSchool, IEnumerable<int> listSchool, IEnumerable<int> listPosition)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(
                    @"SELECT
	                    usu.usu_id 'Id',
                        pes.pes_nome 'Name'
	                   
                    FROM
	                    RHU_Colaborador col WITH(NOLOCK)
	                    INNER JOIN Synonym_SYS_Usuario usu WITH(NOLOCK)
		                    ON usu.pes_id = col.pes_id
		                    AND usu.usu_situacao <> 3
	                    INNER JOIN RHU_ColaboradorCargo coc WITH(NOLOCK)
		                    ON coc.col_id = col.col_id
		                    AND coc.coc_situacao <> 3
	                    INNER JOIN RHU_Cargo crg WITH(NOLOCK)
		                    ON crg.crg_id = coc.crg_id
		                    AND crg.crg_cargoDocente = 0
		                    AND crg.crg_situacao <> 3
	                    INNER JOIN ESC_Escola esc WITH(NOLOCK)
		                    ON esc.ent_id = coc.ent_id
		                    AND esc.uad_id = coc.uad_id
		                    AND esc.esc_situacao <> 3
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uad WITH(NOLOCK)
		                    ON uad.ent_id = esc.ent_id
		                    AND uad.uad_id = esc.uad_id
		                    AND uad.uad_situacao <> 3
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK)
		                    ON uadSuperior.ent_id = uad.ent_id
		                    AND uadSuperior.uad_id = ISNULL(esc.uad_idSuperiorGestao, uad.uad_idSuperior)
		                    AND uadSuperior.uad_situacao <> 3
	                    INNER JOIN ESC_EscolaClassificacao ecl WITH(NOLOCK)
		                    ON ecl.esc_id = esc.esc_id
	                    INNER JOIN ESC_TipoClassificacaoEscola tce WITH(NOLOCK)
		                    ON tce.tce_id = ecl.tce_id
		                    AND tce.tce_situacao <> 3
	                    INNER JOIN ACA_CalendarioAnual cal WITH(NOLOCK)
		                    ON coc.coc_vigenciaInicio <= cal.cal_dataFim
		                    AND 
		                    (
			                    coc.coc_vigenciaFim IS NULL
			                    OR coc.coc_vigenciaFim >= cal.cal_dataInicio
		                    )
		                    AND cal.cal_situacao <> 3
                        INNER JOIN Synonym_PES_Pessoa as pes WITH(NOLOCK)
                            ON pes.pes_id= usu.pes_id
                    WHERE
	                    col.col_situacao <> 3
	                    AND uad.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))");

                if (listCalendar != null && listCalendar.Any())
                    sb.Append(" AND cal.cal_id IN @idsCalendario");

                if (listSchoolSuperior != null && listSchoolSuperior.Any())
                    sb.Append(" AND uadSuperior.uad_id IN @idsDRES");

                if (listClassificationTypeSchool != null && listClassificationTypeSchool.Any())
                    sb.Append(" AND tce.tce_id IN @idsTipoClassificacaoEscola");

                if (listSchool != null && listSchool.Any())
                    sb.Append(" AND esc.esc_id IN @idsEscola");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND crg.crg_id IN @idsCargo");

               sb.Append(@"UNION
                    SELECT
	                     usu.usu_id 'Id',
                        pes.pes_nome 'Name'
                    FROM
	                    RHU_Colaborador col WITH(NOLOCK)
	                    INNER JOIN Synonym_SYS_Usuario usu WITH(NOLOCK)
		                    ON usu.pes_id = col.pes_id
		                    AND usu.usu_situacao <> 3
	                    INNER JOIN RHU_ColaboradorCargo coc WITH(NOLOCK)
		                    ON coc.col_id = col.col_id
		                    AND coc.coc_situacao <> 3
	                    INNER JOIN RHU_Cargo crg WITH(NOLOCK)
		                    ON crg.crg_id = coc.crg_id
		                    AND crg.crg_cargoDocente = 0
		                    AND crg.crg_situacao <> 3
	                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK)
		                    ON uadSuperior.ent_id = coc.ent_id
		                    AND uadSuperior.uad_id = coc.uad_id
		                    AND uadSuperior.uad_situacao <> 3
	                    INNER JOIN ESC_Escola esc WITH(NOLOCK)
		                    ON esc.ent_id = uadSuperior.ent_id
		                    AND esc.uad_idSuperiorGestao = uadSuperior.uad_id
		                    AND esc.esc_situacao <> 3
	                    INNER JOIN ESC_EscolaClassificacao ecl WITH(NOLOCK)
		                    ON ecl.esc_id = esc.esc_id
	                    INNER JOIN ESC_TipoClassificacaoEscola tce WITH(NOLOCK)
		                    ON tce.tce_id = ecl.tce_id
		                    AND tce.tce_situacao <> 3
	                    INNER JOIN ACA_CalendarioAnual cal WITH(NOLOCK)
		                    ON coc.coc_vigenciaInicio <= cal.cal_dataFim
		                    AND 
		                    (
			                    coc.coc_vigenciaFim IS NULL
			                    OR coc.coc_vigenciaFim >= cal.cal_dataInicio
		                    )
		                    AND cal.cal_situacao <> 3
                        INNER JOIN Synonym_PES_Pessoa as pes WITH(NOLOCK)
                            ON pes.pes_id= usu.pes_id
                    WHERE
	                    col.col_situacao <> 3
	                    AND esc.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))");

                if (listCalendar != null && listCalendar.Any())
                    sb.Append(" AND cal.cal_id IN @idsCalendario");

                if (listSchoolSuperior != null && listSchoolSuperior.Any())
                    sb.Append(" AND uadSuperior.uad_id IN @idsDRES");

                if (listClassificationTypeSchool != null && listClassificationTypeSchool.Any())
                    sb.Append(" AND tce.tce_id IN @idsTipoClassificacaoEscola");

                if (listSchool != null && listSchool.Any())
                    sb.Append(" AND esc.esc_id IN @idsEscola");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND crg.crg_id IN @idsCargo");

                var query = context.Query<Teacher>(
                    sb.ToString(),
                     new
                     {
                         usu_idLogado = userId
                        , gru_idLogado = groupId
                        , idsDRE = listSchoolSuperior
                        , idsTipoClassificacaoEscola = listClassificationTypeSchool
                        , idsCargo = listPosition
                         
                     }
                     );
                return query;
            }
        }
    }
}
