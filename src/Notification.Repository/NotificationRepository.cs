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

        public void UpdateRead(Guid id, Guid userId, bool read)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var filter = builder.Eq(n => n.Id, id) & builder.ElemMatch(n => n.Recipient, nr => nr.UserId == userId);
            var update = Builders<Notification.Entity.Database.Notification>.Update.Set(n => n.Recipient.ElementAt(-1).Read , read);

            //var sfilter = filter.Render(Collection.DocumentSerializer, Collection.Settings.SerializerRegistry).ToString();
            //var sUpdate = update.Render(Collection.DocumentSerializer, Collection.Settings.SerializerRegistry).ToString();
            
            var result = Collection.UpdateOne(filter, update);
        }

        public void UpdateDelayDate(Guid id, Guid userId, DateTime delayDate)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var filter = builder.Eq(n => n.Id, id) & builder.ElemMatch(n => n.Recipient, nr => nr.UserId == userId);
            var update = Builders<Notification.Entity.Database.Notification>.Update
                .Set(n => n.Recipient.ElementAt(-1).Read, false)
                .Set(n => n.Recipient.ElementAt(-1).DelayDate, delayDate);

            //var sfilter = filter.Render(Collection.DocumentSerializer, Collection.Settings.SerializerRegistry).ToString();
            //var sUpdate = update.Render(Collection.DocumentSerializer, Collection.Settings.SerializerRegistry).ToString();

            var result = Collection.UpdateOne(filter, update);
        }
        
        public NotificationPlugin GetById(Guid id)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var projection = Builders<Notification.Entity.Database.Notification>.Projection
                .Exclude(n => n.Recipient);

            var result = Collection.Find(n => n.Id == id).Project<NotificationPlugin>(projection).FirstOrDefault();

            return result;
        }

        public IEnumerable<NotificationPlugin> GetNotReadByUserId(Guid userId)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var filter = builder.ElemMatch(n => n.Recipient, 
                nr => nr.UserId == userId && nr.Read == false && nr.DelayDate > DateTime.Now.Date);
            var project = Builders<Notification.Entity.Database.Notification>.Projection
                .ElemMatch(n => n.Recipient, nr => nr.UserId == userId);
                        
            var result = Collection
                .Find(filter)
                .Project<NotificationPlugin>(project)
                .SortByDescending(n => n.MessageType)
                .SortBy(n => n.DateStartNotification);

            return result.ToList();
        }

        public IEnumerable<NotificationPlugin> GetReadByUserId(Guid userId)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var filter = builder.ElemMatch(n => n.Recipient, 
                nr => nr.UserId == userId && nr.Read == true && nr.DelayDate > DateTime.Now.Date);
            var project = Builders<Notification.Entity.Database.Notification>.Projection
                .ElemMatch(n => n.Recipient, nr => nr.UserId == userId);

            var result = Collection
                .Find(filter)
                .Project<NotificationPlugin>(project)
                .SortByDescending(n => n.MessageType)
                .SortBy(n => n.DateStartNotification);

            return result.ToList();
        }
    }
}
