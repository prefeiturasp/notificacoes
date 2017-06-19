using Notification.API.Areas.v1;
using Notification.Business;
using Notification.Business.CoreSSO;
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
    public class GroupController : AuthBaseController
    {
        [HttpGet]
        [Route("api/CoreSSO/v1/GroupDown")]
        [ResponseType(typeof(IEnumerable<Group>))]
        public HttpResponseMessage Get(int systemId)
        {
            try
            {
                var result = GroupBusiness.GetGroupDown(claimData.Usu_id, systemId);
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
