using Notification.Business.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.CoreSSO.v1
{
    public class SystemController : ApiController
    {
        [HttpGet]
        [Route("api/CoreSSO/v1/System")]
        [ResponseType(typeof(IEnumerable<Notification.Entity.API.CoreSSO.System>))]
        public HttpResponseMessage Get()
        {
            try
            {
                var result = SystemBusiness.Get(new Guid());
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }            
        }
    }
}
