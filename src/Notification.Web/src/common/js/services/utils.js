/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {

    'use strict';

    angular.module('services')
        .factory('$util', $util);

    $util.$inject = ['$window'];
    /**
     * @function Utilidades globais
     * @name Config
     * @namespace Services
     * @memberOf Factory
     */
    function $util($window) {

        var app = {}, mgr = null, user;

        app.createMgr = function __createMgr(){
            mgr = new Oidc.UserManager(Config.OIDCCLIENT);
            return mgr;
        };

        app.getUserToken = function __getUserToken(callback){

            if(!mgr){ mgr = app.createMgr(); }

            if(!user) {
                mgr.getUser().then(function (_user) {
                    user = _user;
                    callback(user);
                });
            }else{
                callback(user);
            }
        };

        app.getAccessToken = function __getAccessToken(){
            return user && user.access_token;
        };

        app.getKey = function __getKey(){
            return user && user.token_type;
        };


        app.getTokenExpired = function __getTokenExpired(){

            var date;

            if(user){
                date = Date(user.expires_at);
            }

            return date;
        };

        app.getMgr = function __getMgr(){
            return mgr ? mgr : app.createMgr();
        };

        app.base_url_APICoreSSO = function __base_url(url) {
            url = url || "";
            return Config.SITE + Config.APICoreSSO + url;
        };

        app.base_url_APISGP = function __base_url(url) {
            url = url || "";
            return Config.SITE + Config.APISGP + url;
        };

        /**
         * @function retorna window.origin com path concatenado
         * @name windowLocation
         * @param {String} String com path
         * @returns {String} url final
         * @memberOf Factories.Util
         */
        app.getWindowLocation = function __windowLocation(path) {
            var location = window.location;
            var origin = location.origin ? location.origin + "/" + path : location.protocol + "//" + location.host + "/" + path;
            return origin;
        };

        /**
         * @function Obtem-se os params de uma url
         * @name getUrlParams
         * @returns {Object}
         * @memberOf Factories.Util
         */
        app.getUrlParams = function __getUrlParams() {
            // This function is anonymous, is executed immediately and
            // the return value is assigned to QueryString!
            var query_string = {};
            var query = $window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                // If first entry with this name
                if (typeof query_string[pair[0]] === "undefined") {
                    query_string[pair[0]] = decodeURI(pair[1]);
                    // If second entry with this name
                } else if (typeof query_string[pair[0]] === "string") {
                    var arr = [query_string[pair[0]], pair[1]];
                    query_string[pair[0]] = arr;
                    // If third or later entry with this name
                } else {
                    query_string[pair[0]].push(pair[1]);
                }
            }
        }

        return app;
    }

})(angular);

