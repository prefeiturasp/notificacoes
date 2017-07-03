using Notification.API.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Notification.API.Areas.v1
{
    public class BaseController : ApiController
    {
        public UserActionFilterAttribute filterActionUser
        {
            get
            {
                return (UserActionFilterAttribute)ActionContext.ActionDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(UserActionFilterAttribute)).Single();
            }
        }

        public UserGroupActionFilterAttribute filterActionUserGroup
        {
            get
            {
                return (UserGroupActionFilterAttribute)ActionContext.ActionDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(UserGroupActionFilterAttribute)).Single();
            }
        }

        public PaginateActionFilterAttribute filterActionPaginate
        {
            get
            {
                return (PaginateActionFilterAttribute)ActionContext.ActionDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(PaginateActionFilterAttribute)).Single();
            }
        }
    }
}
