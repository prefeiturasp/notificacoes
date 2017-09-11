using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class CoursePeriodBusiness
    {
        public static IEnumerable<CoursePeriod> Get(string calendarYear, IEnumerable<int> courseId)
        {
            var repository = new CoursePeriodRepository();
            return repository.Get(calendarYear, courseId);
        }
    }
}
