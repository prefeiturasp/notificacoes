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
    public class PositionRepository : SGPRepository
    {
        public IEnumerable<Position> Get()
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<Position>(
                    @"SELECT 
                        crg.crg_id,
                        crg.crg_nome,
                        crg.crg_descricao,
                        crg.crg_codigo,
                        crg.crg_cargoDocente,
                        crg.crg_especialista,
                        crg.crg_maxAulaDia,
                        crg.crg_maxAulaSemana,
                        crg.crg_tipo,
                        crg.crg_situacao,
                        crg.tvi_id,
                        crg.crg_dataCriacao,
                        crg.crg_dataAlteracao
                    FROM 
                        RHU_Cargo crg WITH(NOLOCK)
                    WHERE 
                        crg.crg_situacao <> 3");
                return query;
            }
        }
    }
}
