using System.Security.Claims;
using System.Security.Principal;
using System.Web;
using System.Web.Script.Serialization;

namespace Notification.API.Extensions
{
    /// <summary>
    /// classe extendendo o Identity. Por hora não está sendo utilizada. Avaliar quando houver persistência do identity no BD para API.
    /// </summary>
    public static class UserIdentityExtension
    {
        public static string GetEntityId(this IIdentity identity)
        {
            var claim = ((ClaimsIdentity)identity).FindFirst(ClaimTypes.PrimarySid);
            return (claim != null) ? claim.Value : string.Empty;
        }

        public static string GetUsuLogin(this IIdentity identity)
        {
            var claim = ((ClaimsIdentity)identity).FindFirst(ClaimTypes.Name);
            return (claim != null) ? claim.Value : string.Empty;
        }

        public static string GetGrupoId(this IIdentity identity)
        {
            var claim = ((ClaimsIdentity)identity).FindFirst(ClaimTypes.GroupSid);
            return (claim != null) ? claim.Value : string.Empty;
        }

        public static T GetUserData<T>(this IIdentity identity)
        {
            var claim = ((ClaimsIdentity)identity).FindFirst(ClaimTypes.UserData);
            JavaScriptSerializer js = new JavaScriptSerializer();
            //return js.Deserialize<T>(identity.Ticket.UserData);
            return (claim != null) ? js.Deserialize<T>(claim.Value) : default(T);
        }

        public static void AddGrupoId(this IIdentity identity, System.Web.HttpRequest request, string grupoId)
        {
            var identityUser = (ClaimsIdentity)identity;
            var claimGrupo = new Claim(ClaimTypes.GroupSid, grupoId);
            identityUser.AddClaim(claimGrupo);
            request.GetOwinContext().Authentication.SignIn(identityUser);
        }

        public static void AddUserData<T>(this IIdentity identity, System.Web.HttpRequest request, T userData)
        {
            var identityUser = (ClaimsIdentity)identity;

            JavaScriptSerializer js = new JavaScriptSerializer();
            string userdata = js.Serialize(userData);

            var claimUserData = new Claim(ClaimTypes.UserData, userdata);
            identityUser.AddClaim(claimUserData);
            request.GetOwinContext().Authentication.SignIn(identityUser);
        }

    }
}
