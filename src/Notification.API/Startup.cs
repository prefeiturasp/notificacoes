using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Owin;
using Owin;
using System.IdentityModel.Tokens;
using IdentityServer3.AccessTokenValidation;
using System.Configuration;
using Hangfire;
using Hangfire.Mongo;
using MongoDB.Driver;
using Notification.Business;

[assembly: OwinStartup(typeof(Notification.API.Startup))]

namespace Notification.API
{
    public partial class Startup
    {
        private static string urlIdentityServer;
        private static string scopesIdentityServer;

        public void Configuration(IAppBuilder app)
        {
            LoadIdenityServerConfiguration();
                        
            JwtSecurityTokenHandler.InboundClaimTypeMap.Clear();

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {
                Authority = urlIdentityServer,
                RequiredScopes = new[] { scopesIdentityServer },
            });

            app.UseWebApi(WebApiConfig.Register());

            var stringConnection = Notification.Repository.Connections.Connection.Get("Notification");            
            var database = new MongoUrlBuilder(stringConnection).DatabaseName;

            GlobalConfiguration.Configuration.UseMongoStorage(stringConnection, database);

            app.UseHangfireDashboard();
            app.UseHangfireServer();
        }

        private void LoadIdenityServerConfiguration()
        {
            try
            {
                urlIdentityServer = ConfigurationManager.AppSettings["urlIdentityServer"];
                scopesIdentityServer = ConfigurationManager.AppSettings["scopesIdentityServer"];

                LogBusiness.Debug(string.Format("Configuração de Identity: Url({0}), Scope({1})", urlIdentityServer, scopesIdentityServer));
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
            }
        }
    }
}
