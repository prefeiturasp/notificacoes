using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.API
{
    public class Recipient
    {
        public IEnumerable<SystemRecipient> SystemRecipient { get; set; }

        public IEnumerable<ContributorRecipient> ContributorRecipient { get; set; }

        public IEnumerable<TeacherRecipient> TeacherRecipient { get; set; }

        public IEnumerable<Guid> UserRecipient { get; set; }
    }
}
