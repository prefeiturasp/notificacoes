using Notification.API.Areas.v1;
using Notification.API.ModelBinder;
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
using System.Web.Http.Description;
using System.Web.Http.ModelBinding;

namespace Notification.API.Areas.SGP.v1
{
    public class CoursePeriodController : AuthBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/CoursePeriod")]
        [ResponseType(typeof(IEnumerable<CoursePeriod>))]
        public HttpResponseMessage Get(string calendarYear, [ModelBinder(typeof(Ints))] IEnumerable<int> courseId = null)
        {
            try
            {
                var result = CoursePeriodBusiness.Get(calendarYear, courseId);
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
