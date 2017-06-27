using Notification.Entity.Database;
using Notification.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business
{
    public class DelayTimeBusiness
    {
        public static int Save(DelayTime entity)
        {
            var repository = new DelayTimeRepository();
            return repository.InsertOne(entity);
        }

        public static IEnumerable<DelayTime> Get()
        {
            var repository = new DelayTimeRepository();
            return repository.Get();
        }
    }
}
