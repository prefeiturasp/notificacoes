using Notification.Business.CoreSSO;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace NotifTeste.API.Areas.CoreSSO.v1
{
    [Authorize]
    public class GroupAUController : ApiController
    {
        [HttpGet]
        [Route("api/CoreSSO/v1/GroupAU")]
        [ResponseType(typeof(IEnumerable<GroupAU>))]
        public HttpResponseMessage Get(Guid groupId)
        {
            try
            {
                var result = GroupAUBusiness.Get(new Guid(), groupId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }
    }
}
