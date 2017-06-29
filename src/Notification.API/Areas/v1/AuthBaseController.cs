using Notification.API.Attributes;
using System.Linq;
using System.Web.Http;

namespace Notification.API.Areas.v1
{
    [Authorize]
    [UserActionFilter]
    public class AuthBaseController : ApiController
    {
        public UserActionFilterAttribute claimData
        {
            get
            {
                return (UserActionFilterAttribute)ControllerContext.ControllerDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(UserActionFilterAttribute)).Single();
            }
        }

        public PaginateActionFilterAttribute paginate
        {
            get
            {
                return (PaginateActionFilterAttribute)ControllerContext.ControllerDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(PaginateActionFilterAttribute)).Single();
            }
        }
    }
}