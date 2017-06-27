using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using Microsoft.Owin.Security.OAuth;
using Newtonsoft.Json.Serialization;
using System.Web.Http.Cors;
using System.Configuration;

namespace Notification.API
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services
            // Configure Web API to use only bearer token authentication.
            config.SuppressDefaultHostAuthentication();
            config.Filters.Add(new HostAuthenticationFilter(OAuthDefaults.AuthenticationType));

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }

        public static HttpConfiguration Register()
        {
            // Web API configuration and services
            var config = new HttpConfiguration();
            config.Formatters.Remove(config.Formatters.XmlFormatter);

            // Web API routes
            config.MapHttpAttributeRoutes();

            //require authentication for all controllers
            //config.Filters.Add(new AuthorizeAttribute());

            string urlIdentityServer = ConfigurationManager.AppSettings["IdentityServer"];
            string urlNotificationSite = ConfigurationManager.AppSettings["NotificationSite"];

            //config.EnableCors(new EnableCorsAttribute("http://localhost:5000, http://localhost:5003, http://localhost:5010, http://localhost:5020", "accept, authorization", "GET", "WWW-Authenticate"));
            config.EnableCors(new EnableCorsAttribute(urlIdentityServer + ", " + urlNotificationSite, "accept, authorization, groupSid, Content-Type", "GET, POST", "WWW-Authenticate"));

            //config.Routes.MapHttpRoute(
            //    name: "DefaultApi",
            //    routeTemplate: "{controller}/{id}", //"api/{controller}/{id}"
            //    defaults: new { id = RouteParameter.Optional }
            //);

            return config;
        }
    }
}
