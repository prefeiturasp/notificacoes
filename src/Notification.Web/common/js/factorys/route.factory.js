/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {
    'use strict';

    angular
        .module("appNotification")
        .config(Provider);

    Provider.$inject = ['$routeProvider'];

    function Provider($routeProvider ) {
        $routeProvider
            .when('/', {
                templateUrl: 'register/register.view.html',
                controller:'RegisterController',
                resolve: {
                    auth: ['$util', '$location', function ($util, $location) {
                        window.sessionStorage.redirect = false;
                        window.sessionStorage.loginRedirect = false;
                        if(!$util.getUser()) {
                            $util.getUserToken(function(user){
                                if(!user) {
                                    var mgr = $util.getMgr();
                                    mgr.signinRedirect();
                                }else{
                                    window.sessionStorage.redirect = true;
                                }
                            });
                        }else{
                            window.sessionStorage.redirect = true
                        }
                    }]//auth
                }//resolve
            })
            .otherwise({ redirectTo: '/'});
    }

})(angular);
