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
                $scope.mgr = $util.createMgr();
                getUserToken();

            }

            function getUserToken(){

                $util.getUserToken(function(user){
                    if (user) {
                        $scope.tokenId = user.id_token;
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
                $scope.mgr.signinRedirect();
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