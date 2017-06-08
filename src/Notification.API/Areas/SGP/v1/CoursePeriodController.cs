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
    public class CoursePeriodController : ApiController
    {
        [HttpGet]
        [Route("api/SGP/v1/CoursePeriod")]
        [ResponseType(typeof(IEnumerable<CoursePeriod>))]
        public HttpResponseMessage Get(int calendarId, Nullable<int> periodId = null)
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
