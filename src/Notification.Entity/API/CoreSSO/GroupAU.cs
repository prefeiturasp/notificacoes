using System;

namespace Notification.Entity.API.CoreSSO
{
    public class GroupAU
    {
        public Guid GroupId { get; set; }

        public Guid AdministrativeUnitId { get; set; }

        public string AdministrativeUnitName { get; set; }
    }
}
