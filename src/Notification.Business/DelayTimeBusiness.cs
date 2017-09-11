using Notification.Business.Cache;
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

        public static int GetTimeById(int id)
        {
            var cache = DelayTimeCache.Instance;
            var delayTime = cache.GetValue(id.ToString());
            
            if (delayTime == 0)
            {
                var repository = new DelayTimeRepository();
                var u = repository.GetById(id);

                if (u != null)
                {
                    delayTime = u.TimeMinutes;
                    cache.Add(id.ToString(), delayTime);
                }
                return delayTime;
            }
            else
            {
                return delayTime;
            }
        }
    }
}
