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

        public IEnumerable<NotificationPlugin> GetNotReadByUserId(Guid userId, int page, int size, out long total)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var filter = builder.Lte(n => n.DateStartNotification, DateTime.Now.Date) &
                builder.ElemMatch(n => n.Recipient, nr => nr.UserId == userId && nr.Read == false);
            var project = Builders<Notification.Entity.Database.Notification>.Projection
                .Exclude(n => n.Recipient);
            var sort = Builders<Notification.Entity.Database.Notification>.Sort
                .Descending(n => n.MessageType)
                .Ascending(n => n.DateStartNotification);

            total = Collection
                .Find(filter)
                .Count();
            
            var result = Collection
                .Find(filter)
                .Project<Notification.Entity.API.NotificationPlugin>(project)
                .Sort(sort)
                .Skip(page * size)
                .Limit(size);

            return result.ToList();
        }
        
        public IEnumerable<NotificationPlugin> GetReadByUserId(Guid userId, int page, int size, out long total)
        {
            var builder = Builders<Notification.Entity.Database.Notification>.Filter;
            var filter = builder.Lte(n => n.DateStartNotification, DateTime.Now.Date) &
                builder.ElemMatch(n => n.Recipient, nr => nr.UserId == userId && nr.Read == true);
            var project = Builders<Notification.Entity.Database.Notification>.Projection
                .Exclude(n => n.Recipient);
            var sort = Builders<Notification.Entity.Database.Notification>.Sort
                .Descending(n => n.MessageType)
                .Ascending(n => n.DateStartNotification);

            total = Collection
                .Find(filter)
                .Count();

            var result = Collection
                .Find(filter)
                .Project<Notification.Entity.API.NotificationPlugin>(project)
                .Sort(sort)
                .Skip(page * size)
                .Limit(size);

            return result.ToList();
        }
    }
}
