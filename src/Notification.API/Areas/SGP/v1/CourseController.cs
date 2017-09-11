using Notification.API.Areas.v1;
using Notification.API.Models;
using Notification.Business;
using Notification.Business.SGP;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Http.Description;

namespace Notification.API.Areas.SGP.v1
{
    public class CourseController : AuthBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/Course")]
        [ResponseType(typeof(IEnumerable<Course>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage Get(string calendarYear)
        {
            try
            {
                var result = CourseBusiness.Get(calendarYear);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }
        }
    }
}
