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
    public class SchoolClassificationController : ApiController
    {
        [HttpGet]
        [Route("api/SGP/v1/SchoolClassification")]
        [ResponseType(typeof(IEnumerable<SchoolClassification>))]
        public HttpResponseMessage Get(Nullable<Guid> schoolSuperiorId = null)
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
