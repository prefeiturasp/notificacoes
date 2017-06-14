using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace Notification.API.App_Start
{
    public class ClaimsDataAttribute : FilterAttribute, IActionFilter
    {
        private const string TYPE_USU_ID = "sub";
        private const string TYPE_ENT_ID = "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid";
        private const string AUTHORIZATION = "Authorization";

        private Guid usu_id;
        private Guid ent_id;

        public Guid Usu_id
        {
            get
            {
                return usu_id;
            }
        }

        public Guid Ent_id
        {
            get
            {
                return ent_id;
            }
        }

        public async Task<HttpResponseMessage> ExecuteActionFilterAsync(HttpActionContext actionContext, CancellationToken cancellationToken, Func<Task<HttpResponseMessage>> continuation)
        {
            //ActionExecuting
            InternalActionExecuting(actionContext, cancellationToken);

            if (actionContext.Response != null)
            {
                return actionContext.Response;
            }

            HttpActionExecutedContext executedContext;

            try
            {
                var response = await continuation();
                executedContext = new HttpActionExecutedContext(actionContext, null)
                {
                    Response = response
                };
            }
            catch (Exception exception)
            {
                executedContext = new HttpActionExecutedContext(actionContext, exception);
            }

            //ActionExecuted
            //await InternalActionExecuted(executedContext, cancellationToken);
            return executedContext.Response;
        }

        private void InternalActionExecuting(HttpActionContext actionContext, CancellationToken cancellationToken)
        {
            if (actionContext.Request.Headers.Contains(AUTHORIZATION))
            {
                //ClaimsPrincipal User = null; //testar
                var principal = actionContext.RequestContext.Principal as ClaimsPrincipal;


                var getUsuId = from c in principal.Identities.First().Claims
                            where c.Type == TYPE_USU_ID
                            select c.Value;//.FirstOrDefault();

                usu_id = new Guid(getUsuId.FirstOrDefault());

                var getEntId = from c in principal.Identities.First().Claims
                               where c.Type == TYPE_ENT_ID
                               select c.Value;//.FirstOrDefault();

                ent_id = new Guid(getEntId.FirstOrDefault());

            }
            else
            {
                HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.PreconditionFailed);
                response.RequestMessage = actionContext.Request;
                response.ReasonPhrase = "Header "+AUTHORIZATION+" não encontrada.";
                actionContext.Response = response;
            }

        }
    }
}