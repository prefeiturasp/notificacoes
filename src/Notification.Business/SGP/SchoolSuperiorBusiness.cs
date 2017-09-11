using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class SchoolSuperiorBusiness
    {
        public static IEnumerable<SchoolSuperior> Get(Guid userId, Guid groupId)
        {
            var repository = new SchoolSuperiorRepository();
            return repository.Get(userId, groupId);
        }
    }
}
