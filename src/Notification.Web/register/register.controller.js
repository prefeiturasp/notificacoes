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
        $scope.blockSite = true;
        var body = $('body')[0], redactor;
        $scope.VisionSystem = window.sessionStorage.visionSelected ? JSON.parse(atob($window.sessionStorage.visionSelected)) :  [];
        $scope.listVisionSystem =  window.sessionStorage.listVision ?  JSON.parse(atob($window.sessionStorage.listVision)) : [];

        /**
         * Contructor
         */
        function initialize() {

            $scope.showTypeFilter ={
                typeVision: false,
                typeSystem: false,
                typeUser: false,
                typeViewRegisters: false,
                typeAccordionSys: false,
                typeAccordionUser: false,
                typeUserTeacher: false,
                typeUserContributor: false,
                typeModalTypeUser: false
            };

            $scope.dateOptions = {
                dateFormat: 'dd.mm.yy'
            };

            $scope.typeUser = null;
            $scope.listCalendar = [];
            $scope.redirect = $window.sessionStorage.redirect == "false" ? false : true;

            creatteFilters();

            //ve se o usúario já escolheu umtipo de grupo
            if($scope.VisionSystem.length == 0) {
                getVisionSystem();
            }else{
                $scope.showTypeFilter.typeVision = false;
                $timeout(function(){
                    getUserName();
                    startSite();
                },0);
                $scope.load = false;
            }
        }

        function startSite(){
            $scope.blockSite = false;
            declareVariables();
            getCalendar();
            getTimeStamp();

            $timeout(function() {
                startRedactor();
            },0);

            createPluginNotification();
        }

        function creatteFilters(){

            $scope.typeFilter = {
                system: 'system',
                group: 'group',
                dre: 'dre',
                school: 'school'
            };

            $scope.filters = {
                Id: null,
                Recipient: {},
                SenderName: null,
                MessageType: null,
                DateStartNotification: null,
                DateEndNotification: null,
                Message: "",
                Title: null
            };

            $scope.listDREs = [];
            $scope.listRecipient = [];
            $scope.listRecipientUser = [];

        }

        function createPluginNotification(){
            new plgnotify({
                url: Config.API,
                userId: $util.getUserId(),
                groupSid: $scope.VisionSystem.Id,
                tokenType: $util.getKey() + " ",
                token: $util.getAccessToken(),
                ws: {
                    url: Config.URL_SIGGNALR
                }
            });
        }

        /**
         * Declara as variaveis utilizadas
         */
        function declareVariables(){

            $scope.showTypeFilter.typeUserTeacher = false;
            $scope.showTypeFilter.typeUserContributor = false;
            $scope.showTypeFilter.typeModalTypeUser = false;

            $scope.registresSelected = [];

            $scope.showFilter ={
                showSystem: false,
                showGroup: false,
                showDRE: false,
                showShool: false
            };

            $scope.change = {
                checkedDRE: true,
                checkedClassification: true,
                checkedSchool: true,
                checkedPosition: true,
                checkedCourse: true,
                checkedCoursePeriod: true,
                checkedDiscipline: true,
                checkedTeam: true
            };

            $scope.limitCharRedactor = 1500;

            //variaveis de lista de filtros por sistema
            $scope.listSystem = [];
            $scope.listGroups = [];
            $scope.AdministrativeUnits = [];

            //variaveis de lista de filtros por usuários
            $scope.listCorse = [];
            $scope.listPosition = [];
            $scope.listSchool = [];
            $scope.listCoursePeriod = [];
            $scope.listDiscipline = [];
            $scope.listTeam = [];
            $scope.listListSchoolClassification = [];

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
                Calendar: $scope.listCalendar[$scope.listCalendar.length - 1],
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
                Calendar: $scope.listCalendar[$scope.listCalendar.length - 1],
                SchoolSuperior:[],
                SchoolClassification:[],
                School:[],
                Position:[]
            };

            $scope.TeacherRecipientClone = {
                userType: null,
                Calendar: [],
                SchoolSuperior:[],
                SchoolClassification:[],
                School:[],
                Position:[],
                Course:[],
                CoursePeriod:[],
                Discipline:[],
                Team:[]
            };

            $scope.ContributorRecipientClone = {
                userType: null,
                Calendar: [],
                SchoolSuperior:[],
                SchoolClassification:[],
                School:[],
                Position:[]
            };

        }

        /**
         * Instancia o elemento redactor na tela
         */
        function startRedactor(){
            //instanciando o redactor
            $("#content").redactor({
                lang: 'pt_br',
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
            });

            redactor = $(".redactor-layer-img-edit");

            try {
                //limita a quantidade de  caracteras usando cltr+v
                //document.getElementById('redactor-uuid-0').onpaste = function(e){return false;}
                document.getElementById('redactor-uuid-0').addEventListener('keyup', function (e) {

                    var element = $(this);
                    var text = element.text();

                    //não deixa inserir mais nem um caracter a mais do limite
                    if (text.length == ($scope.limitCharRedactor + 1)) {
                        return;
                    }

                    //se o cltr+v for mair que o limite de caracter aceito
                    if (text.length > $scope.limitCharRedactor && e.keyCode == 17) {
                        //pega apenas a string com a quantida de limite de caracteres
                        text = text.substr(0, $scope.limitCharRedactor);
                        //limpa o campo de texto
                        element.text("");
                        //add o texto dentro do limite de carateres aceito
                        element.append('<p>' + text + '</p>');
                    }

                });
            }catch(e){}
        }

        function getUserName(){
            //HttpServices.getUserName($scope.VisionSystem.Id, function (data) { $scope.userName = data; });
        }

        /**
         *
         * @param typeVision
         */
        $scope.selectedVisionGroupSystem = function __selectedVisionGroupSystem(typeVision){
            $scope.VisionSystem = typeVision;
        };

        /**
         *
         */
        $scope.closeVisionGroupSystem = function __closeVisionGroupSystem(){

            $window.sessionStorage.visionSelected = btoa(JSON.stringify($scope.VisionSystem));
            getUserName();

            closeModal();
            $scope.showTypeFilter.typeVision = false;
            window.sessionStorage.visionSelected = btoa(JSON.stringify($scope.VisionSystem));
        };

        /**
         * Remove registro de filtro selecionado
         * @param {Int} id - id da posição do registro dentro do objeto - $scope.filters.filters
         */
        $scope.removeFilterSelected = function __removeFilterSelected(type, id){

            $scope.filters.Recipient[type].splice(id, 1);

            if(type == 'SystemRecipient') {
                $scope.listRecipient.splice(id, 1);

                if ($scope.listRecipient.length == 0) {
                    $scope.showTypeFilter.typeAccordionSys = false;
                }

            }else{
                $scope.listRecipientUser.splice(id, 1);

                if($scope.listRecipientUser.length == 0){
                    $scope.showTypeFilter.typeAccordionUser = false;
                }
            }


        };

        /**
         * Seleciona tipo da mensagem ex: baixa, média, alta ou urgente
         * @param {Event} e
         */
        $scope.selectMessageType = function __selectMessageType(e, Id){

            removeCheckInTypeMessage();
            var check = '<i class="fa fa-check" aria-hidden="true"></i>';
            angular.element(e.currentTarget).append(check).removeClass('off');
            $scope.filters.MessageType = Id;
        };

        function removeCheckInTypeMessage(){

            $scope.filters.MessageType = "";
            var p = document.getElementsByClassName('type-message'),
                checkSelected = document.getElementsByClassName('fa-check');

            angular.element(p).addClass('off');
            angular.element(checkSelected).remove();
        }

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
                if( $scope.typeUser == 'Docente' ) $scope.showTypeFilter.typeUserTeacher = true;
                else $scope.showTypeFilter.typeUserContributor = true;
            }else{
                toastr.warning("Selecione um tipo de usuário!");
            }
        };

        /**
         * Abre a modal de filtros por usuários
         * @param {Event} e
         */
        $scope.openModalUser = function __openModalUser(e){

            if(!$scope.blockSite) {
                $scope.showTypeFilter.typeUser = true;
                $scope.showTypeFilter.typeModalTypeUser = true;
                angular.element(body).addClass('hidden-body');
            }
        };

        /**
         * Abre a modal de filtros por sistemas
         */
        $scope.openModalSystem = function __openModalSystem(){
            if(!$scope.blockSite) getSystem();
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

        $scope.checkVisionUser = function checkVisionUser(id, type, arr){

            if(arr > 0) {

                if (id != 4 && id != type) {
                    return true;
                } else {
                    return false;
                }
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
                if( data != null && data.length > 0) {
                    $window.sessionStorage.listVision = btoa(JSON.stringify(data));
                    if (data.length > 1) {
                        $scope.showTypeFilter.typeVision = true;
                        openModal();
                    } else {
                        $scope.VisionSystem = $scope.listVisionSystem[0];
                        $window.sessionStorage.visionSelected = btoa(JSON.stringify($scope.VisionSystem));
                    }
                    $scope.load = false;
                    startSite();

                }else{
                    $scope.load = false;
                }
            });
        }

        /**
         * busca a lista de sistema
         */
        function getSystem(){
            $scope.load = true;
            HttpServices.getListSystem($scope.VisionSystem.Id, function(data){
                $scope.listSystem = data;
                $scope.load = false;
                if(data != null) {
                    if ($scope.listSystem.length > 0) {
                        $scope.showFilter.showSystem = true;
                        $scope.showTypeFilter.typeSystem = true;
                        openModal();
                    } else {
                        toastr.warning("Não existe uma lista de sistemas cadastrada!");
                    }
                }
            });
        }

        /**
         * Busca os grupos do sistema selecionado
         */
        function getGroups(){
            $scope.load = true;
            HttpServices.getListGroups($scope.SystemRecipient.SystemId[0],
                function(data){
                    $scope.listGroups = data;

                    if($scope.listGroups && $scope.listGroups.length > 0) {
                        $scope.showFilter.showSystem = false;
                        $scope.showFilter.showGroup = true;
                    }else if($scope.listGroups && $scope.listDREs.listGroups ==  0){
                        toastr.warning("Não existe uma lista de grupo cadastrada!");
                    }
                    $scope.load = false;

                });
        }

        function getDREs(){
            $scope.load = true;
            HttpServices.getListSchoolSuperior($scope.VisionSystem.Id,
                function(data){
                    $scope.listDREs = data;

                    if($scope.listDREs && $scope.listDREs.length > 0) {
                        $scope.showFilter.showGroup = false;
                        $scope.showFilter.showDRE = true;
                    }else if($scope.listDREs && $scope.listDREs.length ==  0){
                        toastr.warning("Não existe uma lista de DREs cadastrada!");
                    }
                    $scope.load = false;
                });
        }

        /**
         * Busca as unidades administrativas
         */
        function getAdministrativeUnits(){
            $scope.load = true;

            var params = {
                schoolSuperior: $scope.SystemRecipient.AdministrativeUnitSuperior[0],
                groupSid: $scope.VisionSystem.Id
            };

            HttpServices.getListUnitAdministrative(params,
                function(data){
                    $scope.AdministrativeUnits = data;
                    if($scope.AdministrativeUnits && $scope.AdministrativeUnits.length > 0) {
                        $scope.showFilter.showDRE = false;
                        $scope.showFilter.showShool = true;
                    }else if($scope.AdministrativeUnits && $scope.AdministrativeUnits.listGroups ==  0){
                        toastr.warning("Não existe nem uma lista de unidades administrativas cadastrada!");
                    }
                    $scope.load = false;
                });
        }

        /*--------------------------------------FILTROS POR USUÁRIO----------------------------------------*/

        function getCalendar(){
            $scope.load = true;
            HttpServices.getListCalendar(function(data){
                $scope.listCalendar = data;

                if($scope.listCalendar && $scope.listCalendar.length ==  0){
                    toastr.warning("Não existe uma lista de de datas!");
                }else{
                    $scope.TeacherRecipient.Calendar = $scope.listCalendar[$scope.listCalendar.length - 1];
                    $scope.ContributorRecipient.Calendar = $scope.listCalendar[$scope.listCalendar.length - 1];
                }

                $scope.load = false;
            });
        }

        $scope.getSchoolClassification = function __getSchoolClassification(SchoolSuperior){

            $scope.change.checkedClassification = !$scope.change.checkedClassification;

            if(!$scope.change.checkedClassification) {
                $scope.load = true;
                var params = {
                    groupSid: $scope.VisionSystem.Id,
                    SchoolSuperior: SchoolSuperior
                };

                HttpServices.getListSchoolClassification(params, function (data) {
                    $scope.listListSchoolClassification = data;
                    $scope.load = false;
                });
            }else if($scope.change.checkedClassification){
                $scope.TeacherRecipient.SchoolClassification = [];
                $scope.ContributorRecipient.SchoolClassification = [];
            }
        };

        $scope.getCorse =  function getCorse(){
            $scope.change.checkedCourse = !$scope.change.checkedCourse;
            if(!$scope.change.checkedCourse) {
                $scope.load = true;
                HttpServices.getListCorse($scope.TeacherRecipient.Calendar.Name, function (data) {
                    $scope.listCorse = data;
                    $scope.load = false;
                });
            }else if($scope.change.checkedCourse){
                $scope.TeacherRecipient.Course = [];
                $scope.ContributorRecipient.Course = [];
            }
        };

        $scope.getPosition = function __getPosition(){
            $scope.change.checkedPosition = !$scope.change.checkedPosition;

            if(!$scope.change.checkedPosition) {
                $scope.load = true;
                HttpServices.getListPosition(function (data) {
                    $scope.listPosition = data;
                    $scope.load = false;
                });
            }else if($scope.change.checkedPosition){
                $scope.TeacherRecipient.Position = [];
                $scope.ContributorRecipient.Position = [];
            }
        };

        $scope.getSchool = function __getSchool(SchoolSuperior, SchoolClassification){

            $scope.change.checkedSchool = !$scope.change.checkedSchool;

            if(!$scope.change.checkedSchool) {

                var params = {
                    groupSid: $scope.VisionSystem.Id,
                    SchoolSuperior: SchoolSuperior,
                    schoolClassification: SchoolClassification
                };

                $scope.load = true;
                HttpServices.getListSchool(params, function (data) {
                    $scope.listSchool = data;
                    $scope.load = false;
                });
            }else if($scope.change.checkedDiscipline){
                $scope.TeacherRecipient.School = [];
                $scope.ContributorRecipient.School = [];
            }
        };

        $scope.getCoursePeriod = function __getCoursePeriod(){
            $scope.change.checkedCoursePeriod = !$scope.change.checkedCoursePeriod;

            if(!$scope.change.checkedCoursePeriod) {
                $scope.load = true;
                var params = {
                    calendarYear: $scope.TeacherRecipient.Calendar.Name,
                    courseId: $scope.TeacherRecipient.Course
                };

                HttpServices.getListCoursePeriod(params, function (data) {
                    $scope.listCoursePeriod = data;
                    $scope.load = false;
                });
            }else if($scope.change.checkedCoursePeriod){
                $scope.TeacherRecipient.CoursePeriod = [];
            }
        };

        $scope.getDiscipline = function __getDiscipline(){
            $scope.change.checkedDiscipline = !$scope.change.checkedDiscipline;

            if(!$scope.change.checkedDiscipline) {

                var params = {
                    calendarYear: $scope.TeacherRecipient.Calendar.Name,
                    courseId: $scope.TeacherRecipient.Course,
                    coursePeriodId: $scope.TeacherRecipient.CoursePeriod
                };

                $scope.load = true;
                HttpServices.getListDiscipline(params, function (data) {
                    $scope.listDiscipline = data;
                    $scope.load = false;
                });
            }else if($scope.change.checkedDiscipline){
                $scope.TeacherRecipient.Discipline = [];
            }
        };

        $scope.getTeam = function __getTeam(){

            if($scope.TeacherRecipient.School.length > 0) {

                if (!$scope.change.checkedTeam) {

                    var params = {
                        groupSid: $scope.VisionSystem.Id,
                        calendarYear: $scope.TeacherRecipient.Calendar.Name,
                        schoolSuperiorId: $scope.TeacherRecipient.SchoolSuperior,
                        schoolClassificationId: $scope.TeacherRecipient.SchoolClassification,
                        schoolId: $scope.TeacherRecipient.School,
                        courseId: $scope.TeacherRecipient.Course,
                        coursePeriodId: $scope.TeacherRecipient.CoursePeriod,
                        disciplineId: $scope.TeacherRecipient.Discipline
                    };

                    $scope.load = true;
                    HttpServices.getListTeam(params, function (data) {
                        $scope.listTeam = data;
                        $scope.load = false;
                    });
                } else if ($scope.change.checkedTeam) {
                    $scope.TeacherRecipient.Team = [];
                }
            }else{
                toastr.warning("Selecione ao menos uma escola!");
                $scope.change.checkedTeam = true;
            }
        };

        /*--------------------------------------FIM DOS FILTROS POR USUÁRIO----------------------------------------*/

        $scope.searchDREs = function __searchDREs(){
            $scope.change.checkedDRE = !$scope.change.checkedDRE;
            if(!$scope.change.checkedDRE) {
                getDREs();
            }else{
                $scope.ContributorRecipient.SchoolSuperior = [];
                $scope.TeacherRecipient.SchoolSuperior = [];
            }
        };

        $scope.checkDateSelected = function __checkDateSelected(type){

            var dateCurrent = new Date($scope.currentDate * 1000);
            var dateSelected = new Date($scope.filters[type]);

            var msDateA = Date.UTC(dateCurrent.getFullYear(), dateCurrent.getMonth()+1, dateCurrent.getDate());
            var msDateB = Date.UTC(dateSelected.getFullYear(), dateSelected.getMonth()+1, dateSelected.getDate());

            if (parseFloat(msDateA) > parseFloat(msDateB)) {
                toastr.warning("Data selecionada não pode ser menor que o data atual!");
                $scope.filters[type] = dateCurrent;
            }
        };

        /**
         *
         * @param type
         * @param obj
         */
        $scope.selectedSystemGroup = function __selectedSystemGroup(type, obj){

            if(type =='system') {
                $scope.SystemRecipient.SystemId = [];
                $scope.SystemRecipient.SystemId.push(obj.Id);
                $scope.SystemRecipientClone.SystemId = obj;
            }else if(type =='group') {
                $scope.SystemRecipient.GroupId = [];
                $scope.SystemRecipient.GroupId.push(obj.Id);
                $scope.SystemRecipientClone.GroupId = obj;
            }else if(type == 'dre'){
                $scope.SystemRecipient.AdministrativeUnitSuperior = [];
                $scope.SystemRecipient.AdministrativeUnitSuperior.push(obj.Id);
                $scope.SystemRecipientClone.AdministrativeUnitSuperior = obj;
            }else{
                $scope.SystemRecipient.AdministrativeUnit = [];
                $scope.SystemRecipient.AdministrativeUnit.push(obj.Id);
                $scope.SystemRecipientClone.AdministrativeUnit = obj;
            }
        };

        $scope.resetListSchool = function __resetListSchool(){
            $scope.change.checkedSchool = true;
            $scope.TeacherRecipient.School = [];
            $scope.TeacherRecipientClone.School = [];
            $scope.ContributorRecipient.School = [];
            $scope.ContributorRecipientClone.School = [];

            $scope.TeacherRecipient.Team = [];
            $scope.TeacherRecipientClone.Team = [];
            $scope.change.checkedTeam=true;
        };

        $scope.resetdListClassification = function __resetdListClassification(){
            $scope.change.checkedClassification = true;
            $scope.change.checkedSchool = true;

            $scope.TeacherRecipient.SchoolClassification = [];
            $scope.TeacherRecipientClone.SchoolClassification = [];

            $scope.TeacherRecipient.School = [];
            $scope.TeacherRecipientClone.School = [];

            $scope.ContributorRecipient.SchoolClassification = [];
            $scope.ContributorRecipientClone.SchoolClassification = [];

            $scope.ContributorRecipient.School = [];
            $scope.ContributorRecipientClone.School = [];

            $scope.TeacherRecipient.Team = [];
            $scope.TeacherRecipientClone.Team = [];
            $scope.change.checkedTeam=true;

        };

        /**
         * Reseta as variaveis de periodo, diciplina e turma, limpa as listas e deixado todas selecionadas de novo
         */
        $scope.resetListCoursePeriod = function __resetListCoursePeriod(){
            $scope.change.checkedCoursePeriod=true;
            $scope.change.checkedDiscipline=true;
            $scope.change.checkedTeam=true;
            $scope.TeacherRecipient.CoursePeriod = [];
            $scope.TeacherRecipientClone.CoursePeriod = [];
            $scope.TeacherRecipient.Discipline = [];
            $scope.TeacherRecipientClone.Discipline = [];
            $scope.TeacherRecipient.Team = [];
            $scope.TeacherRecipientClone.Team = [];
        };

        /**
         * Reseta as variaveis de diciplina e turma, limpa as listas e deixado todas selecionadas de novo
         */
        $scope.resetListDiscipline = function __resetListDiscipline(){
            $scope.change.checkedDiscipline=true;
            $scope.change.checkedTeam=true;
            $scope.TeacherRecipient.Discipline = [];
            $scope.TeacherRecipientClone.Discipline = [];
            $scope.TeacherRecipient.Team = [];
            $scope.TeacherRecipientClone.Team = [];
        };

        /**
         * Reseta as variaveis de turma, limpa a lista e deixa como todas selecionadas de novo
         */
        $scope.resetListTeam = function __resetListTeam(){
            $scope.change.checkedTeam=true;
            $scope.TeacherRecipient.Team = [];
            $scope.TeacherRecipientClone.Team = [];
        };

        /**
         *
         * @param {Event} e -
         * @param {Object} arr - arry do filtro
         * @param {Object}obj - opção seleciona
         */
        $scope.selectTypeFilter = function __selectTypeFilter(arr, obj, clone){

            //procura se já existe um obj salvo no arr
            for(var index in arr) {
                if (angular.equals(obj.Id, arr[index])){
                    arr.splice(index, 1);

                    if(clone)
                        clone.splice(index, 1);

                    return;
                }
            }
            //salva obj dentro do arr
            arr.push(obj.Id);
            if(clone)
                clone.push(obj);
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
         * Faz a validação se todos os campos da noficação foram preenchidos
         */
        $scope.sendNotification = function __sendNotification(){

            if(!$scope.blockSite) {

                if (!$scope.filters.SenderName) {
                    toastr.warning("Digite seu nome!");
                    return;
                } else if ($scope.filters.Recipient.length == 0) {
                    toastr.warning("Não existe filtros selecionados!");
                    return;
                } else if (!$scope.filters.MessageType) {
                    toastr.warning("Selecione o tipo da mensagem!");
                    return;
                } else if (!$scope.filters.DateStartNotification) {
                    toastr.warning("Informe a data de envio da notificação!");
                    return;
                } else if (!$scope.filters.DateEndNotification) {
                    toastr.warning("Informe a data de validade da notificação!");
                    return;
                } else if (!$scope.filters.Title) {
                    toastr.warning("Digite o titulo da notificação!");
                    return;
                } else if (getMessage()) {
                    toastr.warning("Digite a mensagem!");
                    return;
                } else {
                    saveNotification();
                }
            }
        };

        /**
         * Pega td o html do radactor e salva em filters.Message, retorna o boolean true se sucesso ou false se não tiver mensagem escrita
         * @returns {boolean}
         */
        function getMessage(){

            $scope.filters.Message = "";
            var redactorChildren = $(redactor.children());
            //valida se tem algo escrito no redactor
            if(redactorChildren.text().length > 0){
                //pegando todos os elementos htmls dentro do redactor
                redactorChildren.each(function( index ) {
                    $scope.filters.Message += '<p>' + $( this ).html() + '</p>'
                });
                return false;
            }else{
                return true;
            }

        }

        /**
         * Salva a notificação na API
         */
        function saveNotification(){

            //setando os paramentros
            var params = {
                data: angular.copy($scope.filters),
                groupSid: $scope.VisionSystem.Id
            };

            //convertando para string as datas
            params.data.DateStartNotification = new Date($scope.filters.DateStartNotification).toISOString();
            params.data.DateEndNotification = new Date($scope.filters.DateEndNotification).toISOString();

            $scope.load = true;
            HttpServices.postSave(params, function(data, res){

                if(data != null) {
                    toastr.success("Notificação salva com sucesso!");
                    //limpando as variaveis
                    creatteFilters();
                    $(redactor).children().html("");
                    $scope.showTypeFilter.typeAccordionSys = false;
                    $scope.showTypeFilter.typeAccordionUser = false;
                    removeCheckInTypeMessage();
                }
                $scope.load = false;
            });
        }

        /**
         * Salva os filtros selecionados pelo usuário
         * @param {String} type - nome do array que sera add dentro do objeto: $scope.filters.Recipient
         * @param {Object} filters - são os filtros selecionados pelo usuário
         */
        $scope.emitFilters = function __emitFiltersUser(type, filters ){

            var arr = $scope.filters.Recipient, typeModal;

            //verifica o tipo da modal a ser fechada
            if(type == "SystemRecipient") typeModal = "system";
            else typeModal = "user";

            //valida se já existe esse(s) filtro salvo no objeto: $scope.filters.Recipient
            for(var index in arr) {
                for(var indexJ in arr[index]) {
                    if (angular.equals(arr[index][indexJ], filters)){
                        toastr.warning("Você já enviou esse filtro!");
                        $scope.closeModal(null, typeModal);
                        return;
                    }//if
                }//for
            }//for


            //caso o nó não exista cria - se o né pelo tipo: type
            if(!$scope.filters.Recipient[type]) $scope.filters.Recipient[type] = [];
            //salvando os filtros selecionados para enviar para api Obs: esses objs contém apenas OS IDs selecionados
            $scope.filters.Recipient[type].push(angular.copy(filters));

            // salvando objetos clones com todas suas propriedades Ex: id, name, etc,
            // para exibir no filtros por sistema ou usuário e na modal de listagem
            if(type == "SystemRecipient"){
                $scope.showTypeFilter.typeAccordionSys = true;
                $scope.listRecipient.push(angular.copy($scope.SystemRecipientClone));
            }else {
                $scope.showTypeFilter.typeAccordionUser = true;
                if(type == 'TeacherRecipient') {
                    $scope.TeacherRecipientClone.userType = $scope.typeUser;
                    $scope.listRecipientUser.push(angular.copy($scope.TeacherRecipientClone));
                }else {
                    $scope.ContributorRecipientClone.userType = $scope.typeUser;
                    $scope.listRecipientUser.push(angular.copy($scope.ContributorRecipientClone));
                }
            }

            //fecha a modal pelo seu tipo
            $scope.closeModal(null, typeModal);

        };

        $scope.openCloseAccordion = function __openCloseAccordion(typeAccordion){

            var label, flag = false;
            typeAccordion == 'typeAccordionSys' ? label = 'sistema' :label = 'usuário';

           if($scope.filters.Recipient.SystemRecipient && typeAccordion == 'typeAccordionSys'){
               flag = true;
           }else if((($scope.filters.Recipient.ContributorRecipient && $scope.filters.Recipient.ContributorRecipient.length > 0 ) ||
               ($scope.filters.Recipient.TeacherRecipient && $scope.filters.Recipient.TeacherRecipient.length > 0 )) && typeAccordion == 'typeAccordionUser'){
               flag = true;
           }

            if(!flag) {
                toastr.warning("Nem um filtro por "+ label +" foi selecionado!");
            }else{
                $scope.showTypeFilter[typeAccordion] = !$scope.showTypeFilter[typeAccordion];
            }
        };

        $scope.openModalViewRegisters = function __openModalViewRegisters(registers){
            $scope.showTypeFilter.typeViewRegisters = true;
            $scope.registresSelected = registers;
            angular.element(body).addClass('hidden-body');
        };

        $scope.closeModalViewRegisters = function __closeModalViewRegisters(){
            $scope.showTypeFilter.typeViewRegisters = false;
            angular.element(body).removeClass('hidden-body');
        };

        $scope.checkTypeRegisterUser = function (registers, len){
            if(Object.keys(registers).length == len)return true;
            else return false;
        }

        //Busca a data atual no servidor
        function getTimeStamp(){
            HttpServices.getTimeStamp( function (data) {

                $scope.currentDate = data;
                $scope.filters.DateStartNotification = new Date($scope.currentDate * 1000);

                //$( "#datepicker1" ).datepicker({ dateFormat: 'yy-mm-dd', "setDate": $scope.filters.DateStartNotification});
                //$( "#datepicker2" ).datepicker({ dateFormat: 'yy-mm-dd'});
                //
                //$( "#datepicker1").on('change', function(e){
                //    checkDate($(this).val(), $(this), 'DateStartNotification');
                //});
                //
                //$( "#datepicker2").on('change', function(e){
                //    checkDate($(this).val(), $(this), 'DateEndNotification');
                //});
            });
        }

        function checkDate( date, elem, type ){

            var dateCurrent = new Date($scope.currentDate * 1000);
            var dateSelected = new Date(date);

            var msDateA = Date.UTC(dateCurrent.getFullYear(), dateCurrent.getMonth()+1, dateCurrent.getDate());
            var msDateB = Date.UTC(dateSelected.getFullYear(), dateSelected.getMonth()+1, dateSelected.getDate());

            if (parseFloat(msDateA) > parseFloat(msDateB)) {
                toastr.warning("Data selecionada não pode ser menor que o data atual!");
                $scope.filters[type] = dateCurrent;
            }else{
                $scope.filters[type] = dateSelected;
            }
        }

        $scope.load = true;
        /**
         * Valida se tem usuário logado no sistema
         */
        $util.getUserToken(function(user){
            if(user)initialize();
        });
    }

})(angular);