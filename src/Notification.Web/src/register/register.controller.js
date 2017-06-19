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
        $scope.modalOpen = false;

        var filtroModalSytem, filtroModalUser, system, group, user,
            admUnit, notificacoes, checkSelected, filtroPorUsuario, selecionados, body = $('body')[0];

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
            accordion();

        }

        /**
         * Pega as referencias das classes, id, etc do html
         */
        function getElementsHtml(){
            filtroModalSytem = document.getElementsByClassName('filtro-system');
            filtroModalUser = document.getElementsByClassName('filtro-user');
            user = document.getElementsByClassName('user-modal');
            system = document.getElementsByClassName('sist');
            group = document.getElementsByClassName('grup');
            admUnit = document.getElementsByClassName('admUnit');
            notificacoes = document.getElementsByClassName('notificacoes');
            checkSelected = document.getElementsByClassName('fa-check');
            filtroPorUsuario = document.getElementsByClassName('filtro-por-usuario');
            selecionados = document.getElementsByClassName('selecionados');

        }

        /**
         * Declara as variaveis utilizadas
         */
        function declareVariables(){

            getSystem();

            //variaveis de lista de filtros por sistema
            $scope.listGroups = [];
            $scope.listDREs = [];
            $scope.AdministrativeUnits = [];

            //variaveis de lista de filtros por usuários
            $scope.listCalendar = [];


            $scope.system = {
                systemType: [],
                Group:[],
                DREs: [],
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
         * Removendo a tela de load bloqueando e add a barra rolagem da tela
         */
        function removeLoad(){
            $scope.load = false;
            if(!$scope.modalOpen)
                angular.element(body).removeClass('hidden-body');
        }

        /**
         * Add tela de load bloqueando a tela td e remove a barra de rolagem da tela
         */
        function addLoad(){
            $scope.load = true;
            angular.element(body).addClass('hidden-body');
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

        /**
         * Remove registro de filtro selecionado
         * @param {Int} id - id da posição do registro dentro do objeto - $scope.filters.filters
         */
        $scope.removeFilterSelected = function __removeFilterSelected(id){
            $scope.filters.filters.splice(id, 1);
        };

        /**
         * Seleciona tipo da mensagem ex: baixa, média, alta ou urgente
         * @param {Event} e
         */
        $scope.selectMessageType = function __selectMessageType(e){

            var check = '<i class="fa fa-check" aria-hidden="true"></i>';
            angular.element(checkSelected).remove();
            angular.element(e.currentTarget).append(check);
            $scope.filters.messageType = angular.element(e.currentTarget).text();
        };

        /**
         * obre modal de filtros por tipo de usuário
         * @param {Event} e
         */
        $scope.openFilterTypeUser = function __openFilterTypeUser(e){
            if($scope.User.UserType) {
                getCalendar();
                angular.element(filtroPorUsuario).css('display', 'block');
                angular.element(user).css('display', 'none');
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
            $scope.modalOpen = true;
            angular.element(body).addClass('hidden-body');
            angular.element(filtroModalUser).addClass('abre');
            angular.element(user).css('display', 'block');
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
                $scope.modalOpen = true;
                angular.element(filtroModalSytem).addClass('abre');
                angular.element(system).addClass('aparece').removeClass('some');
                angular.element(group).addClass('some').removeClass('aparece');
                angular.element(admUnit).addClass('some').removeClass('aparece');
            }else{
                toastr.warning("Não existe uma lista de sistemas cadastrada!");
            }
        };

        /**
         *
         * @param e
         * @param {Int} - idModal
         */
        $scope.nextFilter = function __nextFilter(e, idModal) {
            if (idModal == 2){
                getGroups();
            }else if (idModal == 3 ){
                getAdministrativeUnits();
            }

        };

        /*--------------------------------------FILTROS POR SISTEMA----------------------------------------*/

        /**
         * busca a lista de sistema
         */
        function getSystem(){

            HttpServices.getListSystem(function(data){
                $scope.listSystem = data;
                removeLoad();
            });
        }

        /**
         * Busca os grupos do sistema selecionado
         */
        function getGroups(){
            addLoad();
            HttpServices.getListGroups($scope.system.systemType.Id,
                function(data){
                    $scope.listGroups = data;
                    removeLoad()

                    if(data.length > 0) {
                        angular.element(system).addClass('some').removeClass('aparece');
                        angular.element(group).removeClass('some').addClass('aparece');
                        angular.element(admUnit).addClass('some').removeClass('aparece');
                    }

                });
        }

        /**
         * Busca as unidades administrativas
         */
        function getAdministrativeUnits(){
            addLoad();
            HttpServices.getListAdministrativeUnits( $scope.system.Group.Id,
                function(data){
                    $scope.AdministrativeUnits = data;
                    removeLoad();
                    if(data.length > 0) {
                        angular.element(system).addClass('some').removeClass('aparece');
                        angular.element(group).addClass('some').removeClass('aparece');
                        angular.element(admUnit).removeClass('some').addClass('aparece');
                    }
                });
        }

        /*--------------------------------------FILTROS POR USUÁRIO----------------------------------------*/

        function getCalendar(){
            addLoad();
            HttpServices.getListCalendar(function(data){
                $scope.listCalendar = data;
                removeLoad();
            });
        }

        /*--------------------------------------FIM DOS FILTROS POR USUÁRIO----------------------------------------*/

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
         * @param {Object} arr - arry do filtro
         * @param {Object}obj - opção seleciona
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

            $scope.modalOpen = false;
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
        $scope.emitFilters = function __emitFilters(e, isfilter, type){

            var arr = $scope.filters.filters;

            for(var index in arr) {
                if (angular.equals(isfilter, arr[index][type])){
                    //toastr.warning("Você já enviou esse filtro!");
                    $scope.closeModal(null, "system");
                    return;
                }
            }

            $scope.filters.filters.push(angular.copy($scope.system));
            $scope.closeModal(null, "system");

        };

        /**
         *
         * @param e
         */
        $scope.notificationMenu = function __notificationMenu(e){
            angular.element(notificacoes).toggleClass('abre');
        };

        function accordion(){

            var i, acc = document.getElementsByClassName("accordion");
            for (i = 0; i < acc.length; i++) {
                acc[i].onclick = function(){
                    /* Toggle between adding and removing the "active" class,
                     to highlight the button that controls the panel */
                    this.classList.toggle("active");

                    /* Toggle between hiding and showing the active panel */
                    var panel = this.nextElementSibling;
                    if (panel.style.display === "block") {
                        panel.style.display = "none";
                    } else if(angular.element(panel).children().length > 0) {
                        panel.style.display = "block";
                    }else{
                        toastr.warning("Nem um filtro foi selecionado!");
                    }
                }
            }

        }

        /**
         * Valida se tem usuário logado no sistema
         */
        $util.getUserToken(function(user){
            addLoad();
            if(user)initialize();
        });
    }

})(angular);
