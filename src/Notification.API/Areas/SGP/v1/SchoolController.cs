using Notification.API.Areas.v1;
using Notification.API.ModelBinder;
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
using System.Web.Http.ModelBinding;

namespace Notification.API.Areas.SGP.v1
{
    public class SchoolController : AuthBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/School")]
        [ResponseType(typeof(IEnumerable<School>))]
        public HttpResponseMessage Get([ModelBinder(typeof(Guids))] IEnumerable<Guid> listSchools, Nullable<Guid> schoolSuperiorId = null, Nullable<int> schoolClassificationId = null)
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
        }

        [HttpGet]
        [Route("api/SGP/v1/School")]
        [ResponseType(typeof(IEnumerable<School>))]
        public HttpResponseMessage GetBySuperior(Guid groupId, Guid schoolSuperiorId)
        {
            try
            {
                var result = SchoolBusiness.Get(claimData.Usu_id, groupId, schoolSuperiorId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }
    }
}
