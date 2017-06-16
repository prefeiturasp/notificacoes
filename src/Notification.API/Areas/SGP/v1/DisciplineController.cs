using Notification.API.Areas.v1;
using Notification.Business;
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
    public class DisciplineController : AuthBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/Discipline")]
        [ResponseType(typeof(IEnumerable<Discipline>))]
        public HttpResponseMessage Get(int calendarId, Nullable<int> courseId = null, Nullable<int> coursePeriodId = null)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }
    }
}
