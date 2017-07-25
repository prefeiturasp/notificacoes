/**
 * Created by everton.ferreira on 16/06/2017.
 */
var Config = {
    URL_SIGGNALR: 'http://notificacaoService.mstech.com.br/signalr',
    IDENTITY: 'http://coressoids.mstech.com.br/identity',
    API: "http://localhost:6454",
    APICoreSSO: "/api/CoreSSO/v1",
    APISGP: "/api/SGP/v1",
    APINotification: '/api/v1/Notification',
    APISGP: "/api/SGP/v1",
    OIDCCLIENT: {
        authority: "http://identity.mstech.com.br",
        client_id: "mstechjs",
        redirect_uri: "http://localhost:5003/callback.html",
        response_type: "id_token token",
        scope: "openid profile mstechapi",
        post_logout_redirect_uri: "http://localhost:5003/index.html"
    }
};