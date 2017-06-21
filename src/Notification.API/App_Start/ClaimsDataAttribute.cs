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

namespace Notification.API.App_Start
{
    public class ClaimsDataAttribute : FilterAttribute, IActionFilter
    {
        private const string TYPE_USU_ID = "sub";
        private const string TYPE_ENT_ID = "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid";
        public const string TYPE_GRU_ID = "groupSid";
        private const string AUTHORIZATION = "Authorization";

        private Guid usu_id;
        private Guid ent_id;
        private Guid gru_id;

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

        public Guid Gru_id
        {
            get
            {
                return gru_id;
            }
           
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
            if (actionContext.Request.Headers.Contains(AUTHORIZATION))
            {
                //ClaimsPrincipal User = null; //testar
                var principal = actionContext.RequestContext.Principal as ClaimsPrincipal;


                var getUsuId = from c in principal.Identities.First().Claims
                            where c.Type == TYPE_USU_ID
                            select c.Value;//.FirstOrDefault();

                if (getUsuId.Any())
                    usu_id = new Guid(getUsuId.FirstOrDefault());
                
                var getEntId = from c in principal.Identities.First().Claims
                               where c.Type == TYPE_ENT_ID
                               select c.Value;//.FirstOrDefault();

                if (getEntId.Any())
                    ent_id = new Guid(getEntId.FirstOrDefault());

                //Utilizando groupSid do Header. Estudar a persistência de dados no Identity pela API e Javascript.
                if(actionContext.Request.Headers.Contains(TYPE_GRU_ID))
                {
                    gru_id = new Guid(actionContext.Request.Headers.GetValues(TYPE_GRU_ID).First());
                }

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