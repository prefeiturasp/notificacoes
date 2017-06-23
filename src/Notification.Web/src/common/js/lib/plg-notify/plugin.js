/**
 * Created by ale on 6/13/17.
 */
var plgnotify = function ( sysconfig ) {
	"use strict";

	// Variaveis globais do plugin
	var events, api, token, websocket, layout, http, _config, exports, socket;
	_config = sysconfig || {};
	exports = {};

	//Variáveis de controle de drag & drop.
	var offX, offY, dragging;

	// Visibilidade do plugin e lista de notificações
	var hidden, listOpened;

	//Contador de total de notificações.
	var counter = 0;

	//Guarda última referência da página.
	var lastHref;

	/**
	 * HTTP
	 * **/

	/**
	 * Realiza requisições
	 * @param method - tipo de requisição
	 * @param url - endereço
	 * @param config - configurações adicionais
	 * @returns {boolean}
	 * @private
	 */
	function _http( method, url, config ) {
		var xhr = new XMLHttpRequest(), bindData;

		if ( !xhr ) {
			alert( 'Não é possível fazer XHR.' );
			return false;
		}
		xhr.open( method, url, true );

		if ( config ) {
			if ( config.header ) {
				var property, obj = config.header;
				for ( var property in obj ) {
					if ( obj.hasOwnProperty( property ) ) {
						xhr.setRequestHeader( property, obj[property] );
					}
				}
			}

		}

		xhr.onreadystatechange = function ( e, q, w ) {
			if ( this.readyState === XMLHttpRequest.DONE ) {
				if ( this.status === 200 ) {
					config && config.success( this.response );
				}
				else {
					config && config.error( this.response );
				}
			}
		};

		xhr.send();
	}

	// macro para requisições, get e post
	http = {
		'get' :_http.bind( undefined, 'get' ),
		'post':_http.bind( undefined, 'post' )
	};

	/**
	 * Métodos específicos.
	 * **/

	/**
	 * Esconde lista dew notificações.
	 */
	function hideList() {
		listOpened = false;
		layout.domplugin.classList.remove( 'shake-anime' );
		layout.domlist.classList.add( 'hide' );
	}

	/**
	 * Alterar modal em titulo e texto.
	 * @param dom - elemento dom
	 */
	function showMessage( dom ) {
		var modal, dialog, header, body, footer, text, title, fecharX, btnFechar;

		//adicionar modal
		modal = '<div class="plgmodal" id="plgmodal" aria-hidden="true">' +
				'<div class="plgmodal-dialog">' +
				'<div class="plgmodal-header">' +
				'<h2> <span class="plgloader"></span></h2>' +
				'<a class="plgmodal-btn-close" aria-hidden="true">×</a>' +
				'</div>' +
				'<div class="plgmodal-body">' +
				'<p> <span class="plgloader"></span> </p>' +
				'</div>' +
				'<div class="plgmodal-footer">' +
				'<a class="plgmodal-btn">Fechar</a>' +
				'</div></div></div>';
		modal = addContentHTML( 'div', modal, true ).childNodes[0];

		dialog = modal.getElementsByClassName( 'plgmodal-dialog' )[0];

		header = modal.getElementsByClassName( 'plgmodal-header' )[0];
		body   = modal.getElementsByClassName( 'plgmodal-body' )[0];
		footer = modal.getElementsByClassName( 'plgmodal-footer' )[0];

		title = header.childNodes[0];
		text  = body.childNodes[0];

		text.innerHTML  = dom.childNodes[1].innerHTML;
		title.innerHTML = dom.childNodes[0].innerHTML;

		btnFechar = footer.childNodes[0];
		fecharX   = header.childNodes[1];

		//fecharX.href = btnFechar.href = '';

		//remove modal quando clicar para sair
		fecharX.onclick = btnFechar.onclick = function () {
			setTimeout(
				function () {
					modal.style.opacity = 0;

					setTimeout(
						function () {
							document.body.removeChild( modal );
							modal = undefined;
						},
						layout.animationTime
					);
				}, layout.animationTime // tempo de animação e até remoção
			);
		}

		//adiciona na tela
		document.body.appendChild( modal );

		setTimeout(
			function () {
				dialog.style.top = "20%";
			},
			layout.animationTime *.5
		);

	}

	/**
	 * Abre modal com notificação e esconde lista de notificações.
	 * @param {event} e - evento mousedown.
	 */
	function openModal( e ) {
		if ( !e.target.classList.contains( 'plgnot' ) ) {
			return;
		}

		//Exibe mensagem
		showMessage( e.target );

		hideList();
	}

	/**
	 * Compara se um retângulo está dentro da área de outro.
	 * @param maior    - retângulomaior.
	 * @param menor - retângulo menor.
	 * @returns {boolean} - true se conter
	 */
	function containRect( maior, menor ) {
		return ( menor.h <= maior.h ) && ( menor.w <= maior.w );
	}

	/**
	 * Verifica se um elemento está sobrepondo( está em cima ) de outro.
	 * Não verifica a área dos objetos, é pressuposto que o maior tem maior área que o menor.
	 *
	 * @param maior    - retângulomaior.
	 * @param menor - retângulo menor.
	 * @returns {boolean} - true se estiver em cima
	 */
	function isOverlaping( maior, menor ) {
		return maior.x < menor.x && maior.y < menor.y;
	}

	/**
	 * Analisa onde deve abrir a lista.
	 * Se retorna falso a lista não cabe na tela.
	 * @returns {boolean} - true se não pode abrir
	 */
	function hasSpaceList() {
		var plugin      = {
			x:layout.x | 0,
			y:layout.y | 0,
			w:layout.width,
			h:layout.height
		};
		var list        = {
			x:0,
			y:0,
			w:layout.widthList,
			h:layout.heightList
		};
		var innerWindow = {
			x:0,
			y:0,
			w:innerWidth,
			h:innerHeight
		};
		var rect        = {
			x:0,
			y:0,
			w:list.w,
			h:list.h
		};

		//se lista maior que tela, não abre lista.
		if ( containRect( innerWindow, list ) ) {

			rect.x = (plugin.x - list.w + plugin.w * 0.5) | 0;
			if ( rect.x < 0 ) {
				rect.x = (plugin.x + plugin.w * 0.5) | 0;
			}

			rect.y = (plugin.y - list.h + plugin.h * 0.5) | 0;
			if ( rect.y < 0 ) {
				rect.y = ( plugin.y + plugin.h * 0.5) | 0;
			}

			//Verifica se lista+plugin cabe na janela
			if ( containRect( innerWindow, rect ) ) {
				setPosition( rect.x - layout.paddingX, rect.y - layout.paddingY, layout.domlist );
				return true;
			}
		}

		return false;
	}

	/**
	 * Tratamento para quando pressiona o sino.
	 * @param {Event} e - evento de mousedown.
	 */
	function bellMouseDown( e ) {
		e.stopPropagation();

		layout.domlist.classList.remove( 'hide' );

		// verifica se é possível abrir lista
		if ( !hasSpaceList() ) {
			layout.domplugin.classList.add( 'shake-anime' );
			layout.domlist.classList.add( 'hide' );
			return;
		}

		layout.domlist.style.zIndex = layout.zIndex + 1;
		listOpened                  = true;
	}

	/**
	 * Tratamneto para esconder plugin.
	 * @param {event} e - evento de mousedown.
	 */
	function hideMouseDown( e ) {
		hidden = !hidden;
		setPosition( 0 );
	}

	/**
	 * Tratamento para quando se arrasta o plugin.
	 * @param {event} e - evento de mousedown.
	 */
	function moveMouseDown( e ) {
		//verifica se está pegando elemento correto
		if ( e.currentTarget !== layout.dommove ) {
			return;
		}

		dragging = true;

		//pega posição relativa de onde o mouse começou o evento.
		offX = e.offsetX + e.currentTarget.parentNode.offsetLeft;
		offY = e.offsetY + e.currentTarget.parentNode.offsetTop;
	}

	/**
	 * tratamentos de onMouseDown.
	 * @param {event} e - evento MouseDown.
	 */
	function onMouseDown( e ) {
		//verifica se está usando o botão principal do mouse
		//Impede eventos caso a lista esteja aberta.
		if ( e.button || listOpened ) {
			return;
		}

		switch ( e.currentTarget ) {
			case layout.dommove:
				moveMouseDown( e );
				break;
			case layout.domhide:
				hideMouseDown( e );
				break;
			case layout.dombell:
				bellMouseDown( e );
				break;
		}
	}

	/**
	 * Adiciona estado de 'dragging'.
	 */
	function addDragging() {
		layout.domplugin.style.opacity = 0.4;
		hidden                         = false;
		dragging                       = true;
	}

	/**
	 * Remove estado de 'dragging'.
	 */
	function remDragging() {
		dragging                       = false;
		layout.domplugin.style.opacity = 1.0;
	}

	/**
	 * Tratamento para eventos de começo do arraste.
	 * @param {event} e - evento de dragstart.
	 */
	function onDragStart( e ) {
		if ( !dragging ) {
			e.preventDefault();
			return;
		}
		addDragging();
	}

	/**
	 * Tratamento para eventos de término arraste.
	 * @param {event} e - evento de dragend.
	 */
	function onDragEnd( e ) {
		if ( !dragging ) {
			return;
		}
		remDragging()
		dropPosition( e.target, e );
	}

	/**
	 * Aplica posição à um elemento
	 * @param {number} x - posição do elemento na tela na horizontal.
	 * @param {number} y - posição do elemento na tela na vertical.
	 * @param {ElementDom} dom - elemento dom.
	 */
	function setPosition( x, y, dom ) {
		if ( !dom ) {
			dom = layout.domplugin;
		}

		if ( x !== undefined ) {
			if ( hidden ) {
				x = -50;
			}
			else {
				x = ( x + dom.clientWidth >= innerWidth ) ?
					( innerWidth - dom.clientWidth - layout.paddingX ) : x;
				x = ( x <= 0 ) ?
					layout.paddingX : x;
			}
			dom.style.left = x + layout.posUnit;
			//dom.style.left = (x/innerWidth*100|0) + "%";// percentual
			if ( dom === layout.domplugin ) {
				layout.x = x;
			}
		}

		if ( y !== undefined ) {
			y = ((y + dom.clientHeight) >= innerHeight) ? (innerHeight - dom.clientHeight - layout.paddingY) : y;
			y = (y < 0) ? 0 : y;

			dom.style.top = y + layout.posUnit;
			//dom.style.top = (y/innerHeight*100|0) + "%";// percentual
			if ( dom === layout.domplugin ) {
				layout.y = y;
			}
		}
		//console.log(x, ':', y);
	}

	/**
	 * Tratemtno para quando redimensionar janela.
	 * @param {event} e - evento de resize.
	 */
	function windowResize( e ) {
		setPosition( layout.domplugin.offsetLeft, layout.domplugin.offsetTop );
	}

	/**
	 * Tratamento para plugin perder foco.
	 * @param {event} e - evento de onblur.
	 */
	function onBlur( e ) {
		// Se a lista estiver NÃO aberta ou,
		// Clicar no plugin E NÃO for no sino,
		// então retorna.
		var hasFocus = !listOpened || ( e && e.target.className.match( 'plg' ) && e.target !== layout.dombell );

		layout.domplugin.classList.remove( 'shake-anime' );

		//se NÃO perdeu o foco, não faz nada.
		if ( hasFocus ) {
			return;
		}

		hideList();
	}

	/**
	 * Mostra notificação que chegou.
	 * @param {object} msg - mensagem que será exibida, com header, body e customclass.
	 * @param {number} y - posição na vertical do toaster.
	 * @param {number} time - tempo de duração do toaster.
	 * @param {number} delay - tempo de esperar para abrir o toaster.
	 */
	function showToastr( msg, y, time, delay ) {
		//Verifica se tem mais de um toaster
		if ( !_config.toastr ) {
			_config.toastr = [];
		}
		//se tiver, não exibe outro ( a se definir )
		else if ( _config.toastr.length ) {
			return;
		}

		var uid, i, dom, html;

		// Cria html do toaster

		html = '<div class="plgsnackbar">' +
			   '<span class="plgsnackbar-header">' + ((msg && msg.header) ? msg.header : 'Titulo da notificação') + '</span>' +
			   '<span class="plgsnackbar-body">' + ((msg && msg.body) ? msg.body : 'Mensagem muito longa mesmooooooooooooooo') + '</span>' +
			   '</div>'
		uid  = {};
		dom  = addContentHTML( 'div', html, true );
		dom  = dom.childNodes[0];
		document.body.appendChild( dom );

		// Configura valores padrões da animação.
		y     = y ? y : 50;
		delay = delay ? delay : 0.15;
		time  = time ? time : 2;

		//salva referencia dos setTimeout, para poder cancelar , se necessário.
		_config.toastr.push( uid );
		uid[1] = setTimeout(
			function () {
				//Deixa toaster visivel
				dom.style.opacity    = 0.85;
				dom.style.bottom     = y + 'px';
				dom.style.visibility = 'visible';

				uid[2] = setTimeout(
					function () {
						//esconde toaster
						dom.style.opacity    = 0;
						dom.style.bottom     = '-50px';
						dom.style.visibility = 'hidden'

						uid[3] = setTimeout(
							function () {
								//remove da tela toaster
								document.body.removeChild( dom );

								//remove referências dessa função.(evitar memory leak )
								i = _config.toastr.indexOf( uid );
								_config.toastr.splice( i, 1 );

								uid[1] = uid[2] = uid[3] = undefined;
								dom = i = uid = undefined;
							}, layout.animationTime //tempo até remover da tela e animação
						);
					}, time * 1000 // tempo de exibição
				);
			}, delay * 1000 // delay inicial
		);
	}

	/**
	 * Atualiza elemento com número.
	 * @param {Object} res - respostar do socket, quando recebe novas notificações
	 */
	function counterIncrement( res ) {
		//showToastr(res);
		showToastr();
		if ( !layout.domcounter ) {
			return;
		}
		counter++;

		layout.domcounter.innerHTML = counter;
	}

	/**
	 * Mantém plugin sempre na tela.
	 * @param {ElementDOM} dom - elemento dom.
	 * @param {Event} event - evento
	 */
	function dropPosition( dom, event ) {
		var x = event.clientX, y = event.clientY;

		if ( !hidden ) {
			if ( offX ) {
				x -= offX;
			}
			if ( offY ) {
				y -= offY;
			}
		}

		layout.x         = x;
		layout.y         = y;
		dom.style.zIndex = layout.zIndex;
		setPosition( x, y );
	}

	/**
	 * Adicionar evento à um elemento e seus parâmetros.
	 * @param {ElementDOM} el - elemento dom que recebe o evento.
	 * @param {Event} type - tipo de evento.
	 * @param {Function} callback - método que dispara quando evento acontecer.
	 * @param {Object} listenerConfig - configurações para evento.
	 */
	function addEventListener( el, type, callback, listenerConfig ) {
		el.addEventListener( type, callback, listenerConfig || false );
	}

	/**
	 * métodos de configuração geral
	 * **/

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
				onload:'DOMContentLoaded',
				resize:'resize',

				mousedown:'mousedown',
				mouseup  :'mouseup',
				click    :'click',

				dragstart:'dragstart',
				dragend  :'dragend',
				drop     :'drop',

				notification:'refresh',
				refresh     :'refresh'
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
	function addContentHTML( type, content, reflow ) {
		var frag, type;
		type           = document.createElement( type );
		type.innerHTML = content;
		if ( !reflow ) {
			frag = document.createDocumentFragment();
			frag.appendChild( type );
			document.body.appendChild( frag );
			return frag;
		}
		return type;
	}

	/**
	 * Cria todo o layout do plugin.
	 */
	function createLayout() {
		var style, css, html, modalMensages, dom; // ref. do elemento DOM.

		// pega ref. do namespace dos elementosDOM.
		layout = {
			container:'plg',
			plugin   :'plg-notify',
			counter  :'plg-notify-counter',
			bell     :'plg-notify-bell',
			hide     :'plg-notify-hide',
			list     :'plg-notify-list',
			move     :'plg-notify-move',
			toaster  :'plgsnackbar',

			dombell   :undefined,
			domcounter:undefined,
			domlist   :undefined,
			domhide   :undefined,
			dommove   :undefined,

			x     :0,
			y     :0,
			width :80,
			height:80,

			widthList :240,
			heightList:420,

			paddingX:14,
			paddingY:14,

			animationTime:300,

			zIndex :100,
			posUnit:'px'
		};

		//tenta pegar plugin na tela
		layout.domplugin = document.getElementsByClassName( layout.plugin )[0];

		// validar se elemento do plugin está na tela.
		if ( !layout.domplugin ) {
			console.warn( 'Plugin não está na tela.' );

			// adicionar elemntosDOM e styles, se não houver
			css = '.plgsnackbar{visibility:hidden;width:250px;margin-left:-125px;background-color:#333;color:#fff;text-align:center;border-radius:2px;padding:16px;position:fixed;z-index:150;left:50%;bottom:0;opacity:0}.plgsnackbar span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.plgsnackbar-header{font-weight:700}.plgloader{border:8px solid #f3f3f3!important;border-top:8px solid #3498db!important;border-radius:50%;width:36px!important;height:36px!important;animation:2s linear infinite spin}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}[draggable]{-moz-user-select:none;-khtml-user-select:none;-webkit-user-select:none;user-select:none;-khtml-user-drag:element;-webkit-user-drag:element}.draggable{position:absolute}.draggable,.draggable>*,.notificacoes li{display:inline-block}.draggable>i{cursor:move}.hide{display:none!important}.hitbox{pointer-events:none;padding:0;margin:0}.notificacoes{position:fixed;background:#fff;width:320px;display:inline-block;border:1px solid #ddd;box-shadow:0 0 10px 4px rgba(0,0,0,.1);border-radius:10px;overflow-y:auto;overflow-x:hidden;height:420px;-webkit-transition:none!important;-moz-transition:none!important;-ms-transition:none!important;-o-transition:none!important;transition:none!important}.notificacoes li{width:100%;padding:8px 0 8px 8px;border-bottom:1px solid rgba(235,238,240,.31);font-size:1rem;overflow:hidden;height:42px}.notificacoes p,.notificacoes span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;max-width:90%;min-width:30%}.notificacoes li.lida{opacity:.5}.notificacoes li:last-child{border-bottom:0}.notificacoes li:nth-child(odd){background:#fafbfb}.notificacoes li.urgente{background:#d11d1d;color:#fff}.notificacoes li.urgente *{color:#fff}.notificacoes li span{font-size:1.2rem;display:block;font-weight:900;color:#768e99}.circulo,.float-menu{border-radius:100%;width:80px;height:80px}.circulo{box-sizing:border-box;overflow:hidden}.float-menu{display:block;position:fixed;user-select:none;color:#fff;box-shadow:4px 4px 4px rgba(0,0,0,.3);font-family:sans-serif}.float-menu .lateral{width:38px;left:42px;position:absolute;height:40px}.float-menu .lateral a{display:inline-block;width:100%;text-align:center;padding:7px;box-sizing:border-box;background:#f32f2f;font-weight:600;font-size:15px;cursor:pointer;border-radius:100%;height:40px}.float-menu a.numeracao{background:#ff9800;cursor:default;position:absolute;right:0;top:-10px;height:16px;width:16px;padding:5px;margin:auto;border-radius:100%;font-weight:700;z-index:5}.float-menu a.numeracao:hover{background:#ffd200;color:#000}.float-menu .lateral a.esconder svg{margin-top:0}.float-menu .lateral a:hover{background:#a91b1b}.float-menu .lateral a svg{fill:#fff;margin-top:7px}.float-menu .lateral a:first-child{border-bottom:0;border-radius:0 100% 0 0}.float-menu .lateral a:last-child{border-bottom:0;border-radius:0 0 100%}.sino{width:50px;height:80px;cursor:pointer;padding:20px 0 0 10px;box-sizing:border-box;position:relative;background-color:#232b38}.sino svg{fill:#fff}.sino:hover{background:#3d4d60}.shake-anime{animation:1s cubic-bezier(.36,.07,.19,.97) both shake;transform:translate3d(0,0,0);backface-visibility:hidden;perspective:1000px}@keyframes shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}.plgmodal-btn{background:#428bca;border:1px solid #357ebd;border-radius:3px;color:#fff;display:inline-block;font-size:14px;padding:8px 15px;text-decoration:none;text-align:center;min-width:60px;position:relative;transition:color .1s ease}.plgmodal-btn:hover{background:#357ebd}.plgmodal-btn.plgmodal-btn-big{font-size:18px;padding:15px 20px;min-width:100px}.plgmodal-btn-close{color:#aaa;font-size:30px;text-decoration:none;position:absolute;right:5px;top:0}.plgmodal-btn-close:hover{color:#000}.plgmodal{display:block;background:rgba(0,0,0,.6);position:fixed;top:0;left:0;right:0;bottom:0;z-index:210}.plgmodal:target:before{display:block}.plgmodal-dialog{background:#fefefe;border:1px solid #333;border-radius:5px;margin-left:-200px;position:fixed;left:50%;top:-100%;z-index:211;width:360px}.plgmodal-body{padding:20px}.plgmodal-footer,.plgmodal-header{padding:10px 20px}.plgmodal-header{border-bottom:1px solid #eee}.plgmodal-header h2{font-size:20px}.plgmodal-footer{border-top:1px solid #eee;text-align:right}li.plgnot>*{pointer-events:none}li.plgnot:hover{background-color:rgba(112,128,144,.42)!important}li.plgnot:hover>*{color:#000!important}';
			addContentHTML( 'style', css );

			//adicionar plugin
			html = '<div draggable="true" class="hide float-menu plg-notify">' +
				   '<div class="circulo">' +
				   '<div class="lateral">' +
				   '<a class="mover plg-notify-move"><svg class="hitbox" enable-background="new 0 0 96 96" height="17" version="1.1" viewBox="0 0 96 96" width="17" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M94.828,45.171L80.687,31.029c-1.562-1.562-4.095-1.562-5.657,0c-1.562,1.562-1.562,4.095,0,5.657L82.344,44H52V13.657 l7.313,7.313c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L50.828,1.171c-1.562-1.562-4.095-1.562-5.657,0 L31.029,15.314c-1.562,1.562-1.562,4.095,0,5.657s4.095,1.562,5.657,0L44,13.657V44H13.657l7.313-7.313 c1.562-1.562,1.562-4.095,0-5.657s-4.095-1.562-5.657,0L1.171,45.171c-1.562,1.562-1.562,4.095,0,5.657l14.143,14.143 c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L13.657,52H44v30.344l-7.313-7.314 c-1.562-1.562-4.095-1.562-5.657,0c-1.562,1.562-1.562,4.095,0,5.657l14.142,14.142c1.562,1.562,4.095,1.562,5.657,0l14.143-14.142 c1.562-1.562,1.562-4.095,0-5.657c-1.562-1.562-4.095-1.562-5.657,0L52,82.343V52h30.343l-7.313,7.313 c-1.562,1.562-1.562,4.095,0,5.657c1.562,1.562,4.095,1.562,5.657,0l14.142-14.143C96.391,49.267,96.391,46.733,94.828,45.171z"/></svg> </a>' +
				   '<a class="esconder plg-notify-hide"><svg class="hitbox" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M24 9c-10 0-18.54 6.22-22 15 3.46 8.78 12 15 22 15s18.54-6.22 22-15c-3.46-8.78-11.99-15-22-15zm0 25c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10zm0-16c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg></a></div><div class="sino plg-notify-bell"><svg class="hitbox" height="40" viewBox="0 0 1792 1792" width="35" xmlns="http://www.w3.org/2000/svg"><path d="M912 1696q0-16-16-16-59 0-101.5-42.5t-42.5-101.5q0-16-16-16t-16 16q0 73 51.5 124.5t124.5 51.5q16 0 16-16zm816-288q0 52-38 90t-90 38h-448q0 106-75 181t-181 75-181-75-75-181h-448q-52 0-90-38t-38-90q50-42 91-88t85-119.5 74.5-158.5 50-206 19.5-260q0-152 117-282.5t307-158.5q-8-19-8-39 0-40 28-68t68-28 68 28 28 68q0 20-8 39 190 28 307 158.5t117 282.5q0 139 19.5 260t50 206 74.5 158.5 85 119.5 91 88z"/></svg></div></div><a class="numeracao hitbox"><span class="plg-notify-counter">0</span></a>' +
				   '</div>' +
				   '<div class="hide notificacoes plg-notify-list"></div>' +
				   '</div></div>';
			dom  = addContentHTML( 'div', html, true );

			dom.classList.add( layout.container );
			document.body.appendChild( dom );

			//Cria mensagens da lista de notificação.
			//TODO: deletar na produção.
			modalMensages = '<li class="plgnot urgente"><span>20/06/2017</span><div>Essa mensagem é urgente !</div></li>' +
							'<li class="plgnot lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li>' +
							'<li class="plgnot lida urgente"><span>20/06/2017</span><div>Essa mensagem é urgente e já foi lida!</div></li>' +
							'<li class="plgnot"><span>12/06/2017</span><div>Uma mensagem muito muito muito muito muito muitolonga mesmo ...</div></li>';

			//aplica mensagens falsas no modal
			// TODO: deletar na produção.
			dom.getElementsByClassName( 'plg-notify-list' )[0].innerHTML = (
				modalMensages
			);

			console.info( 'Plugin adicionado na tela' );
		}

		//pega todas as
		layout.domcontainer = document.getElementsByClassName( layout.container )[0];
		layout.domplugin    = document.getElementsByClassName( layout.plugin )[0];
		layout.dombell      = document.getElementsByClassName( layout.bell )[0];
		layout.domcounter   = document.getElementsByClassName( layout.counter )[0];
		layout.domhide      = document.getElementsByClassName( layout.hide )[0];
		layout.domlist      = document.getElementsByClassName( layout.list )[0];
		layout.dommove      = document.getElementsByClassName( layout.move )[0];

		style = getComputedStyle( layout.domplugin );

		//pega duração das transições configurado no site, senão usa 300ms.
		layout.animationTime = parseFloat( style.transitionDuration.replace( /s|ms/, '' ) ) * (style.transitionDuration.match( 'ms' ) ? 1 : 1000) || 300;

		layout.width  = parseInt( style.width.substr( 0, style.width.indexOf( 'px' ) ) );
		layout.height = parseInt( style.height.substr( 0, style.width.indexOf( 'px' ) ) );

		style = getComputedStyle( layout.domlist );

		layout.widthList  = parseInt( style.width.substr( 0, style.width.indexOf( 'px' ) ) );
		layout.heightList = parseInt( style.height.substr( 0, style.width.indexOf( 'px' ) ) );

		//showToastr( { header:'Seja bem vindo(a) !' }, 0, 1.25, 0.1 );

		setPosition( 0, innerHeight - layout.height - layout.paddingY );
	}

	/**
	 * Configura layout do plugin com base em um elemento DOM
	 * @param {object} layout - elemento DOM.
	 */
	function setPreconfigLayout( layout ) {
		//a se definir
	}

	/**
	 * Configura layout
	 */
	function setLayout() {
		if ( _config.layout ) {
			setPreconfigLayout( _config.layout );
		}
		else {
			createLayout();
		}
	}

	/**
	 * Adiciona ouvintes para eventos internos.
	 * DragEvents e MouseEvents.
	 */
	function addListeners() {

		if ( layout.dommove ) {
			addEventListener( layout.dommove, events.mousedown, onMouseDown );
		}

		if ( layout.domhide ) {
			addEventListener( layout.domhide, events.mousedown, onMouseDown );
		}

		if ( layout.dombell ) {
			addEventListener( layout.dombell, events.mousedown, onMouseDown );
		}

		if ( layout.domlist ) {
			addEventListener( layout.domlist, events.click, openModal );
		}

		addEventListener( window, events.resize, windowResize );
		addEventListener( document, events.mousedown, onBlur );
		addEventListener( document, events.mouseup, onDragEnd );

		addEventListener( document, events.dragstart, onDragStart );
		addEventListener( document, events.dragend, onDragEnd );

	}

	/**
	 * Adiciona eventos do socket.
	 */
	function addSocketListeners() {
		if ( socket.hasListeners ) {
			return;
		}
		socket.hasListeners = true;

		//socket.on(events.notification, counterIncrement);
		//socket.on('hubs',events.refresh,counterIncrement);
		//socket.connection.client.receiveNotification = (counterIncrement);
		socket.connection.connection.socket.onmessage = counterIncrement;
	}

	/**
	 * Configurações iniciais do websocket.
	 *
	 * @returns ws = {{send, read}}
	 */
	function startSocket() {
		if ( !_config || !_config.ws || !_config.ws.url || !$ && !$.connection ) {
			console.warn( 'client de socket não detectado' );
			return;
		}
		if ( websocket ) {
			return console.warn( 'ws já instânciado.' );
		}

		if ( !socket || socket && socket.hasHubs ) {
			socket = _config.ws;

			if ( !socket.hasHubs ) {
				var hubs    = addContentHTML( 'script', '', true );
				hubs.src    = socket.url + '/hubs';
				hubs.onload = startSocket
				document.body.appendChild( hubs );
				socket.hasHubs = true;
				return;
			}

			socket.hasListeners = false;

			socket.connection    = $.connection.notificationHub;
			$.connection.hub.url = socket.url;

			try {
				$.connection.hub.start()
				 .done( addSocketListeners );
			}
			catch ( e ) {
				console.error( 'não foi possível conectar no socket.\n', e );
			}
		}
	}

	/**
	 * Publica métodos para uso externo.
	 */
	function publish() {
		//Exibe plugin quanto todos os outros métodos tiver terminados.
		layout.domplugin.classList.remove( 'hide' );
	}

	/**
	 * Ordem de inicialização do plugin.
	 */
	function init() {
		//getSysConfig();
		setEvents();
		setAPI(); //token e api
		setLayout();
		addListeners();
		startSocket();

		publish();
	}

	/**
	 * Inicia plugin
	 */
	init();

	//exporta metodos públicos
	return exports;
}
