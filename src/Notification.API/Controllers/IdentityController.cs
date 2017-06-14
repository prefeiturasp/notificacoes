
using System.Linq;
using System.Security.Claims;
using System.Web.Http;

namespace Notification.API.Controllers
{
    [Authorize]
    public class IdentityController : ApiController
    {
        [HttpGet]
        [Route("api/Teste/v1/identity")]
        public dynamic Get()
        {
            var principal = User as ClaimsPrincipal;

            return from c in principal.Identities.First().Claims
                   select new
                   {
                       c.Type,
                       c.Value
                   };
        }
    }
}