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
    public class SchoolClassificationController : AuthUserGroupBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/SchoolClassification")]
        [ResponseType(typeof(IEnumerable<SchoolClassification>))]
        public HttpResponseMessage Get(Guid schoolSuperiorId)
        {
            try
            {
                var result = SchoolClassificationBusiness.Get(claimData.UserId, claimData.GroupId, schoolSuperiorId);
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
