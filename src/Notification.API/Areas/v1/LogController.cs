using Notification.API.Attributes;
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
    public class LogController : BaseController
    {
        [HttpGet]
        [Route("api/v1/Log")]
        [ResponseType(typeof(IEnumerable<Log>))]
        [PaginateActionFilter]
        public HttpResponseMessage Get()
        {
            try
            {
                var result = LogBusiness.Get(filterActionPaginate.Page, filterActionPaginate.Size);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        [HttpGet]
        [Route("api/v1/Log/{id:guid}")]
        [ResponseType(typeof(IEnumerable<Log>))]
        public HttpResponseMessage GetById(Guid id)
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
