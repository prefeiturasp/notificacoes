/**
 * Created by everton.ferreira on 09/06/2017.
 */
(function (angular) {

    'use strict';

    angular
        .module('appNotification')
        .controller("RegisterController", RegisterController);

    //Injectors
    RegisterController.$inject = ['$scope', 'toastr', '$util', 'HttpServices', '$window', '$timeout'];

    /**
     * @namespace RegisterController
     * @desc Controller da página Register
     * @memberOf Controller
     */
    function RegisterController($scope, toastr, $util, HttpServices, $window, $timeout) {

        $scope.load = true;
        $scope.modalOpen = false;
        $scope.redirect = false;
        var body = $('body')[0], redactor;
        $scope.VisionSystem = window.sessionStorage.visionSelected ? JSON.parse(atob($window.sessionStorage.visionSelected)) :  [];

        /**
         * Contructor
         */
        function initialize() {

            $scope.filters = {
                Recipient:[],
                SenderName: null,
                MessageType: null,
                DateStartNotification: null,
                DateEndNotification: null,
                Message: "",
                Title: null
            };

            $scope.listRecipient = [];

            $scope.showTypeFilter ={
                typeVision: false,
                typeSystem: false,
                typeUser: false,
                typeAccordionSys: false,
                typeAccordionUser: false,
                typeModalTypeUser: false
            };

            $scope.typeFilter = {
                system: 'system',
                group: 'group',
                dre: 'dre',
                school: 'school'
            };

            $scope.listVisionSystem = [];
            $scope.redirect = $window.sessionStorage.redirect == "false" ? false : true;

            new plgnotify({
                ws: {
                  url: Config.URL_SIGGNALR
                }
            });

            //ve se o usúario já escolheu umtipo de grupo
            if($scope.VisionSystem.length == 0) {
                getVisionSystem();
            }else{
                $scope.showTypeFilter.typeVision = false;
                $timeout(function(){
                    declareVariables();
                    startRedactor();
                },0);
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

            //variaveis de lista de filtros por sistema
            $scope.listSystem = [];
            $scope.listGroups = [];
            $scope.listDREs = [];
            $scope.AdministrativeUnits = [];

            //variaveis de lista de filtros por usuários
            $scope.listCalendar = [];
            $scope.listCorse = [];
            $scope.YearSelected = null;
            $scope.typeUser = null;

            $scope.SystemRecipientClone = {
                SystemId: null,
                GroupId: null,
                AdministrativeUnitSuperior: null,
                AdministrativeUnit: null
            };

            $scope.SystemRecipient = {
                SystemId: [],
                GroupId: [],
                AdministrativeUnitSuperior: [],
                AdministrativeUnit: []
            };

            $scope.TeacherRecipient = {
                SchoolSuperior:[],
                SchoolClassification:[],
                School:[],
                Position:[],
                Course:[],
                CoursePeriod:[],
                Discipline:[],
                Team:[]
            };

            $scope.ContributorRecipient = {
                SchoolSuperior:[],
                SchoolClassification:[],
                School:[],
                Position:[]
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

            redactor = $(".redactor-layer-img-edit");


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
            startRedactor();
            closeModal();
            $scope.showTypeFilter.typeVision = false;
        };

        /**
         * Remove registro de filtro selecionado
         * @param {Int} id - id da posição do registro dentro do objeto - $scope.filters.filters
         */
        $scope.removeFilterSelected = function __removeFilterSelected(id){
            $scope.filters.Recipient.splice(id, 1);
            $scope.listRecipient.splice(id, 1);
        };

        /**
         * Seleciona tipo da mensagem ex: baixa, média, alta ou urgente
         * @param {Event} e
         */
        $scope.selectMessageType = function __selectMessageType(e, Id){

            var p = document.getElementsByClassName('type-message'),
                checkSelected = document.getElementsByClassName('fa-check'),
                check = '<i class="fa fa-check" aria-hidden="true"></i>';

            angular.element(p).addClass('off');
            angular.element(checkSelected).remove();
            angular.element(e.currentTarget).append(check).removeClass('off');
            $scope.filters.MessageType = Id;
        };

        $scope.selectedTtypeUser = function __selectedTtypeUser(type){
            $scope.typeUser = type;
        };

        /**
         * obre modal de filtros por tipo de usuário
         * @param {Event} e
         */
        $scope.openFilterTypeUser = function __openFilterTypeUser(e){
            if($scope.typeUser) {
                $scope.showTypeFilter.typeModalTypeUser = false;
            }else{
                toastr.warning("Selecione um tipo de usuário!");
            }
        };

        /**
         * Abre a modal de filtros por usuários
         * @param {Event} e
         */
        $scope.openModalUser = function __openModalUser(e){
            getCalendar();
            $scope.showTypeFilter.typeUser = true;
            $scope.showTypeFilter.typeModalTypeUser = true;

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

        $scope.checkVisionUser = function checkVisionUser(arr, type){

            if( arr && arr.length > 0 && ($scope.VisionSystem.VisionId != type) ){
                return true;
            }else{
                return false;
            }
        };

        /*--------------------------------------FILTROS POR SISTEMA----------------------------------------*/

        /**
         * busca a lista de sistema
         */
        function getVisionSystem(){

            HttpServices.getListVisionSystem(function(data){
                $scope.listVisionSystem = data;
                if(data.length > 1) {

                    $scope.showTypeFilter.typeVision = true;
                    declareVariables();
                    getCalendar();
                    removeLoad();
                    openModal();
                }else{
                    $scope.VisionSystem = $scope.listVisionSystem[0]
                }
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
                   // getDREs();
                }else{
                    toastr.warning("Não existe uma lista de sistemas cadastrada!");
                }
            });
        }

        /**
         * Busca os grupos do sistema selecionado
         */
        function getGroups(){
            addLoad();
            HttpServices.getListGroups($scope.SystemRecipient.SystemId[0],
                function(data){
                    $scope.listGroups = data;

                    if($scope.listGroups && $scope.listGroups.length > 1) {
                        $scope.showFilter.showSystem = false;
                        $scope.showFilter.showGroup = true;
                    }else if($scope.listGroups && $scope.listDREs.listGroups ==  0){
                        toastr.warning("Não existe uma lista de grupo cadastrada!");
                    }
                    removeLoad();

                });
        }

        function getDREs(){
            HttpServices.getListSchoolSuperior($scope.VisionSystem.Id,
                function(data){
                    $scope.listDREs = data;

                    //if($scope.listDREs && $scope.listDREs.length > 1) {
                    //    $scope.showFilter.showGroup = false;
                    //    $scope.showFilter.showDRE = true;
                    //}else
                    if($scope.listDREs && $scope.listDREs.length ==  0){
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
                schoolSuperior: $scope.SystemRecipient.AdministrativeUnitSuperior[0],
                groupSid: $scope.VisionSystem.Id
            };

            HttpServices.getListSchool( params,
                function(data){
                    $scope.AdministrativeUnits = data;
                    if($scope.AdministrativeUnits && $scope.AdministrativeUnits.length > 0) {
                        $scope.showFilter.showDRE = false;
                        $scope.showFilter.showShool = true;
                    }else if($scope.AdministrativeUnits && $scope.AdministrativeUnits.listGroups ==  0){
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

                if($scope.listCalendar && $scope.listCalendar.length ==  0){
                    toastr.warning("Não existe uma lista de de datas!");
                }else{
                    $scope.YearSelected = $scope.listCalendar[$scope.listCalendar.length - 1];
                    getCorse();
                }



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

        function getCorse(){
            addLoad();
            HttpServices.getListCorse($scope.YearSelected.Name, function(data){
                $scope.listCorse = data;
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
                $scope.SystemRecipient.SystemId.push(obj.Id);
                $scope.SystemRecipientClone.SystemId = obj;
            }else if(type =='group') {
                $scope.SystemRecipient.GroupId.push(obj.Id);
                $scope.SystemRecipientClone.GroupId = obj;
            }else if(type == 'dre'){
                $scope.SystemRecipient.AdministrativeUnitSuperior.push(obj.Id);
                $scope.SystemRecipientClone.AdministrativeUnitSuperior = obj;
            }else{
                $scope.SystemRecipient.AdministrativeUnit.push(obj.Id);
                $scope.SystemRecipientClone.AdministrativeUnit = obj;
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

        $scope.sendNotification = function __sendNotification(){

            if(!$scope.filters.SenderName){
                toastr.warning("Digite seu nome!");
                return;
            }else if($scope.filters.Recipient.length == 0){
                toastr.warning("Não existe filtros selecionados!");
                return;
            }else if(!$scope.filters.MessageType){
                toastr.warning("Selecione o tipo da mensagem!");
                return;
            }else if(!$scope.filters.DateStartNotification){
                toastr.warning("Informe a data de envio da notificação!");
                return;
            }else if(!$scope.filters.DateEndNotification){
                toastr.warning("Informe a data de validade da notificação!");
                return;
            }else if(!$scope.filters.Title){
                toastr.warning("Digite o titulo da notificação!");
                return;
            }else if(getMessage()){
                toastr.warning("Digite a mensagem!");
                return;
            }else{
                saveNotification();
            }

        };

        function getMessage(){
            var redactorChildren = $(redactor.children());
            if(redactorChildren.text().length > 0){
                redactorChildren.each(function( index ) {
                    $scope.filters.Message += '<p>' + $( this ).html() + '</p>'
                });
                return false;
            }else{
                return true;
            }

        }

        function saveNotification(){

            addLoad();
            HttpServices.postSave($scope.filters, function(data){
                console.log(data);
                removeLoad();
            });
        }

        /**
         *
         * @param {Event} e -
         * @param {Object} isfilter - usado para validar  se foi selecionado ao menos um tipo filtro da tela
         */
        $scope.emitFilters = function __emitFilters(e, isfilter, type){

            var arr = $scope.filters.Recipient;

            for(var index in arr) {
                if (angular.equals(isfilter, arr[index][type])){
                    //toastr.warning("Você já enviou esse filtro!");
                    $scope.closeModal(null, "system");
                    return;
                }
            }
            $scope.showTypeFilter.typeAccordionSys = true;
            $scope.filters.Recipient.push(angular.copy($scope.SystemRecipient));
            $scope.listRecipient.push(angular.copy($scope.SystemRecipientClone));
            $scope.closeModal(null, "system");

        };

        $scope.openCloseAccordion = function __openCloseAccordion(typeAccordion){

            var i, label, flag = false, max = $scope.filters.Recipient.length;

            typeAccordion == 'typeAccordionSys' ? label = 'sistema' :label = 'usuário'

            for(i = 0; i < max; i++){
               if($scope.filters.Recipient[i].SystemId && typeAccordion == 'typeAccordionSys'){
                   flag = true;
               }else if($scope.filters.Recipient[i] && typeAccordion == 'typeAccordionUser'){
                   flag = true;
               }
            }

            if(!flag) {
                toastr.warning("Nem um filtro por "+ label +" foi selecionado!");
            }else{
                $scope.showTypeFilter[typeAccordion] = !$scope.showTypeFilter[typeAccordion];
            }
        };

        addLoad();
        /**
         * Valida se tem usuário logado no sistema
         */
        $util.getUserToken(function(user){
            if(user)initialize();
        });
    }

})(angular);
