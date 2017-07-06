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
using System.Threading.Tasks;
using System.Security.Claims;
using Thinktecture.IdentityModel.Owin;

[assembly: OwinStartup(typeof(Notification.API.Startup))]

namespace Notification.API
{
    public partial class Startup
    {
        private static string urlIdentityServer;
        private static string scopesIdentityServer;
        private static Tuple<string, string> credentialBasicAuth;

        public void Configuration(IAppBuilder app)
        {
            LoadIdenityServerConfiguration();
            LoadCredentialBasicAuthConfiguration();

            app.UseBasicAuthentication(new BasicAuthenticationOptions("SecureAPI",
                async (username, password) =>
                await Authenticate(username, password)));

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

        private void LoadCredentialBasicAuthConfiguration()
        {
            try
            {
                var user  = ConfigurationManager.AppSettings["UserCredentialBasicAuth"];
                var password = ConfigurationManager.AppSettings["PasswordCredentialBasicAuth"];

                if (string.IsNullOrEmpty(user) ||
                    string.IsNullOrEmpty(password))
                {
                    LogBusiness.Warn("Configuração de Authenticação não encontrada.");
                }
                else
                    credentialBasicAuth = new Tuple<string, string>(user, password);
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
            }
        }

        public async Task<IEnumerable<Claim>> Authenticate(string username, string password)
        {
            if ((credentialBasicAuth.Item1== username) &&
                (credentialBasicAuth.Item2 == password))
            {
                var claims = new List<Claim> { new Claim("name", username) };
                claims.Add(new Claim("scope", "mstechapi"));

                return (IEnumerable<Claim>)claims;
            }

            return null;
        }
    }
}
