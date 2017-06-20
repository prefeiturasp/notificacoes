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

            function getLists(model, callback){

                $http(model).then(function successCallback(response) {
                    callback && callback(response.data);
                }, function errorCallback(response) {
                    toastr.error(response.data.Message, 'Error');
                    callback && callback([]);
                });
            }

            function getListSystem(callback){

                if($window.sessionStorage.listSystem){
                    callback( JSON.parse(atob($window.sessionStorage.listSystem)));
                }else {

                    getLists(Model.getSystem(), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listSystem = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListGroups(id, callback){

                if($window.sessionStorage.listGroups){
                    callback(JSON.parse(atob($window.sessionStorage.listGroups)));
                }else {

                    getLists(Model.getGroupsAU(id), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listGroups = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListAdministrativeUnits(id, callback){

                if($window.sessionStorage.listAdministrativeUnits){
                    callback(JSON.parse(atob($window.sessionStorage.listAdministrativeUnits)));
                }else {

                    getLists(Model.getAdministrativeUnits(id), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listAdministrativeUnits = btoa(JSON.stringify(res));
                    });
                }
            }

            /*-----------------------------FILTROS POR USUÁRIO------------------------------------*/

            function getListCalendar(callback){

                if($window.sessionStorage.listCalendar){
                    callback(JSON.parse(atob($window.sessionStorage.listCalendar)));
                }else {

                    getLists(Model.getCalendar(), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listCalendar = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListSchoolSuperior(callback){

                if($window.sessionStorage.listSchoolSuperior){
                    callback(JSON.parse(atob($window.sessionStorage.listSchoolSuperior)));
                }else {

                    getLists(Model.getSchoolSuperior(), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listSchoolSuperior = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListSchoolClassification(id, callback){

                if($window.sessionStorage.listSchoolClassification){
                    callback(JSON.parse(atob($window.sessionStorage.listSchoolClassification)));
                }else {

                    getLists(Model.getSchoolClassification(id), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listSchoolClassification = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListSchool(params, callback){

                if($window.sessionStorage.listSchool){
                    callback(JSON.parse(atob($window.sessionStorage.listSchool)));
                }else {

                    getLists(Model.getSchool(params), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listSchool = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListPosition(callback){

                if($window.sessionStorage.listPosition){
                    callback(JSON.parse(atob($window.sessionStorage.listPosition)));
                }else {

                    getLists(Model.getPosition(), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listPosition = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListCorse(id, callback){

                if($window.sessionStorage.listCorse){
                    callback(JSON.parse(atob($window.sessionStorage.listCorse)));
                }else {

                    getLists(Model.getCorse(id), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listCorse = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListCoursePeriod(params, callback){

                if($window.sessionStorage.listCorsePeriod){
                    callback(JSON.parse(atob($window.sessionStorage.listCorsePeriod)));
                }else {

                    getLists(Model.getCoursePeriod(params), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listCorsePeriod = btoa(JSON.stringify(res));
                    });
                }
            }

            function getListDiscipline(params, callback){

                if($window.sessionStorage.listDiscipline){
                    callback(JSON.parse(atob($window.sessionStorage.listDiscipline)));
                }else {

                    getLists(Model.getDiscipline(params), function (res) {
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

                    getLists(Model.getTeam(params), function (res) {
                        callback(res);
                        if(res.length > 1)
                            $window.sessionStorage.listTeam = btoa(JSON.stringify(res));
                    });
                }
            }

            return {
                getListSystem: getListSystem,
                getListGroups: getListGroups,
                getListAdministrativeUnits: getListAdministrativeUnits,
                getListCalendar: getListCalendar,
                getListSchoolSuperior: getListSchoolSuperior,
                getListSchoolClassification: getListSchoolClassification,
                getListSchool: getListSchool,
                getListPosition: getListPosition,
                getListCorse: getListCorse,
                getListCoursePeriod: getListCoursePeriod,
                getListDiscipline: getListDiscipline,
                getListTeam: getListTeam
            }

        };
})();