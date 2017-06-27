/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function () {

    'use strict';

    angular
        .module('appNotification')
        .factory("Model", Model);

    //Injectors
    Model.$inject = ['$util'];

    //angular.module('services').factory('Model', ['$util',
        function Model($util) {

            /*-----------------------------FILTROS POR SISTEMA------------------------------------*/

            function getVisionSytem() {
                return getheaders('GET', null, $util.base_url_APICoreSSO('/Group'));
            }

            function getSystem(visionId) {
                return getheaders('GET', null, $util.base_url_APICoreSSO('/System?groupSid=' + visionId));
            }

            function getGroupsAU(id) {
                return getheaders('GET', null, $util.base_url_APICoreSSO('/GroupDown?systemId=' + (id ? id : 0 )));
            }

            /*-----------------------------FILTROS POR USUÁRIO------------------------------------*/

            function getCalendar() {
                return getheaders('GET', null, $util.base_url_APISGP('/Calendar'));
            }

            function getSchoolSuperior(visionGroupId) {
                return getheaders('GET', visionGroupId, $util.base_url_APISGP('/SchoolSuperior'));
            }

            function getSchoolClassification(id) {
                return getheaders('GET', null, $util.base_url_APISGP('/SchoolClassification?schoolSuperiorId=' + id));
            }

            function getSchool(params) {
                return getheaders('GET', params.groupSid, $util.base_url_APISGP('/School?schoolSuperiorId=' + params.schoolSuperior ));
            }

            function getPosition() {
                return getheaders('GET', null, $util.base_url_APISGP('/Position'));
            }

            function getCorse(id) {
                return getheaders('GET', null, $util.base_url_APISGP('/Course?calendarId=' + id));
            }

            function getCoursePeriod(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/CoursePeriod?calendarId='+ params +'&periodId=' + params));
            }

            function getDiscipline(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/Discipline?calendarId='+ params +'&courseId='+ params +'&coursePeriodId='+ params));
            }

            function getTeam(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/Team?calendarId='+ params +'&schoolSuperiorId='+ params +'&schoolClassificationId='+ params +'&schoolId='+ params +'&courseId='+ params +'&coursePeriodId='+ params +'&disciplineId='+ params));
            }

            function postSave(data) {
                return getheaders('POST', null, $util.base_url_APINotification(), data);
            }

            function getheaders(_method, visionGroupId,  _url, data) {

                var method = {
                                method: _method,
                                url: _url,
                                "headers": {"Authorization": $util.getKey() + " " + $util.getAccessToken() }
                            };
                if(visionGroupId) {method.headers.groupSid = visionGroupId;}
                if(data) {method.data = data;}

                return method;
            }

        return {
            getVisionSytem: getVisionSytem,
            getSystem: getSystem,
            getGroupsAU: getGroupsAU,
            getCalendar: getCalendar,
            getSchoolSuperior: getSchoolSuperior,
            getSchoolClassification: getSchoolClassification,
            getSchool: getSchool,
            getPosition: getPosition,
            getCorse: getCorse,
            getCoursePeriod: getCoursePeriod,
            getDiscipline: getDiscipline,
            getTeam: getTeam,
            postSave: postSave
        }

    }
})();