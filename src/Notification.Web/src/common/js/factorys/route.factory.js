/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {
    'use strict';

    angular
        .module('appNotification')
        .config(['$routeProvider',

            function ($routeProvider ) {
                $routeProvider
                    .when('/register', {
                        templateUrl: 'register/register.view.html',
                        controller:'RegisterController',
                        resolve: {
                            auth: ['$window', '$location', function ($window, $location) {

                            }]//auth
                        }//resolve
                    })
                    .when('/', {
                            templateUrl: 'register/login.html',
                            resolve: {
                                auth: ['$util', '$location', function ($util, $location) {
                                    if($util.getToken()) {
                                        $location.path("register");
                                    }
                                }]//auth
                            }//resolve
                    })
                    .otherwise({ redirectTo: '/'});
            }]);

})(angular);
