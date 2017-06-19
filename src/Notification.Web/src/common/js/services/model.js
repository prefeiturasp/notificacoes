/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function () {
    angular.module('services').factory('Model', ['$util',
        function ($util) {

            /*-----------------------------FILTROS POR SISTEMA------------------------------------*/

            function getSystem() {
                return getheaders('GET', $util.base_url_APICoreSSO('/System'));
            }

            function getGroupsAU(id) {
                return getheaders('GET', $util.base_url_APICoreSSO('/GroupDown?systemId=' + (id ? id : 0 )));
            }

            function getDREs(id) {
                return getheaders('GET', $util.base_url_APICoreSSO('/GroupDown?systemId=' + (id ? id : 0 )));
            }

            function getAdministrativeUnits(id) {
                return getheaders('GET', $util.base_url_APICoreSSO('/GroupAU?groupId=' + (id ? id : 0 )));
            }

            /*-----------------------------FILTROS POR USUÁRIO------------------------------------*/

            function getCalendar() {
                return getheaders('GET', $util.base_url_APISGP('/Calendar'));
            }

            function getSchoolSuperior() {
                return getheaders('GET', $util.base_url_APISGP('/SchoolSuperior'));
            }

            function getSchoolClassification(id) {
                return getheaders('GET', $util.base_url_APISGP('/SchoolClassification?schoolSuperiorId=' + id));
            }

            function getSchool(params) {
                return getheaders('GET', $util.base_url_APISGP('/School?schoolSuperiorId='+ params +'&schoolClassificationId='+ params +''));
            }

            function getPosition() {
                return getheaders('GET', $util.base_url_APISGP('/Position'));
            }

            function getCorse(id) {
                return getheaders('GET', $util.base_url_APISGP('/Course?calendarId=' + id));
            }

            function getCoursePeriod(params) {
                return getheaders('GET', $util.base_url_APISGP('/CoursePeriod?calendarId='+ params +'&periodId=' + params));
            }

            function getDiscipline(params) {
                return getheaders('GET', $util.base_url_APISGP('/Discipline?calendarId='+ params +'&courseId='+ params +'&coursePeriodId='+ params));
            }

            function getTeam(params) {
                return getheaders('GET', $util.base_url_APISGP('/Team?calendarId='+ params +'&schoolSuperiorId='+ params +'&schoolClassificationId='+ params +'&schoolId='+ params +'&courseId='+ params +'&coursePeriodId='+ params +'&disciplineId='+ params));
            }

            function getheaders(_method, _url) {
                return {
                    method: _method,
                    url: _url,
                    "headers": {"Authorization": $util.getKey() + " " + $util.getAccessToken()}
                }
            }

        return {
            getSystem: getSystem,
            getGroupsAU: getGroupsAU,
            getDREs: getDREs,
            getAdministrativeUnits: getAdministrativeUnits,
            getCalendar: getCalendar,
            getSchoolSuperior: getSchoolSuperior,
            getSchoolClassification: getSchoolClassification,
            getSchool: getSchool,
            getPosition: getPosition,
            getCorse: getCorse,
            getCoursePeriod: getCoursePeriod,
            getDiscipline: getDiscipline,
            getTeam: getTeam
        }

    }]);
})();