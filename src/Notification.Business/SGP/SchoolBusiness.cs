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
        public static IEnumerable<School> Get(Guid userId, Guid groupId, Guid schoolSuperiorId, IEnumerable<int> listClassificationTypeSchool)
        {
            var repository = new SchoolRepository();
            return repository.Get(userId, groupId, schoolSuperiorId, listClassificationTypeSchool);
        }

        public static IEnumerable<School> Get(Guid userId, Guid groupId, Guid schoolSuperiorId)
        {
            var repository = new SchoolRepository();
            return repository.GetBySuperior(userId, groupId, schoolSuperiorId);
        }
    }
}
