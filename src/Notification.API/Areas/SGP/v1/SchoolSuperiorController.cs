using Notification.API.Areas.v1;
using Notification.Business.SGP;
using Notification.Business;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;
using Notification.Business.CoreSSO;

namespace Notification.API.Areas.SGP.v1
{
    public class SchoolSuperiorController : AuthUserGroupBaseController
    {
        /// <summary>
        /// Busca as DRE's do usuário logado no sistema de notificações.
        /// Necessário enviar o id do grupo do usuário logado no Header (groupSid)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/SGP/v1/SchoolSuperior")]
        [ResponseType(typeof(IEnumerable<SchoolSuperior>))]
        public HttpResponseMessage Get()
        {
            try
            {
                if (Request.Headers.Contains(GroupBusiness.TYPE_GRU_ID))
                {

                    var result = SchoolSuperiorBusiness.Get(claimData.UserId, claimData.GroupId);
                    return Request.CreateResponse(HttpStatusCode.OK, result);
                }
                else
                {
                    MissingFieldException exc = new MissingFieldException("Header: " + GroupBusiness.TYPE_GRU_ID + " não encontrado.");
                    var logId = LogBusiness.Error(exc);
                    return Request.CreateResponse(HttpStatusCode.PreconditionFailed, logId);
                }
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }
    }
}
