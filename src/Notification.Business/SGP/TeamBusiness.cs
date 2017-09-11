using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class TeamBusiness
    {
        public static IEnumerable<Team> Get(
            Guid userId,
            Guid groupId,
            string calendarYear,
            IEnumerable<Guid> schoolSuperiorId,
            IEnumerable<int> schoolClassificationId,
            IEnumerable<int> schoolId,
            IEnumerable<int> courseId,
            IEnumerable<string> coursePeriodId,
            IEnumerable<int> disciplineId)
        {
            var repository = new TeamRepository();
            return repository.Get(userId, groupId, calendarYear, schoolSuperiorId, schoolClassificationId, schoolId, courseId, coursePeriodId, disciplineId);
        }
    }
}
