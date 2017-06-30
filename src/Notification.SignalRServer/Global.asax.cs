using Notification.Business;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace Notification.SignalRServer
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            LoadLogConfiguration();
        }

        private void LoadLogConfiguration()
        {
            try
            {
                bool value;
                var config = ConfigurationManager.AppSettings[LogBusiness.ConfigIsEnabledInfo];

                if (config != null && bool.TryParse(config, out value))
                    LogBusiness.IsEnabledInfo = value;

                config = ConfigurationManager.AppSettings[LogBusiness.ConfigIsEnabledWarn];

                if (config != null && bool.TryParse(config, out value))
                    LogBusiness.IsEnabledWarn = value;

                config = ConfigurationManager.AppSettings[LogBusiness.ConfigIsEnabledError];

                if (config != null && bool.TryParse(config, out value))
                    LogBusiness.IsEnabledError = value;
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
            }
        }    
    }
}
