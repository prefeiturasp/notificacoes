using Notification.Entity.Database.CoreSSO;
using Notification.Repository.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.CoreSSO
{
    public class IDSClientCorsOriginsBusiness
    {
        public static IEnumerable<IDSClientCorsOrigins> Get()
        {
            var repository = new IDSClientCorsOriginsRepository();
            return repository.Get();
        }
    }
}
