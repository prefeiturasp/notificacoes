/**
 * Created by everton.ferreira on 12/06/2017.
 */
(function (angular) {

    'use strict';
    angular.module('directives')
        .directive("login", Login);

    Login.$inject = ['$notification', '$util', '$location', '$timeout'];

    function Login() {
        var directive = {
            restrict: "AE",
            templateUrl: 'common/view/login.directive.html',
            controller: LoginController,
            scope:{},
            replace: true,
            transclude: false
        };

        function LoginController($scope, $notification, $util, $location, $timeout) {

            var mgr = null;

            function init(){
                $scope.tokenId = null;

                $scope.config = {
                    authority: "http://10.10.10.37:5000",
                    client_id: "mstechjs",
                    redirect_uri: "http://localhost:5003/callback.html",
                    response_type: "id_token token",
                    scope:"openid profile api1",
                    post_logout_redirect_uri : "http://localhost:5003/index.html"
                };

                mgr = new Oidc.UserManager($scope.config);
                getUserToken();

            }

            function getUserToken(){

                mgr.getUser().then(function (user) {
                    if (user) {
                        $scope.tokenId = user.id_token;
                        $scope.user = user;
                        $scope.redirectToPage();
                    }
                });
            }

            $scope.redirectToPage = function (){
                $util.setToken($scope.user, $scope.tokenId);
                if($scope.tokenId){
                    $timeout(function(){
                        $location.path('register');}, 0
                    );
                }
            };


            $scope.login = function __login() {
                mgr.signinRedirect();
            };

            //function api() {
            //    mgr.getUser().then(function (user) {
            //        var url = "http://localhost:5001/identity";
            //
            //        var xhr = new XMLHttpRequest();
            //        xhr.open("GET", url);
            //        xhr.onload = function () {
            //            log(xhr.status, JSON.parse(xhr.responseText));
            //        };
            //        xhr.setRequestHeader("Authorization", "Bearer " + user.access_token);
            //        xhr.send();
            //    });
            //}
            //
            //function api45() {
            //    mgr.getUser().then(function (user) {
            //        var url = "http://localhost:6454/identity";
            //
            //        var xhr = new XMLHttpRequest();
            //        xhr.open("GET", url);
            //        xhr.onload = function () {
            //            log(xhr.status, JSON.parse(xhr.responseText));
            //        };
            //        xhr.setRequestHeader("Authorization", "Bearer " + user.access_token);
            //        xhr.send();
            //    });
            //}
            //
            //function logout() {
            //    mgr.signoutRedirect();
            //}

            init();

        }//MenuController

        return directive;
    }//Menu



})(angular);