/**
 * Created by ale on 6/13/17.
 */
var plgnotify = function (sysconfig) {
    "use strict";
    var events, api, token, ws, layout, http, _config = sysconfig || {}, exports = {};
    var offX, offY, dragging, hidden, listOpened;


    /** métodos de configuração específicos **/

    /**
     * Realiza requisições
     * @param method - tipo de requisição
     * @param url - endereço
     * @param config - configurações adicionais
     * @returns {boolean}
     * @private
     */
    function _http(method, url, config) {
        var xhr = new XMLHttpRequest(), bindData;

        if (!xhr) {
            alert('Não é possível fazer XHR.');
            return false;
        }
        xhr.open(method, url, true);

        if (config) {
            if (config.header) {
                var property, obj = config.header;
                for (var property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        xhr.setRequestHeader(property, obj[property]);
                    }
                }
            }

        }

        xhr.onreadystatechange = function (e, q, w) {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    config && config.success(this.response);
                } else {
                    config && config.error(this.response);
                }
            }
        };

        xhr.send();
    }

    // macro para requisições, get e post
    http = {
        'get': _http.bind(undefined, 'get'),
        'post': _http.bind(undefined, 'post')
    };

    /**
     * Compara se um retangulo está dentro de outro
     * @param pai
     * @param filho
     */
    function containRect(pai, filho) {
        return (filho.h) <= ( pai.h);
        //return ((filho.x + filho.w <= pai.x + pai.w) && (filho.y + filho.h) <= (pai.y + pai.h) );
        //return (filho.x >= pai.x && filho.y >= pai.y) && ((filho.x + filho.w <= pai.x + pai.w) && (filho.y + filho.h) <= (pai.y + pai.h) );
    }

    /**
     * Analisa onde deve abrir a lista.
     * Se retorna falso a lista não cabe na tela.
     */
    function listPosition() {
        var plugin = {
            x: layout.x | 0,
            y: layout.y | 0,
            w: layout.width,
            h: layout.height
        };
        var list = {
            x: 0,
            y: 0,
            w: layout.widthList,
            h: layout.heightList
        };
        var innerWindow = {
            x: 0,
            y: 0,
            w: innerWidth,
            h: innerHeight
        };
        var rect = {
            x: 0, y: 0, w: list.w, h: list.h
        };

        //se lista maior que tela, não abre lista.
        if (!containRect(innerWindow, list)) {
            return true;
        }


        rect.x = (plugin.x - list.w + plugin.w * 0.5) | 0;
        if (rect.x < 0) {
            rect.x = (plugin.x + plugin.w * 0.5) | 0;
        }

        rect.y = (plugin.y - list.h + plugin.h * 0.5) | 0;
        if (rect.y < 0) {
            rect.y = (plugin.y + plugin.h * 0.5) | 0;
        }

        if (containRect(innerWindow, rect)) {
            setPosition(rect.x - layout.paddingX, rect.y - layout.paddingY, layout.domlist);
            return false;
        }

        return true;
    }

    function bellMouseDown(e) {
        e.stopPropagation();

        layout.domlist.classList.remove('hide');

        if (listPosition()) {
            layout.domplugin.classList.add('shake-anime');
            layout.domlist.classList.add('hide');
            return;
        }
        layout.domlist.style.zIndex = layout.zIndex + 1;
        listOpened = true;
    }

    function hideMouseDown(e) {
        hidden = !hidden;
        setPosition(0);
    }

    function moveMouseDown(e) {
        if (e.currentTarget !== layout.dommove) {
            return;
        }
        dragging = true;
        offX = e.offsetX;
        offY = e.offsetY;
    }

    /**
     * tratamentos de onMouseDown.
     * @param e - evento MouseDown.
     */
    function onMouseDown(e) {
        if (e.button || listOpened) return;

        switch (e.currentTarget) {
            case layout.dommove:
                moveMouseDown(e);
                break;
            case layout.domhide:
                hideMouseDown(e);
                break;
            case layout.dombell:
                bellMouseDown(e);
                break;
        }
    }

    function onDragStart(e) {
        if (!dragging) return e.preventDefault();
        hidden = false;
        addDragging();
    }

    function onDragEnd(e) {
        if (!dragging) return;
        remDragging()
        dropPosition(e.target, e);
    }

    /**
     * Aplica posição ao elemento
     * @param x
     * @param y
     * @param dom - elemento dom, padrão layout.domplugin
     */
    function setPosition(x, y, dom) {
        if (!dom) {
            dom = layout.domplugin;
        }

        if (x !== undefined) {
            if (hidden) {
                x = -50;
            }
            else {
                x = ((x + dom.clientWidth) >= innerWidth) ? (innerWidth - dom.clientWidth - layout.paddingX ) : x;
                x = (x <= 0) ? layout.paddingX : x;
            }
            dom.style.left = x + layout.posUnit;
            //dom.style.left = (x/innerWidth*100|0) + "%";// percentual
            if (dom === layout.domplugin) layout.x = x;
        }

        if (y !== undefined) {
            y = ((y + dom.clientHeight) >= innerHeight) ? (innerHeight - dom.clientHeight - layout.paddingY) : y;
            y = (y < 0) ? 0 : y;
            dom.style.top = y + layout.posUnit;
            //dom.style.top = (y/innerHeight*100|0) + "%";// percentual
            if (dom === layout.domplugin) layout.y = y;
        }

        //console.log(x, ':', y);
    }

    /**
     * Tratemtno para quando redimensionar janela.
     */
    function windowResize(e) {
        var dom = layout.domplugin, x, y;
        remDragging();

        x = dom.offsetLeft;
        y = dom.offsetTop;

        setPosition(x, y);
    }

    /**
     * Tratamento para plugin perder foco.
     */
    function onBlurPlugin(e) {
        // Se a lista estiver NÃO aberta ou Clicar no plugin E NÃO for no sino, então retorna.
        var onblur = !listOpened || e.target.className.match('plg') && e.target !== layout.dombell;
        layout.domplugin.classList.remove('shake-anime');
        if (onblur) return;
        listOpened = false;
        layout.domlist.classList.add('hide');
    }

    /**
     * Mostra notificação que chegou.
     */
    function showToastr() {
        if (_config.toastr) {
            console.info('Toastr existente.')
        }

        //configurar toaster local.
    }

    /**
     * Atualiza elemento com número.
     */
    function counterIncrement(data) {

        showToastr(data);

        if (!layout.domcounter) return;
        data = (parseInt(data.msg) > 9) && ('9+') || data.msg;
        layout.domcounter.innerHTML = data;

    }

    /**
     * Adiciona estado de 'dragging'.
     */
    function addDragging() {
        layout.domplugin.style.opacity = 0.4;
        dragging = true;
    }

    /**
     * Remove estado de 'dragging'.
     */
    function remDragging() {
        dragging = false;
        layout.domplugin.style.opacity = 1.0;
    }

    /**
     * Determina qual é melhor forma de abrir a lista de notificações.
     */
    function evalListPosition() {

    }

    /**
     * Mantém plugin sempre na tela.
     *
     * @param dom
     * @param event
     */
    function dropPosition(dom, event) {
        var x = event.clientX, y = event.clientY;

        if (!hidden) {
            if (offX) x -= offX;
            if (offY) y -= offY;
        }
        // fazer tratamento para esconder plugin com base na posição.

        layout.x = x;
        layout.y = y;
        setPosition(x, y);
        dom.style.zIndex = layout.zIndex;
    }

    /**
     * Adicionar evento à um elemento e seus parâmetros.
     * @param el
     * @param type
     * @param callback
     * @param listenerConfig
     */
    function addEventListener(el, type, callback, listenerConfig) {
        el.addEventListener(type, callback, listenerConfig || false);
    }

    /** métodos de configuração gerais **/

    /**
     * Pega paramêtros do sistema para configuração.
     */
    function getSysConfig() {
        // validações das configurações esperadas.
    }

    /**
     * Configura namespace dos eventos utilizados internamente.
     */
    function setEvents() {
        // define namespace dos eventos.
        events = _config.events || {
                onload: 'DOMContentLoaded',
                resize: 'resize',

                mousedown: 'mousedown',
                mouseup: 'mouseup',
                click: 'click',

                dragstart: 'dragstart',
                dragend: 'dragend',
                drop: 'drop',

                notification: 'refresh',
                refresh: 'refresh'
            };
    }

    /**
     * Configura endereço e métodos.
     */
    function setAPI() {

        // pega token
        token = _config.token;

        // pega dados da api
        api = _config.api;

    }

    /**
     * Adiciona conteúdo ao HTML.
     */
    function addContentHTML(type, content, reflow) {
        var frag = document.createDocumentFragment(), type = document.createElement(type);
        type.innerHTML = content;
        frag.appendChild(type);
        if (!reflow) document.body.appendChild(frag);
        return frag;
    }

    /**
     * Pegar elementos DOM, se não houver adiciona.
     */
    function setLayout() {
        var style;

        // pega ref. do namespace dos elementosDOM.
        layout = _config.layout || {
                'container': 'plg',
                'plugin': 'plg-notify',
                'counter': 'plg-notify-counter',
                'bell': 'plg-notify-bell',
                'hide': 'plg-notify-hide',
                'list': 'plg-notify-list',
                'move': 'plg-notify-move',
                'template': 'plg-notify-template',

                'dombell': undefined,
                'domcounter': undefined,
                'domlist': undefined,
                'domhide': undefined,
                'dommove': undefined,
                'domtemplate': undefined,

                'x': undefined,
                'y': undefined,
                'width': undefined,
                'height': undefined,

                'widthList': undefined,
                'heightList': undefined,

                'paddingX': undefined,
                'paddingY': undefined,

                zIndex: 100,
                posUnit: 'px'
            };


        // validar se elemento do plugin está na tela.
        if (!layout.domplugin) {
            console.warn('Plugin não está na tela.');

            // adicionar elemntosDOM e styles, se não houver
            var css = ' [draggable]{-moz-user-select: none; -khtml-user-select: none; -webkit-user-select: none; user-select: none; -khtml-user-drag: element; -webkit-user-drag: element}.draggable{position: absolute}.draggable, .draggable > *, .notificacoes li{display: inline-block}.draggable > i{cursor: move}.dragging{border: 1px solid #000}.hide{display: none !important}.hitbox{pointer-events: none; padding: 0; margin: 0;}.notificacoes{position: fixed; background: #fff; width: 320px; display: inline-block; border: 1px solid #ddd; box-shadow: 0 0 10px 4px rgba(0, 0, 0, .1); border-radius: 10px; overflow-y: auto; overflow-x: hidden; height: 420px; -webkit-transition: none!important; -moz-transition: none !important; -ms-transition: none !important; -o-transition: none !important; transition: none !important;}.notificacoes li{width: 100%; padding: 8px 0 8px 8px; border-bottom: 1px solid rgba(235, 238, 240, .31); font-size: 1rem; overflow: hidden; height: 42px}.notificacoes p, .notificacoes span{text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 90%; min-width: 30%}.notificacoes li.lida{opacity: .5}.notificacoes li:last-child{border-bottom: 0}.notificacoes li:nth-child(odd){background: #fafbfb}.notificacoes li.urgente{background: #d11d1d; color: #fff}.notificacoes li.urgente *{color: #fff}.notificacoes li span{font-size: 1.2rem; display: block; font-weight: 900; color: #768e99}.circulo, .float-menu{border-radius: 100%; width: 80px; height: 80px}.circulo{box-sizing: border-box; overflow: hidden}.float-menu{display: block; position: fixed; user-select: none; color: #fff; box-shadow: 4px 4px 4px rgba(0, 0, 0, .3); font-family: sans-serif}.float-menu .lateral{width: 38px; left: 42px; position: absolute; height: 40px}.float-menu .lateral a{display: inline-block; width: 100%; text-align: center; padding: 7px; box-sizing: border-box; background: #f32f2f; font-weight: 600; font-size: 15px; cursor: pointer; border-radius: 100%; height: 40px}.float-menu a.numeracao{background: #ff9800; cursor: default; position: absolute; right: 0px; top: -10px; height: 16px; width: 16px; padding: 5px; margin: auto; border-radius: 100%; font-weight: 700; z-index: 5}.float-menu a.numeracao:hover{background: #ffd200; color: #000}.float-menu .lateral a.esconder svg{margin-top: 0}.float-menu .lateral a:hover{background: #a91b1b}.float-menu .lateral a svg{fill: #fff; margin-top: 7px}.float-menu .lateral a:first-child{border-bottom: 0; border-radius: 0 100% 0 0;}.float-menu .lateral a:last-child{border-bottom: 0; border-radius: 0 0 100% 0;}.sino{width: 50px; height: 80px; cursor: pointer; padding: 20px 0 0 10px; box-sizing: border-box; position: relative; background-color: #232b38}.sino svg{fill: #fff}.sino:hover{background: #3d4d60}.shake-anime{animation: shake 1s cubic-bezier(.36,.07,.19,.97) both; transform: translate3d(0, 0, 0); backface-visibility: hidden; perspective: 1000px;}@keyframes shake{10%, 90%{transform: translate3d(-1px, 0, 0);}20%, 80%{transform: translate3d(2px, 0, 0);}30%, 50%, 70%{transform: translate3d(-4px, 0, 0);}40%, 60%{transform: translate3d(4px, 0, 0);}}';
            var html = '<div draggable="true" class="hide float-menu plg-notify"><div class="circulo"><div class="lateral"><a class="mover plg-notify-move"><svg class="hitbox" enable-background="new 0 0 96 96" height="17" version="1.1" viewBox="0 0 96 96" width="17" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M94.828,45.171L80.687,31.029c-1.562-1.562-4.095-1.562-5.657,0c-1.562,1.562-1.562,4.095,0,5.657L82.344,44H52V13.657 l7.313,7.313c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L50.828,1.171c-1.562-1.562-4.095-1.562-5.657,0 L31.029,15.314c-1.562,1.562-1.562,4.095,0,5.657s4.095,1.562,5.657,0L44,13.657V44H13.657l7.313-7.313 c1.562-1.562,1.562-4.095,0-5.657s-4.095-1.562-5.657,0L1.171,45.171c-1.562,1.562-1.562,4.095,0,5.657l14.143,14.143 c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L13.657,52H44v30.344l-7.313-7.314 c-1.562-1.562-4.095-1.562-5.657,0c-1.562,1.562-1.562,4.095,0,5.657l14.142,14.142c1.562,1.562,4.095,1.562,5.657,0l14.143-14.142 c1.562-1.562,1.562-4.095,0-5.657c-1.562-1.562-4.095-1.562-5.657,0L52,82.343V52h30.343l-7.313,7.313 c-1.562,1.562-1.562,4.095,0,5.657c1.562,1.562,4.095,1.562,5.657,0l14.142-14.143C96.391,49.267,96.391,46.733,94.828,45.171z"/></svg></a><a class="esconder plg-notify-hide"><svg class="hitbox" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M24 9c-10 0-18.54 6.22-22 15 3.46 8.78 12 15 22 15s18.54-6.22 22-15c-3.46-8.78-11.99-15-22-15zm0 25c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10zm0-16c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg></a></div><div class="sino plg-notify-bell"><svg class="hitbox" height="40" viewBox="0 0 1792 1792" width="35" xmlns="http://www.w3.org/2000/svg"><path d="M912 1696q0-16-16-16-59 0-101.5-42.5t-42.5-101.5q0-16-16-16t-16 16q0 73 51.5 124.5t124.5 51.5q16 0 16-16zm816-288q0 52-38 90t-90 38h-448q0 106-75 181t-181 75-181-75-75-181h-448q-52 0-90-38t-38-90q50-42 91-88t85-119.5 74.5-158.5 50-206 19.5-260q0-152 117-282.5t307-158.5q-8-19-8-39 0-40 28-68t68-28 68 28 28 68q0 20-8 39 190 28 307 158.5t117 282.5q0 139 19.5 260t50 206 74.5 158.5 85 119.5 91 88z"/></svg></div></div><a class="numeracao hitbox"><span class="plg-notify-counter">0</span></a></div><div class="hide notificacoes plg-notify-list hitbox"></div><div class="hide plg-notify-template"><li class="hitbox"></li></div>';
            addContentHTML('style', css);

            var dom = addContentHTML('div', html, true);
            dom.childNodes[0].classList.add(layout.container);
            document.body.appendChild(dom);

            var templateMensages = '<li class="urgente"><span>20/06/2017</span><div>Essa mensagem é urgente !</div></li><li class="lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li><li class="lida urgente"><span>20/06/2017</span><div>Essa mensagem é urgente e já foi lida!</div></li><li><span>12/06/2017</span><div>Uma mensagem muito muito muito muito muito muitolonga mesmo ...</div></li>';
            dom = addContentHTML('ul', templateMensages, true);

            document.getElementsByClassName('plg-notify-list')[0].innerHTML = (templateMensages);

            console.info('Plugin adicionado na tela');
        }

        layout.domcontainer = document.getElementsByClassName(layout['container'])[0];
        layout.domplugin = document.getElementsByClassName(layout['plugin'])[0];
        layout.dombell = document.getElementsByClassName(layout['bell'])[0];
        layout.domcounter = document.getElementsByClassName(layout['counter'])[0];
        layout.domhide = document.getElementsByClassName(layout['hide'])[0];
        layout.domlist = document.getElementsByClassName(layout['list'])[0];
        layout.dommove = document.getElementsByClassName(layout['move'])[0];
        layout.domtemplate = document.getElementsByClassName(layout['template'])[0];


        style = getComputedStyle(layout.domplugin);

        //layout.paddingX = parseInt(style.boxShadow.split(' ')[4].substr(0, 1)) + 10;
        //layout.paddingY = parseInt(style.boxShadow.split(' ')[5].substr(0, 1)) + 10;

        layout.paddingX = layout.paddingY = 14;

        layout.width = parseInt(style.width.substr(0, style.width.indexOf('px')));

        layout.height = parseInt(style.height.substr(0, style.width.indexOf('px')));

        style = getComputedStyle(layout.domlist);
        layout.widthList = parseInt(style.width.substr(0, style.width.indexOf('px')));

        layout.heightList = parseInt(style.height.substr(0, style.width.indexOf('px')));

        setPosition(innerWidth - layout.width - layout.paddingX - 30, innerHeight - layout.height - layout.paddingY - 30);
        //setPosition(innerWidth * Math.random() - layout.width - layout.paddingX, innerHeight * Math.random() - layout.height - layout.paddingY);
    }

    /**
     * Adiciona ouvintes para eventos internos.
     * DragEvents e MouseEvents.
     */
    function addListeners() {

        addEventListener(window, events.resize, windowResize);
        addEventListener(document, events.mousedown, onBlurPlugin);
        addEventListener(document, events.mouseup, onDragEnd);

        addEventListener(document, events.dragstart, onDragStart);
        addEventListener(document, events.dragend, onDragEnd);

        if (layout.dommove) {
            addEventListener(layout.dommove, events.mousedown, onMouseDown);
        }

        if (layout.domhide) {
            addEventListener(layout.domhide, events.mousedown, onMouseDown);
        }

        if (layout.dombell) {
            addEventListener(layout.dombell, events.mousedown, onMouseDown);
        }

    }

    /**
     * Adiciona eventos do socket.
     */
    function addSocketListeners() {
        if (socket.hasListeners) return;
        socket.hasListeners = true;

        socket.on(events.notification, counterIncrement);
    }

    /**
     * Configurações iniciais do websocket.
     *
     * @returns ws = {{send, read}}
     */
    function startSocket() {
        var socket;

        if (!_config || !_config.ws || !_config.ws.url || window.io == undefined) {
            console.warn('socket.io-client não detectado');
            return;
        }
        if (ws) return console.warn('ws já instânciado.');

        if (!socket) {
            socket = io(_config.ws.url);
            socket.hasListeners = false;
            socket.on('connect', addSocketListeners);
        }

        ws = {
            get update() {
                socket.emit(events.notification);
            },
            set later(obj) {
                api.later(obj);
            },
            set read(id) {
                api.readed(id);
            }
        };

        exports[events.refresh] = ws.update;
        return ws;
    }

    /**
     * Publica métodos para uso externo.
     */
    function publish() {

        layout.domplugin.classList.remove('hide');
    }

    /**
     * Construtor
     */
    function init() {
        getSysConfig();
        setEvents();
        setAPI(); //token e api
        setLayout();
        addListeners();
        startSocket();

        publish();
    }

    // Internet Explorer 6-11 ou Edge 20+
    var isIE = /*@cc_on!@*/false || !!document.documentMode, isEdge = !isIE && !!window.StyleMedia;

    //Valida se é IE ou Edge
    if (isIE || isEdge){
        init();
    }
    else{
        // async ou sync - ( DOMContentLoaded / load )
        addEventListener(window, 'load', init, {once: true, passive: true});
    }

    //exporta metodos públicos
    return exports;
}
