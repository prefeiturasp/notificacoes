/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {

    'use strict';

    angular
        .module('appNotification')
        .controller("RegisterController", RegisterController);

    //Injectors
    RegisterController.$inject = ['$scope', 'toastr', '$util', 'HttpServices'];

    /**
     * @namespace RegisterController
     * @desc Controller da página Register
     * @memberOf Controller
     */
    function RegisterController($scope, toastr, $util, HttpServices) {

        $scope.load = true;

        var filtroModalSytem, filtroModalUser, system, group,
            admUnit, notificacoes, checkSelected, filtroPorUsuario, body, selecionados;

        var templateDiv =  '<div class="filters-selected">';
        var templateExcluir =  '<a><i class="fa fa-times" aria-hidden="true" style="font-size: 30px;"></i></a>';

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

            $scope.listSystem = [];
            getElementsHtml();
            declareVariables();
            startRedactor();

        }

        /**
         *
         */
        function getElementsHtml(){
            filtroModalSytem = document.getElementsByClassName('filtro-system');
            filtroModalUser = document.getElementsByClassName('filtro-user');
            system = document.getElementsByClassName('sist');
            group = document.getElementsByClassName('grup');
            admUnit = document.getElementsByClassName('admUnit');
            notificacoes = document.getElementsByClassName('notificacoes');
            checkSelected = document.getElementsByClassName('fa-check');
            filtroPorUsuario = document.getElementsByClassName('filtro-por-usuario');
            selecionados = document.getElementsByClassName('selecionados');
            body = $('body')[0];
        }

        /**
         * Declara as variaveis utilizadas
         */
        function declareVariables(){

            HttpServices.getListSystem(function(data){
                $scope.listSystem = data;
                $scope.load = false;
            });

            $scope.listGroups = [];
            $scope.listDREs = [];
            $scope.AdministrativeUnits = [];


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
                toastr.warning("Selecione um tipo de usuário!");
            }
        };

        /**
         * Abre a modal de filtros por usuários
         * @param {Event} e
         */
        $scope.openModalUser = function __openModalUser(e){
            //mostra scroll vertical da tela
            angular.element(body).addClass('hidden-body');
            angular.element(filtroModalUser).addClass('abre');
            angular.element(filtroPorUsuario).css('display', 'none');
            angular.element(system).css('display', 'block');
        };

        /**
         * Abre a modal de filtros por sistemas
         * @param {Event} e
         */
        $scope.openModalSystem = function __openModalSystem(e){

            if($scope.listSystem.length > 1) {
                //mostra scroll vertical da tela
                angular.element(body).addClass('hidden-body');

                angular.element(filtroModalSytem).addClass('abre');
                angular.element(system).addClass('aparece').removeClass('some');
                angular.element(group).addClass('some').removeClass('aparece');
                angular.element(admUnit).addClass('some').removeClass('aparece');
            }else{
                toastr.warning("Não existe uma lista de sistemas cadastrada!");
            }
        };

        $scope.nextFilter = function __nextFilter(e, idModal) {
            $scope.load = true;
            if (idModal == 2 && $scope.system.systemType){
                getGroups();
            }else if (idModal == 3 && $scope.system.Group){
                getAdministrativeUnits();
            }

        };

        function getGroups(){
            HttpServices.getListGroups($scope.system.systemType.Id,
                function(data){
                    $scope.listGroups = data;
                    $scope.load = false;

                    if(data.length > 0) {
                        angular.element(system).addClass('some').removeClass('aparece');
                        angular.element(group).removeClass('some').addClass('aparece');
                        angular.element(admUnit).addClass('some').removeClass('aparece');
                    }

                });
        }

        function getAdministrativeUnits(){
            HttpServices.getListAdministrativeUnits( $scope.system.Group.Id,
                function(data){
                    $scope.AdministrativeUnits = data;
                    $scope.load = false;
                    if(data.length > 0) {
                        angular.element(system).addClass('some').removeClass('aparece');
                        angular.element(group).addClass('some').removeClass('aparece');
                        angular.element(admUnit).removeClass('some').addClass('aparece');
                    }
                });
        }

        /**
         * Salva o sistema selecionado
         * @param {Object} obj
         */
        $scope.selectedSystemGroup = function __selectedSystemGroup(type, obj){
            if(type =='system') {
                $scope.system.systemType = obj;
            }else if(type =='group') {
                $scope.system.Group = obj;
            }
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
            //mostra scroll vertical da tela
            angular.element(body).removeClass('hidden-body');
            //reseta as variaveis
            declareVariables();
        };

        /**
         *
         * @param {Event} e -
         * @param {Object} isfilter - usado para validar  se foi selecionado ao menos um tipo filtro da tela
         */
        $scope.emitFilters = function __emitFilters(e, isfilter){

            if(isfilter || isfilter.length > 0) {
                $scope.filters.filters.push(angular.copy($scope.system));
                setHtmlFiltrosSelecionados();
                $scope.closeModal(null, "system");

            }else{
                toastr.warning("Selecione ao menos uma opção para enviar!");
            }
        };

        /**
         *
         */
        function setHtmlFiltrosSelecionados(){

            var system = '<p>'+ $scope.system.systemType.Name+'</p>';
            var group = '<p>'+$scope.system.Group.Name+'</p>';

            var html = templateDiv + system +
                ($scope.system.Group.length > 0 ? group : '') +
                templateExcluir + '</div>';

            angular.element(selecionados).append(html);
        }

        /**
         *
         * @param e
         */
        $scope.notificationMenu = function __notificationMenu(e){
            angular.element(notificacoes).toggleClass('abre');
        };

        $util.getUserToken(function(user){
            if(user)initialize();
        });
    }

})(angular);
