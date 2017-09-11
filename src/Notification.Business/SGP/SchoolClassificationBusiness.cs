using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;

namespace Notification.Business.SGP
{
    public class SchoolClassificationBusiness
    {
        public static IEnumerable<SchoolClassification> Get(Guid userId, Guid groupId, IEnumerable<Guid> listSchoolSuperior)
        {
            var repository = new SchoolClassificationRepository();
            return repository.Get(userId, groupId, listSchoolSuperior);
        }
    }
}
