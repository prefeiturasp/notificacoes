/**
 * Created by everton.ferreira on 16/06/2017.
 */
(function () {

    'use strict';

    angular
        .module('appNotification')
        .factory("HttpServices", HttpRegisterService);

    //Injectors
    HttpRegisterService.$inject = ['Model', 'toastr', '$http', '$window', '$timeout', '$util'];

    //angular.module('services').factory('HttpServices', ['Model', 'toastr', '$http', '$window',
        function HttpRegisterService(Model, toastr, $http, $window, $timeout, $util) {

            var session = false;

            function httpModel(model, callback){

                $http(model).then(function successCallback(response) {
                    callback && callback(response.data, response);
                }, function errorCallback(response) {

                    if(response.status == 401 && !session){
                        toastr.warning('Sua sessão expirou, refaça o login no sistema!', 'Sessão expirada');
                        session = true;
                        $timeout(function(){
                            window.sessionStorage.clear();
                            var mgr = $util.getMgr();
                            mgr.signoutRedirect();
                            $util.setLogout();
                        },3000);
                        return
                    }

                    if(!session) {
                        if (response.data)
                            toastr.error(response.data.Message, 'Error');
                        else
                            toastr.error(response.statusText, 'Error');
                    }

                    callback && callback(null, response);
                });
            }

            function getListSystem(visionGroupId, callback){

                if($window.sessionStorage.listSystem){
                    callback( JSON.parse(atob($window.sessionStorage.listSystem)));
                }else {

                    httpModel(Model.getSystem(visionGroupId), function (res) {
                        callback(res);
                        if(res && res.length > 0)
                            $window.sessionStorage.listSystem = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListVisionSystem(callback){

                if($window.sessionStorage.listVisionSystem){
                    callback( JSON.parse(atob($window.sessionStorage.listVisionSystem)));
                }else {

                    httpModel(Model.getVisionSytem(), function (res) {
                        callback(res);
                        if(res && res.length > 0)
                            $window.sessionStorage.listVisionSystem = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListGroups(id, callback){
                httpModel(Model.getGroupsAU(id), function (res) {
                    callback(res);
                    if(res && res.length > 0)
                        $window.sessionStorage.listGroups = btoa(JSON.stringify(res));
                });
            }

            function getListUnitAdministrative(params, callback){
                httpModel(Model.getUnitAdministrative(params), function (res) {callback(res);});
            }

            /*-----------------------------FILTROS POR USUÁRIO------------------------------------*/

            function getListCalendar(callback){

                if($window.sessionStorage.listCalendar){
                    callback(JSON.parse(atob($window.sessionStorage.listCalendar)));
                }else {

                    httpModel(Model.getCalendar(), function (res) {
                        callback(res);
                        if(res && res.length > 0)
                            $window.sessionStorage.listCalendar = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListSchoolSuperior(visionGroupId, callback){

                if($window.sessionStorage.listSchoolSuperior){
                    callback(JSON.parse(atob($window.sessionStorage.listSchoolSuperior)));
                }else {

                    httpModel(Model.getSchoolSuperior(visionGroupId), function (res) {
                        callback(res);
                        if(res && res.length > 0)
                            $window.sessionStorage.listSchoolSuperior = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListSchoolClassification(params, callback){
                httpModel(Model.getSchoolClassification(params), function (res) {
                    callback(res);
                });
            }

            function getListSchool(params, callback){
                httpModel(Model.getSchool(params), function (res) {callback(res);});
            }

            function getListPosition(callback){

                if($window.sessionStorage.listPosition){
                    callback(JSON.parse(atob($window.sessionStorage.listPosition)));
                }else {

                    httpModel(Model.getPosition(), function (res) {
                        callback(res);
                        if( res && res.length > 1)
                            $window.sessionStorage.listPosition = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListCorse(id, callback){
                if($window.sessionStorage.listCorse){
                    callback(JSON.parse(atob($window.sessionStorage.listCorse)));
                }else {

                    httpModel(Model.getCorse(id), function (res) {
                        callback(res);
                        if( res && res.length > 1)
                            $window.sessionStorage.listCorse = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListCoursePeriod(params, callback){
                httpModel(Model.getCoursePeriod(params), function (res) {
                    callback(res);
                });
            }

            function getListDiscipline(params, callback){
                httpModel(Model.getDiscipline(params), function (res) {
                    callback(res);
                });
            }

            function getListTeam(params, callback){
                httpModel(Model.getTeam(params), function (res) {
                    callback(res);
                });
            }

            function getTimeStamp(callback){
                httpModel(Model.getTimeStamp(), function (res) {
                    callback(res);
                });
            }

            function getUserName(groupSid, callback){
                if($window.sessionStorage.userName){
                    callback(JSON.parse(atob($window.sessionStorage.userName)));
                }else {
                    httpModel(Model.getUserName(groupSid), function (res) {
                        callback(res);
                        if(res)$window.sessionStorage.userName = btoa(JSON.stringify(res));
                    });
                }
            }

    /*-------------------------------------------POST----------------------------------------------------*/

            function postSave(data, callback){
                httpModel(Model.postSave(data), function (data, res) {
                    callback(data, res);
                });
            }

            return {
                getListVisionSystem: getListVisionSystem,
                getListSystem: getListSystem,
                getListGroups: getListGroups,
                getListCalendar: getListCalendar,
                getListSchoolSuperior: getListSchoolSuperior,
                getListSchoolClassification: getListSchoolClassification,
                getListSchool: getListSchool,
                getListPosition: getListPosition,
                getListCorse: getListCorse,
                getListCoursePeriod: getListCoursePeriod,
                getListDiscipline: getListDiscipline,
                getListTeam: getListTeam,
                postSave: postSave,
                getListUnitAdministrative: getListUnitAdministrative,
                getTimeStamp: getTimeStamp,
                getUserName: getUserName
            }

        };
})();