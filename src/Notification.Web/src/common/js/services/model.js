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

            function getUnitAdministrative(params) {
                return getheaders('GET', params.groupSid, $util.base_url_APISGP('/School?schoolSuperiorId=' + params.schoolSuperior));
            }

            /*-----------------------------FILTROS POR USUÁRIO------------------------------------*/

            function getCalendar() {
                return getheaders('GET', null, $util.base_url_APISGP('/Calendar'));
            }

            function getSchoolSuperior(visionGroupId) {
                return getheaders('GET', visionGroupId, $util.base_url_APISGP('/SchoolSuperior'));
            }

            function getSchoolClassification(params) {
                return getheaders('GET', params.groupSid, $util.base_url_APISGP('/SchoolClassification' + getConcatUrl('?','schoolSuperiorId', params.SchoolSuperior)));
            }

            function getSchool(params) {
                return getheaders('GET', params.groupSid, $util.base_url_APISGP('/SchoolByClassification' + getConcatUrl('?','schoolSuperiorId', params.SchoolSuperior) + getConcatUrl('&','schoolClassificationId', params.schoolClassification)));
            }

            function getPosition() {
                return getheaders('GET', null, $util.base_url_APISGP('/Position'));
            }

            function getCorse(id) {
                return getheaders('GET', null, $util.base_url_APISGP('/Course?calendarYear=' + id));
            }

            function getCoursePeriod(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/CoursePeriod?calendarYear='+ params +'&courseId[0]='+ params +'&courseId[1]='+ params));
            }

            function getDiscipline(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/Discipline?calendarId='+ params +'&courseId='+ params +'&coursePeriodId='+ params));
            }

            function getTeam(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/Team?calendarId='+ params +'&schoolSuperiorId='+ params +'&schoolClassificationId='+ params +'&schoolId='+ params +'&courseId='+ params +'&coursePeriodId='+ params +'&disciplineId='+ params));
            }

            function postSave(params) {
                return getheaders('POST', params.groupSid, $util.base_url_APINotification(), params.data);
            }

            function getTimeStamp() {
                return getheaders('GET', null, $util.base_url('/api/v1/TimeStamp'));
            }

            function getConcatUrl(concat, type, params){
                var url = '';
                for(var i = 0; i < params.length; i++){
                    if(i == 0)
                        url += concat + type + '[' + i + ']='+params[i].Id;
                    else
                        url += '&' + type + '[' + i + ']='+params[i].Id;
                }
                return url;
            }

            function getheaders(_method, visionGroupId,  _url, data) {

                var method = {
                                method: _method,
                                url: _url,
                                "headers": {
                                    "Authorization": $util.getKey() + " " + $util.getAccessToken(),
                                    "Content-Type": "application/json"
                                }
                            };
                if(visionGroupId) {method.headers.groupSid = visionGroupId;}
                if(data) {
                    method.data = data;
                }

                return method;
            }

        return {
            getVisionSytem: getVisionSytem,
            getSystem: getSystem,
            getGroupsAU: getGroupsAU,
            getUnitAdministrative: getUnitAdministrative,
            getCalendar: getCalendar,
            getSchoolSuperior: getSchoolSuperior,
            getSchoolClassification: getSchoolClassification,
            getSchool: getSchool,
            getPosition: getPosition,
            getCorse: getCorse,
            getCoursePeriod: getCoursePeriod,
            getDiscipline: getDiscipline,
            getTeam: getTeam,
            postSave: postSave,
            getTimeStamp: getTimeStamp
        }

    }
})();
