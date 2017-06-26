using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.ModelBinding;

namespace Notification.API.ModelBinder
{
    public class Strings : IModelBinder
    {
        public bool BindModel(HttpActionContext actionContext, ModelBindingContext bindingContext)
        {
            if (bindingContext.ModelType != typeof(IEnumerable<string>))
            {
                return false;
            }

            var strValues = actionContext.Request.GetQueryNameValuePairs()
            .Where(kvp => kvp.Key == bindingContext.ModelName)
            .Select(kvp => kvp.Value)
            .ToList();
            bindingContext.Model = new List<string>(strValues);

            return true;
        }
    }
}