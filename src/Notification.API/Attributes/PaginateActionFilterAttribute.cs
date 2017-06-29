using Notification.Business;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace Notification.API.Attributes
{
    public class PaginateActionFilterAttribute : FilterAttribute, IActionFilter
    {
        private const string HEADER_PAGE = "page";
        private const string HEADER_PAGESIZE = "size";

        private int page = 0;
        private int size = 10;

        public int Page
        {
            get { return page; }
        }

        public int Size
        {
            get { return size; }
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
            if (actionContext.Request.Headers.Contains(HEADER_PAGE))
            {
                if (!int.TryParse(actionContext.Request.Headers.GetValues(HEADER_PAGE).First(), out page))
                {
                    LogBusiness.Warn(
                        string.Format("Paginação incorreta page({0}) API-Path:{1}",
                            actionContext.Request.Headers.GetValues(HEADER_PAGE).First(), 
                            actionContext.Request.RequestUri.AbsolutePath));
                }                
            }

            if (actionContext.Request.Headers.Contains(HEADER_PAGESIZE))
            {
                if (!int.TryParse(actionContext.Request.Headers.GetValues(HEADER_PAGESIZE).First(), out size))
                {
                    LogBusiness.Warn(
                        string.Format("Paginação incorreta size({0}) API-Path:{1}",
                            actionContext.Request.Headers.GetValues(HEADER_PAGE).First(),
                            actionContext.Request.RequestUri.AbsolutePath));
                }
            }
        }
    }
}