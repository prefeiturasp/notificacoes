using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class CalendarBusiness
    {
        public static IEnumerable<Calendar> Get()
        {
            var repository = new CalendarRepository();
            return repository.Get();
        }
    }
}
