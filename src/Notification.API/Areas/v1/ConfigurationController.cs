using Notification.API.Models;
using Notification.Business;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.v1
{
    public class ConfigurationController : AuthBaseController
    {
        /// <summary>
        /// Retorna data no formato timestamp unixTime (quantos segundos houveram de 1/1/1970 até o dia de hoje)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/v1/Timestamp/")]
        public HttpResponseMessage GetTimeStamp()
        {
            try
            {
                
                var result = (DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

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