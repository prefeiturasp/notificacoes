using Notification.Repository.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.CoreSSO
{
    public class SystemBusiness
    {
        public static IEnumerable<Notification.Entity.API.CoreSSO.System> Get(Guid userId)
        {
            var repository = new SystemRepository();
            return repository.Get(userId);
        }
    }
}
