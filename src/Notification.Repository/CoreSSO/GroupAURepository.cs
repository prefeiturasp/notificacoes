using Dapper;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.CoreSSO
{
    public class GroupAURepository : CoreSSORepository
    {
        public IEnumerable<GroupAU> Get(Guid userId, Guid groupId)
        {
            using (var context = new SqlConnection(stringConnection))
            {
                var query = context.Query<GroupAU>(
                    @"SELECT UGUA.gru_id AS GroupId, UGUA.uad_id AS AdministrativeUnitId, UAD.uad_nome AS AdministrativeUnitName		
	                    FROM SYS_UsuarioGrupoUA AS UGUA WITH(NOLOCK)
	                    INNER JOIN SYS_UsuarioGrupo AS UG WITH(NOLOCK) ON UG.usu_id = UGUA.usu_id AND UG.gru_id = UGUA.gru_id
	                    INNER JOIN SYS_UnidadeAdministrativa AS UAD WITH(NOLOCK) ON UAD.ent_id = UGUA.ent_id AND UAD.uad_id = UGUA.uad_id
	                    WHERE UG.usg_situacao = 1 AND UGUA.gru_id = @groupId /*AND UGUA.usu_id = ''*/",
                    new { groupId = groupId });
                return query;
            }
        }
    }
}
