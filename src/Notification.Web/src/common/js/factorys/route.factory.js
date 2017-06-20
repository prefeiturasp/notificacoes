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
            .when('/register', {
                templateUrl: 'register/register.view.html',
                controller:'RegisterController',
                resolve: {
                    auth: ['$util', '$location', function ($util, $location) {
                        $util.getUserToken(function(user){
                            if(!user) {
                                $location.path("/");
                            }
                        });
                    }]//auth
                }//resolve
            })
            .when('/', {
                    templateUrl: 'login/login.html',
                    resolve: {
                        auth: ['$util', '$location', function ($util, $location) {
                            $util.getUserToken(function(user){
                                if(user) {
                                    $location.path("register");
                                }
                            });
                        }]//auth
                    }//resolve
            })
            .otherwise({ redirectTo: '/'});
    };

})(angular);
