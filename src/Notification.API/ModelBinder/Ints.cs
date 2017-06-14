using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.ModelBinding;

namespace Notification.API.ModelBinder
{
    public class Ints : IModelBinder
    {
        public bool BindModel(HttpActionContext actionContext, ModelBindingContext bindingContext)
        {
            if (bindingContext.ModelType != typeof(IEnumerable<int>))
            {
                return false;
            }

            var intValues = actionContext.Request.GetQueryNameValuePairs()
            .Where(kvp => kvp.Key == bindingContext.ModelName)
            .Select(kvp => int.Parse(kvp.Value))
            .ToList();
            bindingContext.Model = new List<int>(intValues);

            return true;
        }
    }
}