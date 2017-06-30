using Notification.Entity.Database;
using Notification.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business
{
    public class LogBusiness
    {
        public const string ConfigIsEnabledInfo = "LogIsEnabledInfo";
        public const string ConfigIsEnabledWarn = "LogIsEnabledWarn";
        public const string ConfigIsEnabledError = "LogIsEnabledError";

        public static bool IsEnabledInfo = false;
        public static bool IsEnabledWarn = false;
        public static bool IsEnabledError = true;

        public static void Info(string message)
        {
            if (IsEnabledInfo)
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
        }

        public static void Warn(string message)
        {
            if (IsEnabledWarn)
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
        }
        
        public static Guid Error(Exception exception)
        {
            if (IsEnabledError)
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
            else
                return Guid.Empty;
        }

        public static IEnumerable<Log> Get(int page, int size)
        {
            var repository = new LogRepository();
            return repository.Get(page, size);
        }

        public static IEnumerable<Log> GetById(Guid id)
        {
            var repository = new LogRepository();
            return repository.GetById(id);
        }
    }
}
