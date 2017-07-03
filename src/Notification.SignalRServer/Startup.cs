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
//using Microsoft.Owin.Cors;

[assembly: OwinStartup(typeof(Notification.SignalRServer.Startup))]

namespace Notification.SignalRServer
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.UseSignalTokenAuthentication();

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {
                //endereço identity server 
                Authority = "http://10.10.10.37:5000",
                RequiredScopes = new[] { "api1" }
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

        private async Task<IEnumerable<Claim>> Authenticate(string username, string password)
        {
            // authenticate user
            if (username == password)
            {
                var claims = new List<Claim> { new Claim("name", username) };
                return (IEnumerable<Claim>)claims;
            }

            return null;
        }
    }
}
