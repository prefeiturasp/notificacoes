/**
 * Created by everton.ferreira on 12/06/2017.
 */
(function (angular) {

    'use strict';
    angular.module('directives')
        .directive("menu", Menu);

    Menu.$inject = ['$util', 'HttpServices', '$timeout', '$location'];

    function Menu() {
        var directive = {
            restrict: "AE",
            templateUrl: 'common/view/menu.directive.html',
            controller: MenuController,
            scope:{},
            replace: true,
            transclude: false
        };

        function MenuController($scope, $util, HttpServices, $timeout, $location) {

            $scope.listMenuSystem = [];
            $scope.showListMenu = false;
            $scope.getListMenu = false;
            $scope.userName = [];

            $scope.openMenuSytem = function __openMenuSytem() {

                if($scope.listMenuSystem.length == 0 && !$scope.showListMenu && !$scope.getListMenu) {
                    var vision = JSON.parse(atob(window.sessionStorage.visionSelected));

                    HttpServices.getListSystem(vision.Id, function (data) {
                        $scope.listMenuSystem = data;
                        $scope.showListMenu = !$scope.showListMenu;
                        $scope.getListMenu = true;
                    });
                }else if($scope.getListMenu){
                    $scope.showListMenu = !$scope.showListMenu;
                }
            };

            $scope.mouseOver = function __mouseOver() {
                $scope.showListMenu = false;
            };

            function getUserName(){
                try{
                    var vision = JSON.parse(atob(window.sessionStorage.visionSelected));
                    HttpServices.getUserName(vision.Id, function (data) {
                        $scope.userName = data;
                    });
                }catch(e){
                    setTimeout(function(){ getUserName()}, 2000);
                }
            }

            /**
             * Efetua o logout do sistema
             * destruindo token de acesso
             */
            $scope.logout = function __logout() {
                window.sessionStorage.clear();
                var mgr = $util.getMgr();
                mgr.signoutRedirect();
                $util.setLogout();
            };//logout

           getUserName();

        }//MenuController

        return directive;
    }//Menu



})(angular);