/**
 * Created by everton.ferreira on 16/06/2017.
 */
var Config = null;
var x2js = new X2JS();
function loadXMLDoc() {
    if (!window.sessionStorage.config) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                callback(this);
            }
        };
        xmlhttp.open("GET", "config.xml", true);
        xmlhttp.send();
    } else {
        Config = $.parseJSON(atob(window.sessionStorage.config));
    }
}
function callback(xml) {
    Config = $.parseJSON(JSON.stringify(x2js.xml_str2json(xml.responseText))).CONFIG;
    window.sessionStorage.config = btoa(JSON.stringify(Config));
}

loadXMLDoc();