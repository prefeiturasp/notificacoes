using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http.Controllers;
using System.Web.Http.ModelBinding;

namespace Notification.API.ModelBinder
{
    public class Guids : IModelBinder
    {
        public bool BindModel(HttpActionContext actionContext, ModelBindingContext bindingContext)
        {
            if (bindingContext.ModelType != typeof(IEnumerable<Guid>))
            {
                return false;
            }
            var guidValues = actionContext.Request.GetQueryNameValuePairs()
                .Where(kvp => kvp.Key == bindingContext.ModelName)
                .Select(kvp => Guid.Parse(kvp.Value))
                .ToList();
            bindingContext.Model = new List<Guid>(guidValues);
            return true;
        }
    }
}