using MongoDB.Bson;
using MongoDB.Driver;
using Notification.Entity.API;
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

        public NotificationPlugin GetById(Guid id)
        {
            var result = Collection.Find(n => n.Id == id).FirstOrDefault();

            if (result == null)
                return null;

            return new NotificationPlugin()
            {
                Id = result.Id,
                SenderName = result.SenderName,
                DateStartNotification = result.DateStartNotification,
                DateEndNotification = result.DateEndNotification,
                MessageType = result.MessageType,
                Title = result.Title,
                Message = result.Message
            };
        }

        public IEnumerable<NotificationPlugin> GetByUserId(Guid userId)
        {
            var result = Collection
                .Find(n => n.Recipient.Any(r => r.UserId == userId))
                .Project(x => new NotificationPlugin() {
                    Id = x.Id,
                    SenderName = x.SenderName,
                    DateStartNotification = x.DateStartNotification,
                    DateEndNotification = x.DateEndNotification,
                    MessageType = x.MessageType,
                    Title = x.Title,
                    Message = x.Message
                });
            
            return result.ToList();            
        }
    }
}
