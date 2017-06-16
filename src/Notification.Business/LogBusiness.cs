using Notification.Entity.Database;
using Notification.Repository;
using System;
using System.Collections.Generic;
using MongoDB.Bson;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business
{
    public class LogBusiness
    {
        public static void Info(string message)
        {
            var entity = new Log()
            {
                date = DateTime.Now,
                level = "INFO",
                message = message                
            };

            var repository = new LogRepository();
            repository.InsertOneAsync(entity);
        }

        public static void Warn(string message)
        {
            var entity = new Log()
            {
                date = DateTime.Now,
                level = "WARN",
                message = message
            };

            var repository = new LogRepository();
            repository.InsertOneAsync(entity);
        }
        
        public static ObjectId Error(Exception exception)
        {
            var entity = new Log()
            {
                date = DateTime.Now,
                level = "ERROR",
                message = exception.Message,
                exception = new LogException()
            };
            
            entity.exception.message = exception.Message;
            entity.exception.source = exception.Source;
            entity.exception.stackTrace = exception.GetType().ToString() + exception.StackTrace;
            
            var repository = new LogRepository();
            return repository.InsertOne(entity);
        }

        public static IEnumerable<Log> Get(int page, int size)
        {
            var repository = new LogRepository();
            return repository.Get(page, size);
        }

        public static IEnumerable<Log> GetById(string id)
        {
            var repository = new LogRepository();
            return repository.GetById(id);
        }
    }
}
