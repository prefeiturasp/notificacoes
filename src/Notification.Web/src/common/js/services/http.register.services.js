/**
 * Created by everton.ferreira on 16/06/2017.
 */
(function () {

    'use strict';

    angular
        .module('appNotification')
        .factory("HttpServices", HttpRegisterService);

    //Injectors
    HttpRegisterService.$inject = ['Model', 'toastr', '$http', '$window'];

    //angular.module('services').factory('HttpServices', ['Model', 'toastr', '$http', '$window',
        function HttpRegisterService(Model, toastr, $http, $window) {

            function httpModel(model, callback){

                $http(model).then(function successCallback(response) {
                    callback && callback(response.data);
                }, function errorCallback(response) {
                    if(response.data)
                        toastr.error(response.data.Message, 'Error');
                    else
                        toastr.error(response.statusText, 'Error');

                    callback && callback(null);
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

            function getListSchoolClassification(id, callback){

                if($window.sessionStorage.listSchoolClassification){
                    callback(JSON.parse(atob($window.sessionStorage.listSchoolClassification)));
                }else {

                    httpModel(Model.getSchoolClassification(id), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listSchoolClassification = btoa(JSON.stringify(res));
                    });
                }
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

                if($window.sessionStorage.listCorsePeriod){
                    callback(JSON.parse(atob($window.sessionStorage.listCorsePeriod)));
                }else {

                    httpModel(Model.getCoursePeriod(params), function (res) {
                        callback(res);
                        if(res && res.length > 1)
                            $window.sessionStorage.listCorsePeriod = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListDiscipline(params, callback){

                if($window.sessionStorage.listDiscipline){
                    callback(JSON.parse(atob($window.sessionStorage.listDiscipline)));
                }else {

                    httpModel(Model.getDiscipline(params), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listDiscipline = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListTeam(params, callback){

                if($window.sessionStorage.listTeam){
                    callback(JSON.parse(atob($window.sessionStorage.listTeam)));
                }else {

                    httpModel(Model.getTeam(params), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listTeam = btoa(JSON.stringify(res));
                    });
                }
            }

    /*-------------------------------------------POST----------------------------------------------------*/

            function postSave(data, callback){
                httpModel(Model.postSave(data), function (res) {
                    callback(res);
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
                postSave: postSave
            }

        };
})();