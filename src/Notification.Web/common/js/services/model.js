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

        	function getVisionSytem(groupSid) {
            	return getheaders('GET', groupSid, $util.base_url_APICoreSSO('/Group'));
            }

            function getSystem(visionId) {
                return getheaders('GET', null, $util.base_url_APICoreSSO('/System?groupSid=' + visionId));
            }

            function getGroupsAU(params) {
            	return getheaders('GET', params.groupSid, $util.base_url_APICoreSSO('/GroupDown?systemId=' + (params.id ? params.id : 0)));
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
                return getheaders('GET', params.groupSid, $util.base_url_APISGP('/SchoolByClassification?' + getConcatUrl('','schoolSuperiorId', params.SchoolSuperior) + (params.SchoolSuperior.length > 0 ? '&' : '' ) + getConcatUrl('','schoolClassificationId', params.schoolClassification)));
            }

            function getPosition() {
                return getheaders('GET', null, $util.base_url_APISGP('/Position'));
            }

            function getCorse(id) {
                return getheaders('GET', null, $util.base_url_APISGP('/Course?calendarYear=' + id));
            }

            function getCoursePeriod(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/CoursePeriod?calendarYear='+ params.calendarYear + getConcatUrl('&','courseId', params.courseId)));
            }

            function getDiscipline(params) {
                return getheaders('GET', null, $util.base_url_APISGP('/Discipline?calendarYear='+ params.calendarYear + getConcatUrl('&','courseId', params.courseId) + getConcatUrl('&','coursePeriodId', params.coursePeriodId)));
            }

            function getTeam(params) {
                return getheaders('GET', params.groupSid, $util.base_url_APISGP('/Team?calendarYear='+ params.calendarYear + getConcatUrl('&','schoolSuperiorId', params.schoolSuperiorId) + getConcatUrl('&','schoolClassificationId', params.schoolClassificationId) +
                    getConcatUrl('&','schoolId', params.schoolId) + getConcatUrl('&','courseId', params.courseId) + getConcatUrl('&','coursePeriodId', params.coursePeriodId) + getConcatUrl('&','disciplineId', params.disciplineId)));
}

            function postSave(params) {
                return getheaders('POST', params.groupSid, $util.base_url_APINotification(), params.data);
            }

            function getTimeStamp() {
                return getheaders('GET', null, $util.base_url('/api/v1/TimeStamp'));
            }

            function getUserName(groupSid) {
                return getheaders('GET', groupSid, $util.base_url('/api/SGP/v1/User'));
            }

            function getConcatUrl(concat, type, params){
                var url = '';

                for(var i = 0; i < params.length; i++){
                    if(i == 0)
                        url += concat + type + '='+ (params[i].Id != undefined ? params[i].Id : params[i]);
                    else
                        url += '&' + type + '='+ (params[i].Id != undefined ? params[i].Id : params[i]);
                }
                return url;
            }

            function getheaders(_method, groupSid,  _url, data) {

                var method = {
                                method: _method,
                                url: _url,
                                "headers": {
                                    "Authorization": $util.getKey() + " " + $util.getAccessToken(),
                                    "Content-Type": "application/json"
                                }
                            };
                if(groupSid) {method.headers.groupSid = groupSid;}
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
            getTimeStamp: getTimeStamp,
            getUserName: getUserName
        }

    }
})();
