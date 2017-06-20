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
        //idsCalendario, idsDRE, idsTipoClassificacaoEscola, idsEscola, idsCurso, idsPeriodo, idsDisciplina
        public IEnumerable<Team> Get(int idsCalendario, Guid idsDRE, int idsTipoClassificacaoEscola, int idsEscola, int idsCurso, int idsPeriodo, int idsDisciplina)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Team>(
                    @"SELECT
                        tur.tur_id,
                        tur.esc_id,
                        tur.uni_id,
                        tur.tur_codigo,
                        tur.tur_descricao,
                        tur.tur_vagas,
                        tur.tur_minimoMatriculados,
                        tur.tur_duracao,
                        tur.cal_id,
                        tur.trn_id,
                        tur.tur_situacao,
                        tur.tur_dataCriacao,
                        tur.tur_dataAlteracao,
                        tur.fav_id,
                        tur.tur_docenteEspecialista,
                        tur.tur_tipo,
                        tur.tur_codigoEOL,
                        tur.tur_codigoInep,
                        tur.tur_dataEncerramento
                    FROM TUR_Turma tur WITH(NOLOCK)
                    INNER JOIN ACA_CalendarioAnual cal WITH(NOLOCK)
                        ON cal.cal_id = tur.cal_id
                        AND cal.cal_situacao <> 3
                    INNER JOIN ESC_Escola esc WITH(NOLOCK)
                        ON esc.esc_id = tur.esc_id
                        AND esc.esc_situacao <> 3
                    INNER JOIN ESC_EscolaClassificacao ecl WITH(NOLOCK)
                        ON ecl.esc_id = esc.esc_id
                    INNER JOIN ESC_TipoClassificacaoEscola tce WITH(NOLOCK)
                        ON tce.tce_id = ecl.tce_id
                        AND tce.tce_situacao <> 3
                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uad WITH(NOLOCK)
                        ON uad.ent_id = esc.ent_id
                        AND uad.uad_id = esc.uad_id
                    INNER JOIN Synonym_SYS_UnidadeAdministrativa uadSuperior WITH(NOLOCK)
                        ON uadSuperior.ent_id = uad.ent_id
                        AND uadSuperior.uad_id = ISNULL(esc.uad_idSuperiorGestao, uad.uad_idSuperior)
                        AND uadSuperior.uad_situacao <> 3
                    INNER JOIN TUR_TurmaCurriculo tcr WITH(NOLOCK)
                        ON tcr.tur_id = tur.tur_id
                        AND tcr.tcr_situacao <> 3
                    INNER JOIN TUR_TurmaRelTurmaDisciplina relTud WITH(NOLOCK)
                        ON relTud.tur_id = tur.tur_id
                    INNER JOIN TUR_TurmaDisciplinaRelDisciplina relDis WITH(NOLOCK)
                        ON relDis.tud_id = relTud.tud_id
                    INNER JOIN ACA_Disciplina dis WITH(NOLOCK)
                        ON dis.dis_id = relDis.dis_id
                        AND dis.dis_situacao <> 3
                    WHERE
                        tur.tur_situacao <> 3
                        AND cal.cal_id IN @idsCalendario
                        AND uadSuperior.uad_id IN @idsDRE
                        AND tce.tce_id IN @idsTipoClassificacaoEscola
                        AND esc.esc_id IN @idsEscola
                        AND tcr.cur_id IN @idsCurso
                        AND tcr.crp_id IN @idsPeriodo
                        AND dis.tds_id IN @idsDisciplina",
                     new { cal_id = idsCalendario
                            , uad_id = idsDRE
                            , tce_id = idsTipoClassificacaoEscola
                            , esc_id = idsEscola
                            , cur_id = idsCurso
                            , crp_id = idsPeriodo
                            , tds_id = idsDisciplina
                     });
                return query;
            }
        }
    }
}
