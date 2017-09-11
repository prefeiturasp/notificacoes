using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class DisciplineBusiness
    {
        public static IEnumerable<Discipline> Get(string calendarYear, IEnumerable<int> courseId, IEnumerable<string> coursePeriodId)
        {
            var repository = new DisciplineRepository();
            return repository.Get(calendarYear, courseId, coursePeriodId);
        }
    }
}
