using Notification.Business;
using Notification.Entity.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;

namespace Notification.API.Areas.v1
{
    public class LogController : ApiController
    {
        [HttpGet]
        [Route("api/v1/Log")]
        [ResponseType(typeof(IEnumerable<Log>))]
        public HttpResponseMessage Get()
        {
            try
            {
                var result = LogBusiness.Get(0, 10);                
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        [HttpGet]
        [Route("api/v1/Log/{id}")]
        [ResponseType(typeof(IEnumerable<Log>))]
        public HttpResponseMessage GetById(string id)
        {
            try
            {
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
