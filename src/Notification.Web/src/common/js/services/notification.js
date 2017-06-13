/**
 * @function Pilha de notificações (messagens)
 * @namespace Factory
* Created by everton.ferreira on 03/06/2016.
 */
(function (angular) {

    'use strict';

    //~GETTER
    angular
        .module('services')
        .factory('$notification', $notification)
        .directive('notifications', notifications)
        .directive('autoClose', autoClose);


    $notification.$inject = ['$window', '$injector'];
    notifications.$inject = ['$notification'];
    autoClose.$inject = ['$timeout'];


    function $notification($window, $injector) {

        var notifications = [],
            loadingMessage = null,
            defaults = {
                autoClose: true,
                type: '',
                closeable: true,
                title: '',
                message: '',
                delay: 4000 //4 segundos
            };

        var service = {
            get: get,
            add: add,
            remove: remove,
            clear: clear,
            loading: loading,
            clearLoading: clearLoading,
            alert: alert,
            info: info,
            success: success,
            error: error,
            generateID: generateID
        };


        function get() {
            return notifications;
        };

        function add(notification) {

            notifications.push(notification);
        };

        function remove(id) {

            for (var i = (notifications.length - 1) ; i >= 0 ; i--) {
                if (notifications[i].id == id) {
                    notifications.splice(i, 1);
                    break;
                }
            }
        };

        function clear() {
            notifications = [];
        };

        function loading(text) {
            if (text)
                loadingMessage = text;

            return loadingMessage;
        };

        function clearLoading() {
            loadingMessage = null;
        };

        function alert(title, message, scrollable, autoClose, closeable, delay, scrolltime) {

            var custom = {
                id: this.generateID(),
                title: title,
                message: message,
                type: 'warning',
                autoClose: (autoClose == null || autoClose == undefined) ? true : autoClose,
                closeable: (closeable == null || closeable == undefined) ? true : closeable,
                delay: (delay == null || delay == undefined) ? 4000 : delay
            }

            this.add(custom);
        };

        function info(title, message, scrollable, autoClose, closeable, delay, scrolltime) {

            var custom = {
                id: this.generateID(),
                title: title,
                message: message,
                type: 'info',
                autoClose: (autoClose == null || autoClose == undefined) ? true : autoClose,
                closeable: (closeable == null || closeable == undefined) ? true : closeable,
                delay: (delay == null || delay == undefined) ? 4000 : delay
            }

            this.add(custom);
        }

        function success(title, message, scrollable, autoClose, closeable, delay, scrolltime) {

            var custom = {
                id: this.generateID(),
                title: title,
                message: message,
                type: 'success',
                autoClose: (autoClose == null || autoClose == undefined) ? true : autoClose,
                closeable: (closeable == null || closeable == undefined) ? true : closeable,
                delay: (delay == null || delay == undefined) ? 4000 : delay
            }

            this.add(custom);
        };

        function error(title, message, scrollable, autoClose, closeable, delay, scrolltime) {

            var custom = {
                id: this.generateID(),
                title: title,
                message: message,
                type: 'error',
                autoClose: (autoClose == null || autoClose == undefined) ? true : autoClose,
                closeable: (closeable == null || closeable == undefined) ? true : closeable,
                delay: (delay == null || delay == undefined) ? 4000 : delay
            }

            this.add(custom);
        };

        function generateID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return uuid;
        };

        // Retorna o serviço
        return service;

    };


    function notifications($notification) {

        /*
         -------------------- posição e tamanho dos alerts ------------------------------
         class="customAlert-top-full-width"
         class="customAlert--bottom-full-width"
         class="customAlert-top-right"
         class="customAlert-top-left"
         class="customAlert-bottom-right"
         class="customAlert-bottom-left"
         ----------------------------------------------------------------------------------
         */

        //Caso seja necessário realizar a edição do template deve atualizá-lo a partir da variável(fonte) 'template'.
        var template = '<div id="customAlert-container" class="customAlert-top-full-width" aria-live="polite" role="alert">' +
            '<div ng-click="remove(notification.id)" ng-show="notification.closeable" ng-class="[\'customAlert\', \'customAlert-\'+notification.type]" ng-repeat="notification in notifications"' +
            'auto-close="{{notification.autoClose}}" data-index="{{notification.id}}" data-delay="{{notification.delay}}">' +
            '<a class="close" ng-click="remove(notification.id)" ng-show="notification.closeable">Fechar</a>' +
            '<div>' +
            '<div class="toast-title" ng-bind-html="notification.title"></div>' +
            '<div class="toast-message" ng-bind-html="notification.message"></div>' +
            '</div>' +
            '</div>' +
            '</div>';

        return {
            restrict: 'E',
            scope: {},
            controller: function () { },
            template: template,
            replace: true,
            link: function ( $scope, elem, attrs ) {

                // Obtem-se a lista de notificações do service
                $scope.notifications = $notification.get();

                $scope.$watch('notifications', function () {

                    $scope.notifications = $notification.get();
                });

                // Remove uma notificação
                $scope.remove = function (id) {
                    $notification.remove(id);
                };
            }
        };
    };


    function autoClose($timeout) {

        var increase = 100;
        var delay = 8000;

        return {
            restrict: 'A',
            require: '^notifications',
            link: {
                pre: function ($scope, elem, attrs, alert) {

                },

                post: function ($scope, elem, attrs, alert) {

                    delay += increase;

                    alert = $scope.$parent;

                    attrs.$observe("autoClose", function (autoClose) {

                        if (autoClose) {

                            $timeout(function () {

                                $(elem).fadeTo(500, 0).slideUp(500, function () {

                                    // Remove
                                    delay += -increase;
                                    var id = angular.element(elem).data('index');
                                    alert.remove(id);
                                });
                            }, delay);
                        }
                    });
                }
            }
        };
    };

})(angular);
