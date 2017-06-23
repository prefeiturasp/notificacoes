using Notification.API.Areas.v1;
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

namespace Notification.API.Areas.SGP.v1
{
    public class CalendarController : AuthBaseController
    {
        /// <summary>
        /// Retorna todos os anos de calendários letivos do SGP
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/SGP/v1/Calendar")]
        [ResponseType(typeof(IEnumerable<Calendar>))]
        public HttpResponseMessage Get()
        {
            try
            {
                var result = CalendarBusiness.Get();
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }
    }
}
