using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Owin;
using Owin;
using System.IdentityModel.Tokens;
using IdentityServer3.AccessTokenValidation;

[assembly: OwinStartup(typeof(NotifTeste.API.Startup))]

namespace NotifTeste.API
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            JwtSecurityTokenHandler.InboundClaimTypeMap.Clear();

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {
                //endereço identity server
                Authority = "http://localhost:5000",
                RequiredScopes = new[] { "api1" },
            });

            app.UseWebApi(WebApiConfig.Register());
        }
    }
}
