﻿using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class ContributorBusiness
    {
        public static IEnumerable<Contributor> Get(Guid userId, Guid groupId, string calendarName, IEnumerable<Guid> listSchoolSuperior, IEnumerable<int> listClassificationTypeSchool, IEnumerable<int> listSchool, IEnumerable<int> listPosition)
        {
            var repository = new ContributorRepository();
            return repository.Get(userId, groupId, calendarName, listSchoolSuperior, listClassificationTypeSchool, listSchool, listPosition );
        }
    }
}
