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

        var app = {};

        app.createMgr = function __createMgr(){

            var config = {
                authority: "http://10.10.10.37:5000",
                client_id: "mstechjs",
                redirect_uri: "http://localhost:5003/callback.html",
                response_type: "id_token token",
                scope:"openid profile api1",
                post_logout_redirect_uri : "http://localhost:5003/index.html"
            };

            var mgr = new Oidc.UserManager(config);

            return mgr;
        };

        app.getUserToken = function __getUserToken(callback){

            if(!mgr){
                var mgr = app.createMgr();
            }

            mgr.getUser().then(function (user) {
                if (user) {
                    callback(user);
                }
            });
        };

        app.setToken = function __setToken(_user, _token){
            $window.localStorage.setItem("token", btoa(_token));
            $window.localStorage.setItem("user",  btoa(JSON.stringify(_user)));
        };

        app.getToken = function __setToken(){
            return $window.localStorage.getItem("token") && atob($window.localStorage.getItem("token"));
        };

        app.getUser = function __getUser(){
            return $window.localStorage.getItem("user") && JSON.parse(atob($window.localStorage.getItem("user")));
        };

        app.base_url = function __base_url(url) {
            url = url || "";
            return 'http://localhost:63342/' + url;
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

