using Notification.API.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Notification.API.Areas.v1
{
    [Authorize]
    [UserGroupActionFilter]
    public class AuthUserGroupBaseController : ApiController
    {
        public UserGroupActionFilterAttribute claimData
        {
            get
            {
                return (UserGroupActionFilterAttribute)ControllerContext.ControllerDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(UserGroupActionFilterAttribute)).Single();
            }
        }

        public PaginateActionFilterAttribute paginate
        {
            get
            {
                return (PaginateActionFilterAttribute)ActionContext.ActionDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(PaginateActionFilterAttribute)).Single();
            }
        }
    }
}
