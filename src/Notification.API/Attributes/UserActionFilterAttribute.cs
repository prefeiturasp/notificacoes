using Notification.Business;
using Owin;
using System;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace Notification.API.Attributes
{
    public class UserActionFilterAttribute : FilterAttribute, IActionFilter
    {
        private const string CLAIM_USERID = "sub";
        private const string CLAIM_ENTITYID = "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid";        
        private const string HEADER_AUTHORIZATION = "Authorization";

        private Guid userId;
        private Guid entityId;        

        public Guid UserId
        {
            get { return userId; }
        }

        public Guid EntityId
        {
            get { return entityId; }
        }
                
        public async Task<HttpResponseMessage> ExecuteActionFilterAsync(HttpActionContext actionContext, CancellationToken cancellationToken, Func<Task<HttpResponseMessage>> continuation)
        {
            var watch = new Stopwatch();
            watch.Start();

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

            watch.Stop();
            LogBusiness.Info(string.Format("API-Path:{0} Total: {1}", actionContext.Request.RequestUri.AbsolutePath, watch.Elapsed.ToString()));
            
            return executedContext.Response;
        }

        private void InternalActionExecuting(HttpActionContext actionContext, CancellationToken cancellationToken)
        {
            if (actionContext.Request.Headers.Contains(HEADER_AUTHORIZATION))
            {
                //ClaimsPrincipal User = null; //testar
                var principal = actionContext.RequestContext.Principal as ClaimsPrincipal;


                var getUsuId = from c in principal.Identities.First().Claims
                            where c.Type == CLAIM_USERID
                            select c.Value;//.FirstOrDefault();

                if (getUsuId.Any())
                    userId = new Guid(getUsuId.FirstOrDefault());
                else
                    userId = Guid.Empty;
                
                var getEntId = from c in principal.Identities.First().Claims
                               where c.Type == CLAIM_ENTITYID
                               select c.Value;//.FirstOrDefault();

                if (getEntId.Any())
                    entityId = new Guid(getEntId.FirstOrDefault());
                else
                    entityId = Guid.Empty;
            }
            else
            {
                HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.PreconditionFailed);
                response.RequestMessage = actionContext.Request;
                response.ReasonPhrase = "Header " + HEADER_AUTHORIZATION + " não encontrada.";
                actionContext.Response = response;
            }
        }       
    }
}