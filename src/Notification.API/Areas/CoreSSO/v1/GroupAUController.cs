using Notification.Business.CoreSSO;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Web.Http;
using System.Web.Http.Description;
using System.Linq;
using Notification.API.Areas.v1;
using Notification.Business;

namespace Notification.API.Areas.CoreSSO.v1
{
    
    public class GroupAUController : AuthBaseController
    {
        [HttpGet]
        [Route("api/CoreSSO/v1/GroupAU")]
        [ResponseType(typeof(IEnumerable<GroupAU>))]
        public HttpResponseMessage Get(Guid groupId)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }

            //try
            //{


            //    var result = GroupAUBusiness.Get(claimData.Usu_id, groupId);
            //    return Request.CreateResponse(HttpStatusCode.OK, result);
            //}
            //catch (Exception err)
            //{
            //    return Request.CreateResponse(HttpStatusCode.InternalServerError);
            //}
        }
    }
}
