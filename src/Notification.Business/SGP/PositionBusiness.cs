using Notification.Entity.API.SGP;
using Notification.Repository.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.SGP
{
    public class PositionBusiness
    {
        public static IEnumerable<Position> Get(bool teacherPosition)
        {
            var repository = new PositionRepository();
            return repository.Get(teacherPosition);
        }
    }
}
