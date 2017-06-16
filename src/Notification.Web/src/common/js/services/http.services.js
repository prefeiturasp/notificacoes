/**
 * Created by everton.ferreira on 16/06/2017.
 */
(function () {
    angular.module('services').factory('HttpServices', ['Model', 'toastr', '$http', '$window',
        function (Model, toastr, $http, $window) {

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

            return {
                getListSystem: getListSystem,
                getListGroups: getListGroups,
                getListAdministrativeUnits: getListAdministrativeUnits
            }

        }]);
})();