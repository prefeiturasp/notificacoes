/**
 * Created by everton.ferreira on 03/06/2016.
 */
'use strict';
var app = angular.module('appNotification', ['services', 'factories', 'directives', 'filters', 'ngAnimate','toastr', 'ui.date']);

//config da diretiva de notificação
app.config(['toastrConfig',
    function Config(toastrConfig) {

    angular.extend(toastrConfig, {

        //angular animate necessario para efeitos!

        //VEJA TODAS EM : https://github.com/Foxandxss/angular-toastr

        //posiçao da toastr
        positionClass: 'toast-top-full-width',
        //positionClass: 'toast-top-right',
        //positionClass: 'toast-bottom-full-width',
        //positionClass: 'toast-bottom-left',

        //exibir barra de progresso do tempo que a toastr fica na tela
        progressBar: true,

        //tempo que a toastr fica exibida até sumir
        timeOut: 3000,

        //tempo que a toastr fica exibida apos ter sido extendida (hover do mouse)
        extendedtimeOut: 1000,

        //permitir duplicar a ultima toastr chamada
        preventDuplicates: false,

        //permitir duplicar qualquer toastr ja aberta
        preventOpenDuplicates: false,

        //define se , caso multiplas toastrs estejam habilitadas, se sao adicionadas acima (true) ou abaixo (false) das que ja estao na tela
        newestOnTop: true

    });

}]);
