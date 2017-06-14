

using Notification.API.App_Start;
using System.Linq;
using System.Web.Http;

namespace Notification.API.Areas.v1
{
    [Authorize]
    [ClaimsData]
    public class AuthBaseController : ApiController
    {
        public ClaimsDataAttribute claimData
        {
            get
            {
                return (ClaimsDataAttribute)ControllerContext.ControllerDescriptor.GetFilters()
                    .Where(f => f.GetType() == typeof(ClaimsDataAttribute)).Single();
            }
        }
    }
}