using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.CoreSSO.v1
{
    public class GroupController : ApiController
    {
        [HttpGet]
        [Route("api/CoreSSO/v1/Group")]
        [ResponseType(typeof(IEnumerable<Group>))]
        public HttpResponseMessage Get(int systemId)
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
