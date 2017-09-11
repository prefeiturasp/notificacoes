using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class TeacherBusiness
    {
        public static IEnumerable<Teacher> Get(Guid userId, Guid groupId, string calendarName, IEnumerable<Guid> listSchoolSuperior, IEnumerable<int> listClassificationTypeSchool, IEnumerable<int> listSchool, IEnumerable<int> listPosition, IEnumerable<int> listCourse, IEnumerable<int> listCoursePeriod, IEnumerable<int> listDiscipline, IEnumerable<int> listTeam)
        {
            var repository = new TeacherRepository();
            return repository.Get(userId, groupId, calendarName, listSchoolSuperior, listClassificationTypeSchool, listSchool, listPosition, listCourse, listCoursePeriod, listDiscipline,listTeam);
        }
    }
}
