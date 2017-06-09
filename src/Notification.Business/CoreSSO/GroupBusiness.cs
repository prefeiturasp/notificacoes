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
        public static IEnumerable<Group> Get(Guid userId, int systemId)
        {
            var repository = new GroupRepository();
            return repository.Get(userId, systemId);
        }
    }
}
