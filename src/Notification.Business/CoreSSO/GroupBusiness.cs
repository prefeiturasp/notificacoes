using Notification.Entity.API.CoreSSO;
using Notification.Repository.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.CoreSSO
{
    public class GroupBusiness
    {
        public const string TYPE_GRU_ID = "groupSid";

        public static IEnumerable<Group> GetGroupDown(Guid userId, int systemId)
        {
            var repository = new GroupRepository();
            return repository.GetGroupDown(userId, systemId);
        }

        /// <summary>
        /// Busca todos os grupos pertencentes àquele usuário dentro do sistema especificado.
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="systemId"></param>
        /// <returns></returns>
        public static IEnumerable<Group> Get(Guid userId, int systemId)
        {
            var repository = new GroupRepository();
            return repository.Get(userId, systemId);
        }
    }
}
