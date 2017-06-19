using Notification.API.Areas.v1;
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
    public class SchoolSuperiorController : AuthBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/SchoolSuperior")]
        [ResponseType(typeof(IEnumerable<SchoolSuperior>))]
        public HttpResponseMessage Get(Guid groupId)
        {
            try
            {
                var result = SchoolSuperiorBusiness.Get(claimData.Usu_id, groupId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }
    }
}
