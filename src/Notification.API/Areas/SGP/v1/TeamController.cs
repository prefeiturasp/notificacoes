﻿using Notification.API.Areas.v1;
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
using System.Web.Http.Description;
using System.Web.Http.ModelBinding;

namespace Notification.API.Areas.SGP.v1
{
    public class TeamController : AuthUserGroupBaseController
    {
        [HttpGet]
        [Route("api/SGP/v1/Team")]
        [ResponseType(typeof(IEnumerable<Team>))]
        public HttpResponseMessage Get(
            string calendarYear,
            [ModelBinder(typeof(Guids))] IEnumerable<Guid> schoolSuperiorId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> schoolClassificationId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> schoolId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> courseId = null,
            [ModelBinder(typeof(Strings))] IEnumerable<string> coursePeriodId = null,
            [ModelBinder(typeof(Ints))] IEnumerable<int> disciplineId = null)
        {
            try
            {
                var result = TeamBusiness.Get(claimData.UserId, claimData.GroupId, calendarYear, schoolSuperiorId, schoolClassificationId, schoolId, courseId, coursePeriodId, disciplineId);
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
