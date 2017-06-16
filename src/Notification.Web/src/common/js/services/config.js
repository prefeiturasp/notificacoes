/**
 * Created by everton.ferreira on 16/06/2017.
 */
var Config = {
    SITE: "http://10.10.10.37:5019/",
    API: "api/CoreSSO/v1",
    OIDCCLIENT: {
        authority: "http://10.10.10.37:5000",
        client_id: "mstechjs",
        redirect_uri: "http://localhost:5003/callback.html",
        response_type: "id_token token",
        scope:"openid profile api1",
        post_logout_redirect_uri : "http://localhost:5003/index.html"
    }
};