/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {

    'use strict';

    angular
        .module('appNotification')
        .controller("RegisterController", RegisterController);

    //Injectors
    RegisterController.$inject = ['$scope', '$notification', 'Model', '$util'];

    /**
     * @namespace RegisterController
     * @desc Controller da página Register
     * @memberOf Controller
     */
    function RegisterController($scope, $notification, Model, $util) {

        var filtroModalSytem = document.getElementsByClassName('filtro-modal');
        var filtroModalUser = document.getElementsByClassName('filtro-modal');
        var system = document.getElementsByClassName('sist');
        var group = document.getElementsByClassName('grup');
        var notificacoes = document.getElementsByClassName('notificacoes');
        var checkSelected = document.getElementsByClassName('fa-check');

        function initialize() {

            $scope.system = {
                systemType: [{}],
                Group:[{}],
                AdministrativeUnit: [{}]
            };

            $scope.instructor = {
                dre:[{}],
                classification:[{}],
                school: [{}],
                Office: [{}]
            };

            $scope.collaborator = {};

            $scope.filters = {
                system:{},
                instructor:{},
                collaborator:{},
                sendersName: "",
                messageType: "",
                sendDate: "",
                expirationDate: "",
                message: ""
            };

            console.log($util.getToken());
            console.log($util.getUser());
        }

        $scope.selectMessageType = function __selectMessageType(e){

            var check = '<i class="fa fa-check" aria-hidden="true"></i>';
            angular.element(checkSelected).remove();
            angular.element(e.currentTarget).append(check);
            $scope.filters.messageType = angular.element(e.currentTarget).text();
        };

        $scope.openFIlterUser = function __openFIlterUser(e){
            angular.element(filtroModalUser).addClass('abre');
        };

        $scope.openFIlterSystem = function __openFIlterSystem(e){
            angular.element(filtroModalSytem).addClass('abre');
        };

        $scope.nextFilter = function __nextFilter(e){
            angular.element(system).addClass('some');
            angular.element(group).addClass('aparece');
        };

        $scope.closeModalSystem = function __closeModalSystem(e){
            angular.element(filtroModalSytem).removeClass('abre');
            angular.element(system).removeClass('some');
            angular.element(group).removeClass('aparece');
        };

        $scope.emitFilters = function __emitFilters(e){
            $scope.closeModal();
        };

        $scope.notificationMenu = function __notificationMenu(e){
            angular.element(notificacoes).toggleClass('abre');
        };

        initialize();
    }

})(angular);
