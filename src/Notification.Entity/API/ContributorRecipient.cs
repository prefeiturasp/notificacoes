using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.API
{
    public class ContributorRecipient
    {
        public IEnumerable<Guid> SchoolSuperior { get; set; }

        public IEnumerable<int> SchoolClassification { get; set; }

        public IEnumerable<int> School { get; set; }

        public IEnumerable<int> Position { get; set; }
    }
}
