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
using Notification.API.Models;

namespace Notification.API.Areas.SGP.v1
{
    public class SchoolController : AuthUserGroupBaseController
    {
        /// <summary>
        /// Busca escolas por diretoria e uma lista de Classificação
        /// </summary>
        /// <param name="schoolSuperiorId">Opcional. Repita este parâmetro para cada Id DRE que queira filtrar</param>
        /// <param name="schoolClassificationId">Opcional. Repita este parâmetro para cada classificação que queira filtrar</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/SGP/v1/SchoolByClassification")]
        [ResponseType(typeof(IEnumerable<School>))]
        public HttpResponseMessage GetByClassification([ModelBinder(typeof(Guids))] IEnumerable<Guid> schoolSuperiorId = null, [ModelBinder(typeof(Ints))] IEnumerable<int> schoolClassificationId = null)
        {
            try
            {
                var result = SchoolBusiness.Get(claimData.UserId, claimData.GroupId, schoolSuperiorId, schoolClassificationId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }
        }

        /// <summary>
        /// Busca todas as escolas pela DRE cujo usuário logado tenha permissão.
        /// Necessário enviar o id do grupo no Header (groupSid)
        /// </summary>
        /// <param name="schoolSuperiorId">ID Diretoria de ensino (DRE)</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/SGP/v1/School")]
        [ResponseType(typeof(IEnumerable<School>))]
        public HttpResponseMessage GetBySuperior(Guid schoolSuperiorId)
        {
            try
            {

                var result = SchoolBusiness.Get(claimData.UserId, claimData.GroupId, schoolSuperiorId);
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
