using Notification.API.Areas.v1;
using Notification.API.Models;
using Notification.Business;
using Notification.Business.CoreSSO;
using System;
using System.Collections.Generic;
using System.Configuration;
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
        /// <returns></returns>
        [HttpGet]
        [Route("api/CoreSSO/v1/System")]
        [ResponseType(typeof(IEnumerable<Notification.Entity.API.CoreSSO.System>))]
        public HttpResponseMessage Get()
        {
            try
            {
                string temaCoreSSO = ConfigurationManager.AppSettings["TemaCoreSSO"];

                var result = SystemBusiness.Get(claimData.UserId, temaCoreSSO);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }            
        }
    }
}
