using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using Owin;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin.Cors;
using Thinktecture.IdentityModel.Owin;
using System.Collections.Generic;
using System.Security.Claims;
using Notification.SignalRServer.Auth;
using IdentityServer3.AccessTokenValidation;
using Microsoft.IdentityModel.Protocols;
using System.Configuration;
using Notification.Business;
using Notification.Business.Signal;
//using Microsoft.Owin.Cors;

[assembly: OwinStartup(typeof(Notification.SignalRServer.Startup))]

namespace Notification.SignalRServer
{
    public class Startup
    {
        private static string urlIdentityServer;
        private static string scopesIdentityServer;
        private static Tuple<string, string> credentialBasicAuth = null;

        public void Configuration(IAppBuilder app)
        {
            LoadUrlIdenityServerConfiguration();
            LoadCredentialBasicAuthConfiguration();

            app.UseBasicAuthentication(new BasicAuthenticationOptions("SecureAPI",
                async (username, password) =>
                await Authenticate(username, password)));

            app.UseSignalTokenAuthentication();

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {
                //endereço identity server 
                Authority = urlIdentityServer,
                AuthenticationType = "Bearer",
                AuthenticationMode = Microsoft.Owin.Security.AuthenticationMode.Active,
                RequiredScopes = new[] { scopesIdentityServer }
            });

            //app.MapSignalR();
            app.Map("/signalr", map =>
            {
                // Setup the CORS middleware to run before SignalR.
                // By default this will allow all origins. You can 
                // configure the set of origins and/or http verbs by
                // providing a cors options with a different policy.
                map.UseCors(CorsOptions.AllowAll);

                // add middleware to translate the query string token  
                // passed by SignalR into an Authorization Bearer header 
                var hubConfiguration = new HubConfiguration
                {
                    // You can enable JSONP by uncommenting line below.
                    // JSONP requests are insecure but some older browsers (and some
                    // versions of IE) require JSONP to work cross domain
                    // EnableJSONP = true
                    
                };
                // Run the SignalR pipeline. We're not using MapSignalR
                // since this branch already runs under the "/signalr"
                // path.
                map.RunSignalR(hubConfiguration);
            });
        }

        private void LoadUrlIdenityServerConfiguration()        
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
                //var user = ConfigurationManager.AppSettings[SignalRClientBusiness.CONFIG_USERCREDENTIALSIGNALRSERVER];
                //var password = ConfigurationManager.AppSettings[SignalRClientBusiness.CONFIG_PASSWORDCREDENTIALSIGNALRSERVER];
                //credentialBasicAuth = new Tuple<string, string>(user, password);
                //LogBusiness.Debug(string.Format("Configuração de Basic Auth: User({0}), Pass({1})", user, password));

                SignalRClientBusiness.UserCredentialSignalRServer = ConfigurationManager.AppSettings[SignalRClientBusiness.CONFIG_USERCREDENTIALSIGNALRSERVER];
                SignalRClientBusiness.PasswordCredentialSignalRServer = ConfigurationManager.AppSettings[SignalRClientBusiness.CONFIG_PASSWORDCREDENTIALSIGNALRSERVER];

                LogBusiness.Debug(string.Format("Configuração de Basic Auth: User({0}), Pass({1})", SignalRClientBusiness.UserCredentialSignalRServer, SignalRClientBusiness.PasswordCredentialSignalRServer));
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
            }
        }

        public async Task<IEnumerable<Claim>> Authenticate(string username, string password)
        {
            LogBusiness.Debug(string.Format("Authentication: User({0}), Pass({1})", username, password));

            if ((SignalRClientBusiness.UserCredentialSignalRServer == username) &&
                (SignalRClientBusiness.PasswordCredentialSignalRServer == password))
            {
                LogBusiness.Debug("Authentication: Válida");
                var claims = new List<Claim> { new Claim("name", username) };
                claims.Add(new Claim("scope", "mstechapi"));

                return (IEnumerable<Claim>)claims;
            }
            else
                LogBusiness.Debug("Authentication: inválida");

            return null;
        }
    }
}
