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
    public class PositionController : AuthBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/Position")]
        [ResponseType(typeof(IEnumerable<Position>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage Get()
        {
            try
            {
                var lt = PositionBusiness.Get();
                return Request.CreateResponse(HttpStatusCode.OK, lt);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }
        }
    }
}
