using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository
{
    public class NotificationRepository : Connections.NotificationRepository<Notification.Entity.Database.Notification>
    {
        public Guid InsertOne(Notification.Entity.Database.Notification entity)
        {
            Collection.InsertOne(entity);
            return entity.Id;
        }
    }
}
