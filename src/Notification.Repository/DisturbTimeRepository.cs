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
    public class DisturbTimeRepository : Connections.NotificationRepository<DisturbTime>
    {
        public int InsertOne(DisturbTime entity)
        {
            Collection.InsertOne(entity);
            return entity.Id;
        }

        public IEnumerable<DisturbTime> Get()
        {
            return Collection.Find(new BsonDocument()).ToList();
        }
    }
}
