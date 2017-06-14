/**
 * Created by everton.ferreira on 12/06/2017.
 */
(function (angular) {

    'use strict';
    angular.module('directives')
        .directive("login", Login);

    Login.$inject = ['$util', '$location', '$timeout'];

    function Login() {
        var directive = {
            restrict: "AE",
            templateUrl: 'common/view/login.directive.html',
            controller: LoginController,
            scope:{},
            replace: true,
            transclude: false
        };

        function LoginController($scope, $util, $location, $timeout) {

            var mgr = null;

            function init(){
                $scope.tokenId = null;
                $scope.mgr = $util.getMgr();
                getUserToken();

            }

            function getUserToken(){

                $util.getUserToken(function(user){
                    if (user) {
                        $scope.tokenId = user.id_token;
                        $scope.user = user;
                        $scope.redirectToPage();
                    }
                });
            }

            $scope.redirectToPage = function (){
                if($scope.tokenId){
                    $timeout(function(){
                        $location.path('register');}, 0
                    );
                }
            };


            $scope.login = function __login() {
                $scope.mgr.signinRedirect();
            };

            $scope.api = function __api() {
                if (!$scope.user) {

                    $util.getUserToken(function(user){
                        if (user) {
                            $scope.user = user;
                            Authorization(user);
                        }
                    });
                }else{
                    Authorization($scope.user);
                }
            }

            function Authorization(){
                var url = "http://localhost:5001/identity";

                var xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                xhr.onload = function () {
                    log(xhr.status, JSON.parse(xhr.responseText));
                };
                xhr.setRequestHeader("Authorization", "Bearer " + $scope.user.access_token);
                xhr.send();
            }

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

            init();

        }//MenuController

        return directive;
    }//Menu



})(angular);