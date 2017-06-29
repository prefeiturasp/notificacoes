/**
 * Created by everton.ferreira on 16/06/2017.
 */
var Config = {
	URL_SIGGNALR: 'http://10.10.10.37:5020/signalr',
	IDENTITY: 'http://10.10.10.37:5001/identity',
    API: "http://10.10.10.37:5019",
    APICoreSSO: "/api/CoreSSO/v1",
    APISGP: "/api/SGP/v1",
	APINotification: 'api/v1/Notification',
    APISGP: "/api/SGP/v1",
    OIDCCLIENT: {
        authority: "http://10.10.10.37:5000",
        client_id: "mstechjs",
        redirect_uri: "http://10.10.10.37:5021/callback.html",
        response_type: "id_token token",
        scope:"openid profile api1",
        post_logout_redirect_uri : "http://10.10.10.37:5021/index.html"
    }
};