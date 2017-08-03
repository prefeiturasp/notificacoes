/**
 * Created by everton.ferreira on 16/06/2017.
 */
/*var Config = {
    URL_SIGGNALR: 'http://notificacaoService.mstech.com.br/signalr',
    IDENTITY: 'http://coressoids.mstech.com.br/identity',
    API: "http://notificacaoApi.mstech.com.br",
    APICoreSSO: "/api/CoreSSO/v1",
    APISGP: "/api/SGP/v1",
    APINotification: '/api/v1/Notification',
    APISGP: "/api/SGP/v1",
    OIDCCLIENT: {
        authority: "http://identity.mstech.com.br",
        client_id: "mstechjs",
        redirect_uri: "http://notificacao.mstech.com.br/callback.html",
        response_type: "id_token token",
        scope: "openid profile mstechapi",
        post_logout_redirect_uri: "http://notificacao.mstech.com.br/index.html"
    }
};*/
var Config = null;
var x2js = new X2JS();

function loadXMLDoc() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(this);
    }
  };
  xmlhttp.open("GET", "config.xml", true);
  xmlhttp.send();
}
function callback(xml) {  
  Config = $.parseJSON(JSON.stringify(x2js.xml_str2json(xml.responseText))).CONFIG;  
}

loadXMLDoc();