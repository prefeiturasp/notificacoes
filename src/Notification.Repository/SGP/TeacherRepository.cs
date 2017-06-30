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
    public class TeacherRepository : SGPRepository
    {
        /// <summary>
        /// Retorna docentes baseados em filtros.
        /// </summary>
        /// <returns></returns>
        public IEnumerable<Teacher> Get(Guid userId, Guid groupId, string calendarName, IEnumerable<Guid> listSchoolSuperior, IEnumerable<int> listClassificationTypeSchool, IEnumerable<int> listSchool, IEnumerable<int> listPosition, IEnumerable<int> listCourse, IEnumerable<int> listCoursePeriod, IEnumerable<int> listDiscipline, IEnumerable<int> listTeam )
        {
            using (var context = new SqlConnection(stringConnection))
            {
                StringBuilder sb = new StringBuilder();
                sb.Append(
                    @"SELECT
                        DISTINCT
	                    usu.usu_id 'Id'
	
	                    FROM
	                    TUR_Turma tur WITH(NOLOCK)
	                    INNER JOIN ESC_Escola esc WITH(NOLOCK)
		                    ON esc.esc_id = tur.esc_id
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
	                    INNER JOIN TUR_TurmaRelTurmaDisciplina relTud WITH(NOLOCK)
		                    ON relTud.tur_id = tur.tur_id
	                    INNER JOIN TUR_TurmaDisciplinaRelDisciplina relDis WITH(NOLOCK)
		                    ON relDis.tud_id = relTud.tud_id
	                    INNER JOIN ACA_Disciplina dis WITH(NOLOCK)
		                    ON dis.dis_id = relDis.dis_id
		                    AND dis.dis_situacao <> 3
	                    INNER JOIN TUR_TurmaCurriculo tcr WITH(NOLOCK)
		                    ON tcr.tur_id = tur.tur_id
		                    AND tcr.tcr_situacao <> 3
	                    INNER JOIN TUR_TurmaDocente tdt WITH(NOLOCK)
		                    ON tdt.tud_id = relTud.tud_id
		                    AND tdt.tdt_situacao <> 3
	                    INNER JOIN RHU_Cargo crg WITH(NOLOCK)
		                    ON crg.crg_id = tdt.crg_id
		                    AND crg.crg_situacao <> 3
	                    INNER JOIN RHU_Colaborador col WITH(NOLOCK)
		                    ON col.col_id = tdt.col_id
		                    AND col.col_situacao <> 3
	                    INNER JOIN Synonym_SYS_Usuario usu WITH(NOLOCK)
		                    ON usu.pes_id = col.pes_id
		                    AND usu.usu_situacao <> 3
	                    INNER JOIN ACA_CalendarioAnual as cal WITH(NOLOCK)
		                    ON tur.cal_id=cal.cal_id
		                    AND uad.ent_id=cal.ent_id
		                    AND cal.cal_situacao<>3
                    WHERE
	                    tur.tur_situacao <> 3
	                    AND uad.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@usu_idLogado, @gru_idLogado))");

                if (!String.IsNullOrEmpty(calendarName))
                    sb.Append(" AND cal.cal_ano = @calendarioNome");

                if (listSchoolSuperior != null && listSchoolSuperior.Any())
                    sb.Append(" AND uadSuperior.uad_id IN @idsDRES");

                if (listClassificationTypeSchool != null && listClassificationTypeSchool.Any())
                    sb.Append(" AND tce.tce_id IN @idsTipoClassificacaoEscola");

                if (listSchool != null && listSchool.Any())
                    sb.Append(" AND esc.esc_id IN @idsEscola");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND crg.crg_id IN @idsCargo");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND tcr.cur_id IN @idsCurso");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND tcr.crp_id IN @idsPeriodo");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND dis.tds_id IN @idsDisciplina");

                if (listPosition != null && listPosition.Any())
                    sb.Append(" AND tur.tur_id IN @idsTurma");



                var query = context.Query<Teacher>(
                    sb.ToString(),
                     new
                     {
                         calendarioNome = calendarName
                        , usu_idLogado = userId
                        , gru_idLogado = groupId
                        , idsDRES = listSchoolSuperior
                        , idsTipoClassificacaoEscola = listClassificationTypeSchool
                        , idsEscola = listSchool
                        , idsCargo = listPosition
                        , idsCurso = listCourse
                        , idsPeriodo = listCoursePeriod
                        , idsDisciplina = listDiscipline
                        , idsTurma = listTeam
                     }
                     );
                return query;
            }
        }
    }
}
