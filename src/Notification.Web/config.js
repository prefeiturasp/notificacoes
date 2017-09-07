var Config = null;
var x2js = new X2JS();
function loadXMLDoc() {

    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", "config.xml", false);
    xhttp.send();
    var xmlDoc = xhttp.responseXML;
    Config = x2js.xml2json(xmlDoc).config;
}

loadXMLDoc();