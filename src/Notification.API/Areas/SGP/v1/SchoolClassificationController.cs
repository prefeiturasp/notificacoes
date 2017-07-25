using Notification.API.Areas.v1;
using Notification.API.ModelBinder;
using Notification.API.Models;
using Notification.Business;
using Notification.Business.SGP;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Http.Description;
using System.Web.Http.ModelBinding;

namespace Notification.API.Areas.SGP.v1
{
    public class SchoolClassificationController : AuthUserGroupBaseController
    {
        /// <summary>
        /// Retorna todas as classificações de escolas baseadas no usuário, grupo e diretoria
        /// </summary>
        /// <param name="schoolSuperiorId">Opcional. Repita este parâmetro para cada nova diretoria que gostaria de adicionar no filtro.</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/SGP/v1/SchoolClassification")]
        [ResponseType(typeof(IEnumerable<SchoolClassification>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage Get([ModelBinder(typeof(Guids))] IEnumerable<Guid> schoolSuperiorId = null)
        {
            try
            {
                var result = SchoolClassificationBusiness.Get(claimData.UserId, claimData.GroupId, schoolSuperiorId);
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
