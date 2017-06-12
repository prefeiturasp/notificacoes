using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace NotifTeste.API.Areas.SGP.v1
{
    public class PositionController : ApiController
    {
        [HttpGet]
        [Route("api/SGP/v1/Position")]
        [ResponseType(typeof(IEnumerable<Position>))]
        public HttpResponseMessage Get()
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
