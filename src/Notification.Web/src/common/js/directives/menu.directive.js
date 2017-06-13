/**
 * Created by everton.ferreira on 12/06/2017.
 */
(function (angular) {

    'use strict';
    angular.module('directives')
        .directive("menu", Menu);

    Menu.$inject = ['$notification', '$util', '$location', '$window'];

    function Menu() {
        var directive = {
            restrict: "AE",
            templateUrl: 'common/view/menu.directive.html',
            controller: MenuController,
            scope:{},
            replace: true,
            transclude: false
        };

        function MenuController($scope, $notification, $util, $location, $window) {

            //var token = $window.sessionStorage.token;

            function init(){
                //$scope.profile = $util.getUser(token);
                //$scope.isAdmin = $scope.profile.admin;
                //$scope.userName = $scope.profile.name;
                //$scope.isAdminGame = false;
            }

            /**
             * Efetua o logout do sistema
             * destruindo token de acesso
             */
            $scope.logout = function __logout() {
                //delete $window.sessionStorage.token;
                //$util.profile = null;
                //$location.path("");
            };//logout


            //if(token != undefined)
                init();

        }//MenuController

        return directive;
    }//Menu



})(angular);