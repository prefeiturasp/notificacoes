using Notification.API.Models;
using Notification.Business;
using Notification.Entity.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Http.Description;

namespace Notification.API.Areas.v1
{
    public class DisturbTimeController : AuthBaseController
    {
        [HttpGet]
        [Route("api/v1/DisturbTime")]
        [ResponseType(typeof(IEnumerable<DisturbTime>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage Get()
        {
            try
            {
                var result = DisturbTimeBusiness.Get();
                if (result == null || !result.Any())
                {
                    Save();
                    result = DisturbTimeBusiness.Get();
                }
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }
        }

        [HttpPost]
        [Route("api/v1/DisturbTime")]
        [ResponseType(typeof(IEnumerable<DisturbTime>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage Save()
        {
            try
            {
                var result = DisturbTimeBusiness.Get();

                if (result == null || !result.Any())
                {
                    var entity = new DisturbTime() { Id = 1, Name = "30 minutos", TimeMinutes = 30 };
                    DisturbTimeBusiness.Save(entity);
                    entity = new DisturbTime() { Id = 2, Name = "1 hora", TimeMinutes = 60 };
                    DisturbTimeBusiness.Save(entity);
                    entity = new DisturbTime() { Id = 3, Name = "2 hora", TimeMinutes = 120 };
                    DisturbTimeBusiness.Save(entity);
                    entity = new DisturbTime() { Id = 4, Name = "6 horas", TimeMinutes = 360 };
                    DisturbTimeBusiness.Save(entity);
                    entity = new DisturbTime() { Id = 5, Name = "1 dia", TimeMinutes = 1440 };
                    DisturbTimeBusiness.Save(entity);

                    result = DisturbTimeBusiness.Get();
                }

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
