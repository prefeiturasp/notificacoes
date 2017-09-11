using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Entity.API
{
    public class SystemRecipient
    {
        public IEnumerable<int> SystemId { get; set; }

        public IEnumerable<Guid> GroupId { get; set; }

        public IEnumerable<Guid> AdministrativeUnitSuperior { get; set; }

        public IEnumerable<Guid> AdministrativeUnit { get; set; }
    }
}
