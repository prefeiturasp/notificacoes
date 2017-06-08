using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.SGP.v1
{
    public class TeamController : ApiController
    {
        [HttpGet]
        [Route("api/SGP/v1/Team")]
        [ResponseType(typeof(IEnumerable<Team>))]
        public HttpResponseMessage Get(
            int calendarId, 
            Nullable<Guid> schoolSuperiorId = null, 
            Nullable<int> schoolClassificationId = null, 
            Nullable<Guid> schoolId = null, 
            Nullable<int> courseId = null,
            Nullable<int> coursePeriodId = null,
            Nullable<int> disciplineId = null)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }
    }
}
