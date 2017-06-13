using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Owin;
using Owin;
using System.IdentityModel.Tokens;
using IdentityServer3.AccessTokenValidation;
using System.Configuration;

[assembly: OwinStartup(typeof(Notification.API.Startup))]

namespace Notification.API
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            string urlIdentityServer = ConfigurationManager.AppSettings["IdentityServer"];

            JwtSecurityTokenHandler.InboundClaimTypeMap.Clear();

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {

                //endereço identity server
                Authority = urlIdentityServer,
                RequiredScopes = new[] { "api1" },
            });

            app.UseWebApi(WebApiConfig.Register());
        }
    }
}
