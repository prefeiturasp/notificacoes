using Notification.Business;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.v1
{
    public class NotificationController : AuthUserGroupBaseController
    {
        [HttpPost]
        [Route("api/v1/Notification")]
        [ResponseType(typeof(Notification.Entity.API.Notification))]
        public HttpResponseMessage Get(Notification.Entity.API.Notification entity)
        {
            try
            {
                NotificationBusiness.Save(claimData.UserId, claimData.GroupId, entity);
                return Request.CreateResponse(HttpStatusCode.Created);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }
    }
}
