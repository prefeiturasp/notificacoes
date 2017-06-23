using Notification.API.Areas.v1;
using Notification.Business;
using Notification.Business.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.CoreSSO.v1
{
    public class SystemController : AuthBaseController
    {
        /// <summary>
        /// Retorna todos os sistemas cujo usuário logado tenha permissão de acesso.
        /// </summary>
        /// <param name="groupSid">ID Grupo usuário logado no sistema</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/CoreSSO/v1/System")]
        [ResponseType(typeof(IEnumerable<Notification.Entity.API.CoreSSO.System>))]
        public HttpResponseMessage Get(Guid groupSid)
        {
            try
            {
                if (groupSid != Guid.Empty)
                {
                    var result = SystemBusiness.Get(claimData.Usu_id);
                    return Request.CreateResponse(HttpStatusCode.OK, result);
                }
                else
                {
                    MissingFieldException exc = new MissingFieldException("Parâmetro: " + GroupBusiness.TYPE_GRU_ID + " vazio.");
                    LogBusiness.Warn(exc.Message);
                    return Request.CreateResponse(HttpStatusCode.PreconditionFailed, exc.Message);
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
