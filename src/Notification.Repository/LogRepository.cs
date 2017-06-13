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
    public class LogRepository : Connections.NotificationRepository<Log>
    {
        public IEnumerable<Log> Get()
        {
            return Collection.Find(new BsonDocument()).ToList();
        }

        public void Insert()
        {
            var entity = new Log()
            {
                date = DateTime.Now,
                level = "Info",
                message = "Mensagem Padrão",
                exception = new LogException() { message = "teste", source = "source", stackTrace = "trace"}
            };

            Collection.InsertOne(entity);
        }
    }
}
