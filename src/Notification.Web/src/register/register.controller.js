/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {

    'use strict';

    angular
        .module('appNotification')
        .controller("RegisterController", RegisterController);

    //Injectors
    RegisterController.$inject = ['$scope', 'toastr', 'Model', '$util'];

    /**
     * @namespace RegisterController
     * @desc Controller da página Register
     * @memberOf Controller
     */
    function RegisterController($scope, toastr, Model, $util) {

        var filtroModalSytem = document.getElementsByClassName('filtro-system');
        var filtroModalUser = document.getElementsByClassName('filtro-user');
        var system = document.getElementsByClassName('sist');
        var group = document.getElementsByClassName('grup');
        var admUnit = document.getElementsByClassName('admUnit');
        var notificacoes = document.getElementsByClassName('notificacoes');
        var checkSelected = document.getElementsByClassName('fa-check');
        var filtroPorUsuario = document.getElementsByClassName('filtro-por-usuario');

        /**
         * Contructor
         */
        function initialize() {
            $scope.limitCharRedactor = 20;

            $scope.filters = {
                filters:[],
                sendersName: "",
                messageType: "",
                sendDate: "",
                expirationDate: "",
                message: "",
                title: ""
            };

            declareVariables();
            startRedactor();
        }

        /**
         * Declara as variaveis utilizadas
         */
        function declareVariables(){

            $scope.listSystem = [
                {id: 0 , name: 'Administração de sistema' },
                {id: 1 , name: 'Biblioteca' },
                {id: 2 , name: 'Gestão Escolar' },
                {id: 3 , name: 'Boletim Online' }
            ];

            $scope.Groups = [
                {id: 0 , name: 'Administração' },
                {id: 1 , name: 'Professor' },
                {id: 2 , name: 'Secretário' },
                {id: 3 , name: 'Diretor' }
            ];

            $scope.AdministrativeUnits = [
                {id: 0 , name: 'Escola' },
                {id: 1 , name: 'Escola1' },
                {id: 2 , name: 'Escola2' },
                {id: 3 , name: 'Escola3' }
            ];


            $scope.system = {
                systemType: [],
                Group:[],
                AdministrativeUnit: []
            };

            $scope.User = {
                UserType: null,
                SchoolSuperior:[],
                SchoolClassification:[],
                School:[],
                Position:[],
                Course:[],
                CoursePeriod:[],
                Discipline:[],
                Team:[]
            };
        }

        /**
         * Instancia o elemento redactor na tela
         */
        function startRedactor(){
            //instanciando o redactor
            $("#content").redactor({
                limiter: $scope.limitCharRedactor, // number of characters
                plugins: ['limiter']
            });

            //removendo botões não urilizados
            $(".re-format").remove();
            $(".re-italic").remove();
            $(".re-deleted").remove();
            $(".re-horizontalrule").remove();

            //limita a quantidade de  caracteras usando cltr+v
            //document.getElementById('redactor-uuid-0').onpaste = function(e){return false;}
            document.getElementById('redactor-uuid-0').addEventListener('keyup', function(e){

                var element = $(this);
                var text = element.text();

                //não deixa inserir mais nem um caracter a mais do limite
                if(text.length == ($scope.limitCharRedactor + 1)) { return; }

                //se o cltr+v for mair que o limite de caracter aceito
                if(text.length > $scope.limitCharRedactor){
                    //pega apenas a string com a quantida de limite de caracteres
                    text = text.substr(0, $scope.limitCharRedactor);
                    //limpa o campo de texto
                    element.text("");
                    //add o texto dentro do limite de carateres aceito
                    element.append('<p>'+text+'</p>');
                }

            });
        }

        $scope.selectMessageType = function __selectMessageType(e){

            var check = '<i class="fa fa-check" aria-hidden="true"></i>';
            angular.element(checkSelected).remove();
            angular.element(e.currentTarget).append(check);
            $scope.filters.messageType = angular.element(e.currentTarget).text();
        };

        $scope.openFilterTypeUser = function __openFilterTypeUser(e){
            if($scope.User.UserType) {
                angular.element(filtroPorUsuario).css('display', 'block');
                angular.element(system).css('display', 'none');
            }else{
                toastr.warning("oi");
            }
        };

        /**
         * Abre a modal de filtros por usuários
         * @param {Event} e
         */
        $scope.openModalUser = function __openModalUser(e){
            angular.element(filtroModalUser).addClass('abre');
            angular.element(filtroPorUsuario).css('display', 'none');
            angular.element(system).css('display', 'block');
        };

        /**
         * Abre a modal de filtros por sistemas
         * @param {Event} e
         */
        $scope.openModalSystem = function __openModalSystem(e){
            angular.element(filtroModalSytem).addClass('abre');
            angular.element(system).addClass('aparece').removeClass('some');
            angular.element(group).addClass('some').removeClass('aparece');
            angular.element(admUnit).addClass('some').removeClass('aparece');
        };

        $scope.nextFilter = function __nextFilter(e, idModal) {

            if (idModal == 2 && $scope.system.systemType.length > 0){
                angular.element(system).addClass('some').removeClass('aparece');
                angular.element(group).removeClass('some').addClass('aparece');
                angular.element(admUnit).addClass('some').removeClass('aparece');
            }else if (idModal == 3 && $scope.system.Group.length > 0){
                angular.element(system).addClass('some').removeClass('aparece');
                angular.element(group).addClass('some').removeClass('aparece');
                angular.element(admUnit).removeClass('some').addClass('aparece');
            }

        };

        /**
         * Salva o sistema selecionado
         * @param {Object} obj
         */
        $scope.selectedSystem = function __selectedSystem(obj){
            $scope.system.systemType = [obj];
        };

        /**
         *
         * @param {Event} e -
         * @param {Object} arr -
         * @param {Object}obj -
         */
        $scope.selectTypeFilter = function __selectTypeFilter(e, arr, obj){

            //procura se já existe um obj salvo no arr
            for(var index in arr) {
                if (angular.equals(obj, arr[index])){
                    arr.splice(index, 1);
                    return;
                }
            }

            //salva obj dentro do arr
            arr.push(obj);

        };

        /**
         *
         * @param {Event}e
         * @param {String} type - Nomenclatura da modal de filtro que será fechada
         */
        $scope.closeModal = function __closeModal(e, type){

            if(type == "system") {
                angular.element(filtroModalSytem).removeClass('abre');
            }else if(type == "user"){
                angular.element(filtroModalUser).removeClass('abre');
            }
            //reseta as variaveis
            declareVariables();
        };

        /**
         *
         * @param {Event} e -
         * @param {Object} isfilter - usado para validar  se foi selecionado ao menos um tipo filtro da tela
         */
        $scope.emitFilters = function __emitFilters(e, isfilter){

            if(isfilter.length > 0) {
                $scope.filters.filters.push(angular.copy($scope.system));
                $scope.closeModal(null, "system");
                console.log($scope.filters.filters);
            }else{
                toastr.warning("Selecione ao menos uma opção para enviar!");
            }
        };

        /**
         *
         * @param e
         */
        $scope.notificationMenu = function __notificationMenu(e){
            angular.element(notificacoes).toggleClass('abre');
        };

        initialize();
    }

})(angular);
