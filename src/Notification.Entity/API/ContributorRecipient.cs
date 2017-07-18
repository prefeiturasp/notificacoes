using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;


namespace Notification.Entity.API
{
    public class ContributorRecipient
    {
        public Calendar Calendar { get; set; }

        public IEnumerable<Guid> SchoolSuperior { get; set; }

        public IEnumerable<int> SchoolClassification { get; set; }

        public IEnumerable<int> School { get; set; }

        public IEnumerable<int> Position { get; set; }
    }
}
