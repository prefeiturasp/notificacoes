using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class CourseBusiness
    {
        public static IEnumerable<Course> Get(string calendarYear)
        {
            var repository = new CourseRepository();
            return repository.Get(calendarYear);
        }
    }
}
