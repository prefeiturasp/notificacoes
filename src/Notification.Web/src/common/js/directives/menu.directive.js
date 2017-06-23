/**
 * Created by everton.ferreira on 12/06/2017.
 */
(function (angular) {

    'use strict';
    angular.module('directives')
        .directive("menu", Menu);

    Menu.$inject = ['$util', 'HttpServices'];

    function Menu() {
        var directive = {
            restrict: "AE",
            templateUrl: 'common/view/menu.directive.html',
            controller: MenuController,
            scope:{},
            replace: true,
            transclude: false
        };

        function MenuController($scope, $util, HttpServices) {

            $scope.listMenuSystem = [];
            $scope.showListMenu = false;

            $scope.openMenuSytem = function __openMenuSytem() {
                $scope.showListMenu = !$scope.showListMenu;

                if($scope.listMenuSystem.length == 0 && $scope.showListMenu) {
                    HttpServices.getListSystem("", function (data) {
                        $scope.listMenuSystem = data;
                    });
                }
            };
            $scope.mouseOver = function __mouseOver() {
                $scope.showListMenu = false;
            };

            /**
             * Efetua o logout do sistema
             * destruindo token de acesso
             */
            $scope.logout = function __logout() {
               var mgr = $util.getMgr();
                mgr.signoutRedirect();
                $util.setLogout();
                window.sessionStorage.clear();
            };//logout

        }//MenuController

        return directive;
    }//Menu



})(angular);