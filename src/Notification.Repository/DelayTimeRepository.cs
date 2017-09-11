using MongoDB.Bson;
using MongoDB.Driver;
using Notification.Entity.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository
{
    public class DelayTimeRepository : Connections.NotificationRepository<DelayTime>
    {
        public int InsertOne(DelayTime entity)
        {
            Collection.InsertOne(entity);
            return entity.Id;
        }

        public IEnumerable<DelayTime> Get()
        {
            return Collection.Find(new BsonDocument()).ToList();
        }

        public DelayTime GetById(int id)
        {
            return Collection.Find(d => d.Id == id).FirstOrDefault();
        }
    }
}
