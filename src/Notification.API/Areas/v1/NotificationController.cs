using Notification.API.Attributes;
using Notification.API.Models;
using Notification.Business;
using Notification.Business.Exceptions;
using Notification.Entity.API;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.v1
{
    [Authorize]    
    public class NotificationController : BaseController
    {
        [HttpPost]
        [Route("api/v1/Notification")]        
        [ResponseType(typeof(Notification.Entity.API.Notification))]
        [UserGroupActionFilter]
        public HttpResponseMessage Save(Notification.Entity.API.Notification entity)
        {
            try
            {
                var notificationId = NotificationBusiness.Save(filterActionUserGroup.UserId, filterActionUserGroup.GroupId, entity);
                return Request.CreateResponse(HttpStatusCode.Created, notificationId);
            }
            catch (NotificationRecipientIsEmptyException exc)
            {
                return Request.CreateResponse(HttpStatusCode.PreconditionFailed, new ErrorModel(1, exc.Message));
            }
            catch (NotificationWithoutRecipientException exc)
            {
                return Request.CreateResponse(HttpStatusCode.PreconditionFailed, new ErrorModel(2, exc.Message));
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }
        }

        [HttpGet]
        [Route("api/v1/Notification/{id:guid}")]
        [ResponseType(typeof(Notification.Entity.API.NotificationPlugin))]
        [UserActionFilter]
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
        [PaginateActionFilter]
        [Route("api/v1/Notification/")]
        [ResponseType(typeof(IEnumerable<NotificationPlugin>))]
        [UserActionFilter]
        public HttpResponseMessage GetByUserId(Guid userId, bool read)
        {
            try
            {
                var result = 
                    read ?
                    NotificationBusiness.GetReadByUserId(userId, filterActionPaginate.Page, filterActionPaginate.Size) :
                    NotificationBusiness.GetNotReadByUserId(userId, filterActionPaginate.Page, filterActionPaginate.Size);

                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        [HttpPost]
        [PaginateActionFilter]
        [Route("api/v1/Notification/{id:guid}/Action")]
        [ResponseType(typeof(bool))]
        [UserActionFilter]
        public HttpResponseMessage SaveAction(NotificationAction entity)
        {
            try
            {
                NotificationBusiness.Action(filterActionUser.UserId, entity);                
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }
    }
}
