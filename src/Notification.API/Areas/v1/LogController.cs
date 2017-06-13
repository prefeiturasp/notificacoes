using Notification.Entity.Database;
using Notification.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.v1
{
    public class LogController : ApiController
    {
        [HttpGet]
        [Route("api/v1/Log")]
        [ResponseType(typeof(IEnumerable<Log>))]
        public HttpResponseMessage Get()
        {
            try
            {
                var rep = new LogRepository();

                rep.Insert();
                rep.Insert();

                var result = rep.Get();
                
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exp)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }
    }
}
