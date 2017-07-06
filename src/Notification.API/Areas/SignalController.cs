using Notification.Business;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Notification.API.Areas
{
    public class SignalController : ApiController
    {
        [HttpGet]
        [Route("api/v1/Signal/{id:guid}")]        
        public HttpResponseMessage GetById(Guid id)
        {
            try
            {
                var ltNotif = NotificationBusiness.GetNotReadByUserId(id, 0, 100);
                var users = new List<Guid>();
                users.Add(id);

                foreach (var item in ltNotif)
                {
                    Business.Signal.SignalRClientBusiness.SendNotificationHangFire(users, item.Id);
                }

                var result = LogBusiness.GetById(id);
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
