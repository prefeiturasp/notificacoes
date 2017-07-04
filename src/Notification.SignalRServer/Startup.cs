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
//using Microsoft.Owin.Cors;

[assembly: OwinStartup(typeof(Notification.SignalRServer.Startup))]

namespace Notification.SignalRServer
{
    public class Startup
    {
        private static string urlIdentityServer;
        private static Tuple<string, string> credentialBasicAuth = null;

        public void Configuration(IAppBuilder app)
        {
            LoadUrlIdenityServerConfiguration();
            LoadCredentialBasicAuthConfiguration();

            app.UseSignalTokenAuthentication();

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {
                //endereço identity server 
                Authority = urlIdentityServer,
                RequiredScopes = new[] { "mstechapi" }
            });

            app.UseBasicAuthentication(new BasicAuthenticationOptions("SecureApi",
                async (username, password) => await Authenticate(username, password)));

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
                var config = ConfigurationManager.AppSettings["urlIdentityServer"];
                urlIdentityServer = config;
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
                var user = ConfigurationManager.AppSettings[Business.Signal.SignalRClientBusiness.CONFIG_USERCREDENTIALSIGNALRSERVER];
                var password = ConfigurationManager.AppSettings[Business.Signal.SignalRClientBusiness.CONFIG_PASSWORDCREDENTIALSIGNALRSERVER];

                credentialBasicAuth = new Tuple<string, string>(user, password);
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
            }
        }

        private async Task<IEnumerable<Claim>> Authenticate(string username, string password)
        {
            if ((credentialBasicAuth.Item1 == username) &&
                (credentialBasicAuth.Item2 == password))
            {
                var claims = new List<Claim> { new Claim("name", username) };
                return (IEnumerable<Claim>)claims;
            }

            return null;
        }
    }
}
