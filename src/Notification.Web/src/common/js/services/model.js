/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function () {
    angular.module('services').factory('Model', ['$util',
        function ($util) {

            function getSystem() {
                return getheaders('GET', $util.base_url('/System'));
            }

            function getGroupsAU(id) {
                return getheaders('GET', $util.base_url('/GroupDown?systemId=' + (id ? id : 0 )));
            }

            function getAdministrativeUnits(id) {
                return getheaders('GET', $util.base_url('/GroupAU?groupId=' + (id ? id : 0 )));
            }

            function getheaders(_method, _url) {
                return {
                    method: _method,
                    url: _url,
                    "headers": {"Authorization": "Bearer " + $util.getAccessToken()}
                }
            }

        return {
            getSystem: getSystem,
            getGroupsAU: getGroupsAU,
            getAdministrativeUnits: getAdministrativeUnits
        }

    }]);
})();