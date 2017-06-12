/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function () {
    angular.module('services').factory('Model', ['$resource', '$util',
        function ($resource, $util) {

        // Model
        var model = {

            'load': {
                method: 'GET',
                url: $util.base_url('AbsenceReason/Load')
            },
            'find': {
                method: 'GET',
                url: $util.base_url('AbsenceReason/Find')
            },
            'findSimple': {
                method: 'GET',
                url: $util.base_url('AbsenceReason/FindSimple')
            },
            'search': {
                method: 'GET',
                url: $util.base_url('AbsenceReason/Search')
            },
            'save': {
                method: 'POST',
                url: $util.base_url('AbsenceReason/Save')
            },
            'delete': {
                method: 'POST',
                url: $util.base_url('AbsenceReason/Delete')
            },
            'loadCombo': {
                method: 'GET',
                url: $util.base_url('AbsenceReason/LoadCombo')
            }
        };

        // Retorna o serviço
        return $resource('', {}, model);

    }]);
})();