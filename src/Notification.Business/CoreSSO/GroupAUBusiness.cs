using Notification.Entity.API.CoreSSO;
using Notification.Repository.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.CoreSSO
{
    public class GroupAUBusiness
    {
        public static IEnumerable<GroupAU> Get(Guid userId, Guid groupId)
        {
            var repository = new GroupAURepository();
            return repository.Get(userId, groupId);
        }
    }
}
