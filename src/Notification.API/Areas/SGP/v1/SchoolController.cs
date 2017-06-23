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
using Notification.Business.CoreSSO;

namespace Notification.API.Areas.SGP.v1
{
    public class SchoolController : AuthUserGroupBaseController
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

        /// <summary>
        /// Busca todas as escolas pela DRE cujo usuário logado tenha permissão.
        /// Necessário enviar o id do grupo no Header (groupSid)
        /// </summary>
        /// <param name="schoolSuperiorId"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/SGP/v1/School")]
        [ResponseType(typeof(IEnumerable<School>))]
        public HttpResponseMessage GetBySuperior(Guid schoolSuperiorId)
        {
            try
            {
                if (Request.Headers.Contains(GroupBusiness.TYPE_GRU_ID))
                {

                    var result = SchoolBusiness.Get(claimData.UserId, claimData.GroupId, schoolSuperiorId);
                    return Request.CreateResponse(HttpStatusCode.OK, result);
                }
                else
                {
                    MissingFieldException exc = new MissingFieldException("Header: " + GroupBusiness.TYPE_GRU_ID + " não encontrado.");
                    var logId = LogBusiness.Error(exc);
                    return Request.CreateResponse(HttpStatusCode.PreconditionFailed, logId);
                }
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }
    }
}
