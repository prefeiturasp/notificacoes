using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;

namespace Notification.Entity.API
{
    public class TeacherRecipient
    {
        public Calendar Calendar { get; set; }

        public IEnumerable<Guid> SchoolSuperior { get; set; }

        public IEnumerable<int> SchoolClassification { get; set; }

        public IEnumerable<int> School { get; set; }

        public IEnumerable<int> Position { get; set; }

        public IEnumerable<int> Course { get; set; }

        public IEnumerable<int> CoursePeriod { get; set; }

        public IEnumerable<int> Discipline { get; set; }

        public IEnumerable<int> Team { get; set; }
    }
}
