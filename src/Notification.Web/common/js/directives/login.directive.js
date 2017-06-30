/**
 * Created by everton.ferreira on 12/06/2017.
 */
(function (angular) {

    'use strict';
    angular.module('directives')
        .directive("login", Login);

    Login.$inject = ['$util', '$location', '$timeout', '$window'];

    function Login() {
        var directive = {
            restrict: "AE",
            templateUrl: 'common/view/login.directive.html',
            controller: LoginController,
            scope:{},
            replace: true,
            transclude: false
        };

        function LoginController($scope, $util, $location, $timeout, $window) {

            $scope.mgr = null;
            $scope.load = false;
            $scope.redirect = false;

            function init(){
                $scope.redirect = $window.sessionStorage.loginRedirect == "false" ? false : true;
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

            init();

        }//MenuController

        return directive;
    }//Menu



})(angular);