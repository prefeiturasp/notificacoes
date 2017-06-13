using Notification.Entity.Database;
using System;
using System.Collections.Generic;
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
        }

        public static void Warn(string message)
        {
            var entity = new Log()
            {
                date = DateTime.Now,
                level = "WARN",
                message = message
            };
        }

        public static void Error(Exception exception)
        {
            var entity = new Log()
            {
                date = DateTime.Now,
                level = "ERROR",
                message = exception.Message
            };
        }
    }
}
