/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {

    'use strict';

    angular
        .module('appNotification')
        .controller("RegisterController", RegisterController);

    //Injectors
    RegisterController.$inject = ['$scope', 'toastr', '$util', 'HttpServices', '$window'];

    /**
     * @namespace RegisterController
     * @desc Controller da página Register
     * @memberOf Controller
     */
    function RegisterController($scope, toastr, $util, HttpServices, $window) {

        $scope.load = true;
        $scope.modalOpen = false;
        $scope.redirect = false;
        var body = $('body')[0];

        /**
         * Contructor
         */
        function initialize() {

            $scope.filters = {
                filters:[],
                sendersName: "",
                messageType: "",
                sendDate: "",
                expirationDate: "",
                message: "",
                title: ""
            };

            $scope.showTypeFilter ={
                typeVision: true,
                typeSystem: false,
                typeUser: false
            };

            $scope.typeFilter = {
                system: 'system',
                group: 'group',
                dre: 'dre',
                school: 'school'
            };

            $scope.listVisionSystem = [];
            $scope.VisionSystem = window.sessionStorage.visionSelected ? JSON.parse(atob($window.sessionStorage.visionSelected)) :  [];
            $scope.redirect = $window.sessionStorage.redirect == "false" ? false : true;

            new plgnotify({
                ws: {
                  url: Config.URL_SIGGNALR
                }
            });

            declareVariables();
            startRedactor();
            accordion();

            //ve se o usúario já escolheu umtipo de grupo
            if($scope.VisionSystem.length == 0) {
                getVisionSystem();
            }else{
                $scope.showTypeFilter.typeVision = false;
                removeLoad();
            }
        }

        /**
         * Declara as variaveis utilizadas
         */
        function declareVariables(){

            $scope.showFilter ={
                showSystem: false,
                showGroup: false,
                showDRE: false,
                showShool: false
            };

            $scope.limitCharRedactor = 300;
            $scope.listSystem = [];

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
            if(!$scope.modalOpen)angular.element(body).removeClass('hidden-body');
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
                //lang: 'pt_br',
                limiter: $scope.limitCharRedactor, // number of characters
                plugins: ['limiter']
            });

            //removendo botões não urilizados
            $(".re-format").remove();
            $(".re-italic").remove();
            $(".re-deleted").remove();
            $(".re-horizontalrule").remove();
            $(".redactor-dropdown-outdent").remove();
            $(".redactor-dropdown-indent").remove();

            $(".redactor-toolbar-link-dropdown").on('click', function(){
                $(".redactor-dropdown-outdent").remove();
                $(".redactor-dropdown-indent").remove();
                $(".redactor-dropdown-indent").text('Lista desordenada');
                $(".redactor-dropdown-unorderedlist").text('Lista desordenada');
                $(".redactor-dropdown-orderedlist").text('Lista ordenada');
            });


            //limita a quantidade de  caracteras usando cltr+v
            //document.getElementById('redactor-uuid-0').onpaste = function(e){return false;}
            document.getElementById('redactor-uuid-0').addEventListener('keyup', function(e){

                var element = $(this);
                var text = element.text();

                //não deixa inserir mais nem um caracter a mais do limite
                if(text.length == ($scope.limitCharRedactor + 1)) { return; }

                //se o cltr+v for mair que o limite de caracter aceito
                if(text.length > $scope.limitCharRedactor && e.keyCode == 17){
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
         *
         * @param typeVision
         */
        $scope.selectedVisionGroupSystem = function __selectedVisionGroupSystem(typeVision){
            $scope.VisionSystem = typeVision;
            $window.sessionStorage.visionSelected = btoa(JSON.stringify(typeVision));
        };

        /**
         *
         */
        $scope.closeVisionGroupSystem = function __closeVisionGroupSystem(){
            closeModal();
            $scope.showTypeFilter.typeVision = false;
        };

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

            var p = document.getElementsByClassName('type-message'),
                checkSelected = document.getElementsByClassName('fa-check'),
                check = '<i class="fa fa-check" aria-hidden="true"></i>';

            angular.element(p).addClass('off');
            angular.element(checkSelected).remove();
            angular.element(e.currentTarget).append(check).removeClass('off');
            $scope.filters.messageType = angular.element(e.currentTarget).text();
        };

        /**
         * obre modal de filtros por tipo de usuário
         * @param {Event} e
         */
        $scope.openFilterTypeUser = function __openFilterTypeUser(e){
            if($scope.User.UserType) {
                getCalendar();
            }else{
                toastr.warning("Selecione um tipo de usuário!");
            }
        };

        /**
         * Abre a modal de filtros por usuários
         * @param {Event} e
         */
        $scope.openModalUser = function __openModalUser(e){

        };

        /**
         * Abre a modal de filtros por sistemas
         */
        $scope.openModalSystem = function __openModalSystem(){
            getSystem();
        };

        function openModal(){
            $scope.modalOpen = true;
            angular.element(body).addClass('hidden-body');
        }

        function closeModal(){
            $scope.modalOpen = false;
            angular.element(body).removeClass('hidden-body');
        }

        /**
         *
         * @param e
         * @param {Int} - idModal
         */
        $scope.nextFilterSytem = function __nextFilterSytem(idModal) {
            if (idModal == 'system'){
                getGroups();
            }else if (idModal == 'group' ){
                getDREs();
            }else if (idModal == 'dre' ){
                getAdministrativeUnits();
            }

        };

        $scope.checkVisionUser = function checkVisionUser( arr, type){

            if( arr && arr.Name && ($scope.VisionSystem.VisionId != type) ){
                return true;
            }else{
                return false;
            }

        }

        /*--------------------------------------FILTROS POR SISTEMA----------------------------------------*/

        /**
         * busca a lista de sistema
         */
        function getVisionSystem(){

            HttpServices.getListVisionSystem(function(data){
                $scope.listVisionSystem = data;
                openModal();
                removeLoad();
            });
        }

        /**
         * busca a lista de sistema
         */
        function getSystem(){

            HttpServices.getListSystem($scope.VisionSystem.Id, function(data){
                $scope.listSystem = data;

                if($scope.listSystem.length > 1) {
                    $scope.showFilter.showSystem = true;
                    $scope.showTypeFilter.typeSystem = true;
                    openModal();
                }else{
                    toastr.warning("Não existe uma lista de sistemas cadastrada!");
                }
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

                    if($scope.listGroups.length > 1) {
                        $scope.showFilter.showSystem = false;
                        $scope.showFilter.showGroup = true;
                    }else{
                        toastr.warning("Não existe uma lista de grupo cadastrada!");
                    }
                    removeLoad();

                });
        }

        function getDREs(){
            addLoad();
            HttpServices.getListSchoolSuperior($scope.VisionSystem.Id,
                function(data){
                    $scope.listDREs = data;

                    if($scope.listDREs.length > 1) {
                        $scope.showFilter.showGroup = false;
                        $scope.showFilter.showDRE = true;
                    }else{
                        toastr.warning("Não existe uma lista de DREs cadastrada!");
                    }
                    removeLoad();
                });
        }

        /**
         * Busca as unidades administrativas
         */
        function getAdministrativeUnits(){
            addLoad();

            var params = {
                schoolSuperior: $scope.system.DREs.Id,
                groupSid: $scope.VisionSystem.Id
            };

            HttpServices.getListSchool( params,
                function(data){
                    $scope.AdministrativeUnits = data;
                    if($scope.AdministrativeUnits.length > 1) {
                        $scope.showFilter.showDRE = false;
                        openNextFilterModal(admUnit);
                    }else{
                        toastr.warning("Não existe nem uma lista de unidades administrativas cadastrada!");
                    }
                    removeLoad();
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

        function getSchoolSuperior(){
            addLoad();
            HttpServices.getListSchoolSuperior(function(data){
                $scope.listCalendar = data;
                removeLoad();
            });
        }

        function getSchoolClassification(){
            addLoad();
            HttpServices.getListSchoolClassification(id, function(data){
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
            }else if(type == 'dre'){
                $scope.system.DREs = obj;
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
                $scope.showTypeFilter.typeSystem = false
            }else if(type == "user"){
                $scope.showTypeFilter.typeUser = false
            }

            closeModal();
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

        addLoad();
        /**
         * Valida se tem usuário logado no sistema
         */
        $util.getUserToken(function(user){
            if(user)initialize();
        });
    }

})(angular);
