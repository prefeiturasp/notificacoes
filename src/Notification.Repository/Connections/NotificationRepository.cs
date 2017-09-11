using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.Connections
{
    public abstract class NotificationRepository<T> where T: class
    {
        internal readonly string stringConnection;
        internal IMongoCollection<T> Collection { get; private set; }

        public NotificationRepository()
        {
            stringConnection = Connection.Get("Notification");
            BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;

            var database = new MongoUrlBuilder(stringConnection).DatabaseName;            
            var client = new MongoClient(stringConnection);            
            
            var db = client.GetDatabase(database);            
            Collection = db.GetCollection<T>(typeof(T).Name.ToLower());            
        }        
    }
}
