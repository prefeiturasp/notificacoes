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
    public class TeamRepository : SGPRepository
    {
        public IEnumerable<Team> Get(
            Guid userId,
            Guid groupId,
            string calendarYear, 
            IEnumerable<Guid> schoolSuperiorId, 
            IEnumerable<int> schoolClassificationId, 
            IEnumerable<int> schoolId, 
            IEnumerable<int> courseId, 
            IEnumerable<string> coursePeriodId, 
            IEnumerable<int> disciplineId)
        {
            var ltCoursePeriod = coursePeriodId.Select(c => new { curId = c.Split('|')[0], crrId = c.Split('|')[1], crpId = c.Split('|')[2] });

            StringBuilder sb = new StringBuilder();
            sb.Append(@"SELECT tur.tur_id as Id, tur.tur_codigo as Name                      
                    FROM TUR_Turma tur WITH(NOLOCK)
                    INNER JOIN ACA_CalendarioAnual cal WITH(NOLOCK) ON cal.cal_id = tur.cal_id AND cal.cal_situacao <> 3
                    INNER JOIN ESC_Escola esc WITH(NOLOCK) ON esc.esc_id = tur.esc_id AND esc.esc_situacao <> 3
                    INNER JOIN ESC_EscolaClassificacao ecl WITH(NOLOCK) ON ecl.esc_id = esc.esc_id 
                    INNER JOIN ESC_TipoClassificacaoEscola tce WITH(NOLOCK) ON tce.tce_id = ecl.tce_id AND tce.tce_situacao <> 3 
                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uad WITH(NOLOCK) ON uad.ent_id = esc.ent_id AND uad.uad_id = esc.uad_id
                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK) ON uadSuperior.ent_id = uad.ent_id AND uadSuperior.uad_id = ISNULL(esc.uad_idSuperiorGestao, uad.uad_idSuperior) AND uadSuperior.uad_situacao <> 3
                    INNER JOIN TUR_TurmaCurriculo tcr WITH(NOLOCK) ON tcr.tur_id = tur.tur_id AND tcr.tcr_situacao <> 3
                    INNER JOIN TUR_TurmaRelTurmaDisciplina relTud WITH(NOLOCK) ON relTud.tur_id = tur.tur_id
                    INNER JOIN TUR_TurmaDisciplinaRelDisciplina relDis WITH(NOLOCK) ON relDis.tud_id = relTud.tud_id
                    INNER JOIN ACA_Disciplina dis WITH(NOLOCK) ON dis.dis_id = relDis.dis_id AND dis.dis_situacao <> 3");
            
            if (ltCoursePeriod.Any())
            {
                sb.Append(" INNER JOIN (");

                foreach (var item in ltCoursePeriod)
                {
                    sb.Append(string.Format("SELECT {0} AS CUR_ID, {1} AS CRR_ID, {2} AS CRP_ID UNION ", item.curId, item.crrId, item.crpId));
                }

                sb.Remove(sb.Length - 7, 7);
                sb.Append(") AS T1 ON T1.cur_id = tcr.cur_id AND T1.crr_id = tcr.crr_id AND T1.crp_id = tcr.crp_id");
            }

            sb.Append(@" WHERE tur.tur_situacao <> 3 AND cal.cal_ano = @calendarYear
                AND uad.uad_id IN (SELECT uad_id FROM Synonym_FN_Select_UAs_By_PermissaoUsuario(@userId, @groupId))");

            if (schoolSuperiorId != null && schoolSuperiorId.Any())
                sb.Append(" AND uadSuperior.uad_id IN @schoolSuperiorId");

            if (schoolClassificationId != null && schoolClassificationId.Any())
                sb.Append(" AND tce.tce_id IN @schoolClassificationId");

            if (schoolId != null && schoolId.Any())
                sb.Append(" AND esc.esc_id IN @schoolId");

            if (courseId != null && courseId.Any())
                sb.Append(" AND tcr.cur_id IN @courseId");

            if (disciplineId != null && disciplineId.Any())
                sb.Append(" AND dis.tds_id IN @disciplineId");

            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Team>(sb.ToString(),
                     new
                     {
                         userId = userId,
                         groupId = groupId,
                         calendarYear = calendarYear,
                         schoolSuperiorId = schoolSuperiorId,
                         schoolClassificationId = schoolClassificationId,
                         schoolId = schoolId,
                         courseId = courseId,
                         crp_id = coursePeriodId,
                         disciplineId = disciplineId
                     });
                return query;
            }
        }
    }
}
