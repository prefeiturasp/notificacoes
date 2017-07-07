using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class SchoolBusiness
    {
        public static IEnumerable<School> Get(Guid userId, Guid groupId, IEnumerable<Guid> listSchoolSuperior, IEnumerable<int> listClassificationTypeSchool)
        {
            var repository = new SchoolRepository();
            return repository.Get(userId, groupId, listSchoolSuperior, listClassificationTypeSchool);
        }

        public static IEnumerable<School> Get(Guid userId, Guid groupId, Guid schoolSuperiorId)
        {
            var repository = new SchoolRepository();
            return repository.GetBySuperior(userId, groupId, schoolSuperiorId);
        }

        /// <summary>
        /// Constrói uma lista de Unidades administrativas (escolas) filhas baseadas na(s) DRE(s) passada(s) por parâmetro.
        /// Caso venha nulo, busca todas que o usuário logado tenha permissão.
        /// </summary>
        /// <param name="userId">id usuário logado</param>
        /// <param name="groupId">ig grupo usuário logado</param>
        /// <param name="ltSchoolSuperior">Lista de DRE's</param>
        /// <returns></returns>
        public static IEnumerable<Guid> GetAUBySuperior(Guid userId, Guid groupId, IEnumerable<Guid> ltSchoolSuperior)
        {
            var repository = new SchoolRepository();
            return repository.GetAUBySuperior(userId, groupId, ltSchoolSuperior);
        }
    }
}
