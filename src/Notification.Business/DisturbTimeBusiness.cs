using Notification.Entity.Database;
using Notification.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business
{
    public class DisturbTimeBusiness
    {
        public static int Save(DisturbTime entity)
        {
            var repository = new DisturbTimeRepository();
            return repository.InsertOne(entity);
        }

        public static IEnumerable<DisturbTime> Get()
        {
            var repository = new DisturbTimeRepository();
            return repository.Get();
        }
    }
}
