using Notification.Business;
using Notification.Entity.API;
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
        public HttpResponseMessage Save(Notification.Entity.API.Notification entity)
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

        [HttpGet]
        [Route("api/v1/Notification/{id:guid}")]
        [ResponseType(typeof(Notification.Entity.API.NotificationPlugin))]
        public HttpResponseMessage GetById(Guid id)
        {
            try
            {
                var result = NotificationBusiness.GetById(id);

                if (result == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                else
                    return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        [HttpGet]
        [Route("api/v1/Notification/")]
        [ResponseType(typeof(IEnumerable<NotificationPlugin>))]
        public HttpResponseMessage GetByUserId(Guid Userid)
        {
            try
            {
                var result = NotificationBusiness.GetByUserId(Userid);

                if (result == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                else
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
