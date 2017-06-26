using Notification.API.Areas.v1;
using Notification.API.ModelBinder;
using Notification.Business;
using Notification.Business.SGP;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Description;
using System.Web.Http.ModelBinding;

namespace Notification.API.Areas.SGP.v1
{
    public class UserController : AuthUserGroupBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/Teacher")]
        [ResponseType(typeof(IEnumerable<Teacher>))]
        public HttpResponseMessage GetTeacher(
            [ModelBinder(typeof(Strings))] IEnumerable<string> calendarYear = null ,
            [ModelBinder(typeof(Guids))] IEnumerable<Guid> schoolSuperiorId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> schoolClassificationId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> schoolId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> positionId = null)
        {
            try
            {
                var result = TeacherBusiness.Get(claimData.UserId, claimData.GroupId, calendarYear, schoolSuperiorId, schoolClassificationId, schoolId, positionId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        [HttpGet]
        [Route("api/SGP/v1/Contributor")]
        [ResponseType(typeof(IEnumerable<Contributor>))]
        public HttpResponseMessage GetContributor(
            [ModelBinder(typeof(Strings))] IEnumerable<string> calendarYear = null,
            [ModelBinder(typeof(Guids))] IEnumerable<Guid> schoolSuperiorId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> schoolClassificationId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> schoolId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> positionId = null)
        {
            try
            {
                var result = ContributorBusiness.Get(claimData.UserId, claimData.GroupId, calendarYear, schoolSuperiorId, schoolClassificationId, schoolId, positionId);
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