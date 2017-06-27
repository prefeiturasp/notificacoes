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
    public class DelayTimeController : AuthBaseController
    {
        [HttpGet]
        [Route("api/v1/DelayTime")]
        [ResponseType(typeof(IEnumerable<DelayTime>))]
        public HttpResponseMessage Get()
        {
            try
            {
                var result = DelayTimeBusiness.Get();
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        [HttpPost]
        [Route("api/v1/DelayTime")]
        [ResponseType(typeof(IEnumerable<DelayTime>))]
        public HttpResponseMessage Save()
        {
            try
            {
                var result = DelayTimeBusiness.Get();

                if (result == null || !result.Any())
                {
                    var entity = new DelayTime() { Id = 1, Name = "15 minutos", TimeMinutes = 15 };
                    DelayTimeBusiness.Save(entity);
                    entity = new DelayTime() { Id = 2, Name = "30 minutos", TimeMinutes = 30 };
                    DelayTimeBusiness.Save(entity);
                    entity = new DelayTime() { Id = 3, Name = "1 hora", TimeMinutes = 60 };
                    DelayTimeBusiness.Save(entity);
                    entity = new DelayTime() { Id = 4, Name = "4 horas", TimeMinutes = 240 };
                    DelayTimeBusiness.Save(entity);
                    entity = new DelayTime() { Id = 5, Name = "1 dia", TimeMinutes = 1440 };
                    DelayTimeBusiness.Save(entity);

                    result = DelayTimeBusiness.Get();
                }

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
