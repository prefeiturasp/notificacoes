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
		'get' :_http.bind( {}, 'get' ),
		'post':_http.bind( {}, 'post' )
	};

	/**
	 * Métodos específicos.
	 * **/

	function arrayTimeToHTML( array ) {
		return array.map(
			function ( e ) {
				return '<li value="' + (e.TimeMinutes * 60) + '">Adiar ' + (e.Name) + '</li>';
			}
		).join( ' ' );
	}

	/**
	 * Exibie opções de 'Adiar' notificação.
	 * @param {event} e - evento do objeto clicado.
	 */
	function showLaterOptions( e, onclick, onblur ) {
		var html, pai;

		html = '<div class="plg-panel unselectable">';

		if ( _config.later ) {
			html += _config.later;
		}
		else {
			html += '<li value="15*60">Adiar 15 minutos</li>' +
					'<li value="30*60">Adiar 30 minutos</li>' +
					'<li value="1*60*60 ">Adiar 1 hora</li>' +
					'<li value="2*60*60 ">Adiar 2 horas</li>' +
					'<li value="4*60*60 ">Adiar 4 horas</li>' +
					'<li value="8*60*60 ">Adiar 8 horas</li>' +
					'<li value="1*60*24 ">Adiar 1 dia</li>' +
					'<li value="2*60*24 ">Adiar 2 dias</li>';
		}
		html += '</div>';

		html = addContentHTML( 'div', html, true ).childNodes[0];

		if ( !_config.onblur ) {
			_config.onblur = [];
		}
		_config.onblur.push( html );

		html.onclick = function ( e ) {
			console.log( e.target.value || e.target.parentNode.value );
			if ( onclick ) {
				onclick();
			}
			html.onblur();
		};

		/**
		 * Adiciona evento de onblur, para caso clique em outra parte que não seja o item.
		 *
		 * @param q
		 */
		html.onblur = function ( q ) {
			if ( q && (q.target === html || q.target.parentNode === html ) ) {
				return;
			}

			pai.removeChild( html );

			if ( onblur ) {
				onblur();
			}

			html.onblur = undefined;
			var i       = _config.onblur.indexOf( html );

			if ( i > -1 ) {
				_config.onblur.splice( i, 1 );
			}
		};

		pai = e.currentTarget.parentNode;

		pai.appendChild( html );

		html.style.zIndex = 190;
		//hasSpace(html, e.target );
		setPosition( e.x, e.y - html.clientHeight, html )

	}

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
		var modal, dialog, header, body, footer, text, title, fecharX, btnFechar, adiar;

		//adicionar modal
		modal = '<div class="plgmodal" id="plgmodal" aria-hidden="true">' +
				'<div class="plgmodal-dialog">' +
				'<div class="plgmodal-header">' +
				'<h2><span class="plgloader"></span></h2>' +
				'<a href="#" class="unselectable plgmodal-btn-close plgmodal-btn-big" aria-hidden="true">×</a>' +
				'</div>' +
				'<div class="plgmodal-body">' +
				'<p><span class="plgloader"></span></p>' +
				'</div>' +
				'<div class="plgmodal-footer">' +
				'<div class="plgmodal-left plg-icon-btn unselectable" id="plg-modal-adiar" title="Ler mais tarde">' +
				'<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="gray" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/></svg></div><div class="plgmodal-right">' +
				'<a href="#" class="plgmodal-btn-close plgmodal-btn unselectable">Fechar</a>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>';

		modal = addContentHTML( 'div', modal, true ).childNodes[0];

		dialog = modal.getElementsByClassName( 'plgmodal-dialog' )[0];

		header = modal.getElementsByClassName( 'plgmodal-header' )[0];
		body   = modal.getElementsByClassName( 'plgmodal-body' )[0];
		footer = modal.getElementsByClassName( 'plgmodal-footer' )[0];

		title = header.childNodes[0] || 'Algum titulo qualquer';
		text  = body.childNodes[0] || 'Algum texto qualquer';

		text.innerHTML  = dom.childNodes[1].innerHTML;
		title.innerHTML = dom.childNodes[0].innerHTML;

		btnFechar = footer.getElementsByClassName( 'plgmodal-btn-close' )[0];
		fecharX   = header.getElementsByClassName( 'plgmodal-btn-close' )[0];
		adiar     = footer.children['plg-modal-adiar'];

		adiar.onclick = function ( e ) {
			showLaterOptions( e, _onClick );
		};

		function _onClick( e ) {
			//showSnackbar( { header:'Voçê adiou a mensagem modal !' } );
			fecharX.onclick();
		}

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
		};

		//adiciona na tela
		document.body.appendChild( modal );

		setTimeout(
			function () {
				dialog.style.top = "20%";
			},
			layout.animationTime * .5
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
	 * Analisa onde deve abrir a item.
	 * Se retorna falso a lista não cabe na tela.
	 * @param {ElementDOM} obj - objeto que será posicionado na tela.
	 * @param {ElementDOM} pai - objeto sobre o qual será posicionado na tela.
	 * @returns {boolean} - true se não pode abrir
	 */
	function hasSpace( dom, pai ) {
		var plugin      = {
			x:pai && pai.x || layout.x || 0,
			y:pai && pai.y || layout.y || 0,
			w:pai && pai.offsetWidth || layout.width,
			h:pai && pai.offsetHeight || layout.height
		};
		var list        = {
			x:0,
			y:0,
			w:dom.clientWidth,
			h:dom.clientHeight
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
				setPosition( rect.x - layout.paddingX, rect.y - layout.paddingY, dom );
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
		if ( !hasSpace( layout.domlist ) ) {
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
	 * Está sendo usado Debounce para evitar muiltiplos disparos e calculos excessivos.
	 * @param {event} e - evento de resize.
	 */
	var windowResize = (function (  ) {
		'use strict';

		var timeWindow = 500; // tempo em ms
		var timeout;

		function onResize() {
			setPosition( layout.domplugin.offsetLeft, layout.domplugin.offsetTop );
		}

		return function() {
			var context = this;
			var args = arguments;
			clearTimeout(timeout);
			timeout = setTimeout(function(){
				onResize.apply(context, args);
			}, timeWindow);
		};
	})();

	/**
	 * Tratamento para plugin perder foco.
	 * @param {event} e - evento de onblur.
	 */
	function onBlur( e ) {
		// Se a lista estiver NÃO aberta ou,
		// Clicar no plugin E NÃO for no sino,
		// então retorna.
		var hasFocus, arr;
		hasFocus = !listOpened || ( e && e.target.className.match( 'plg' ) && e.target !== layout.dombell );

		if ( !_config.onblur ) {
			_config.onblur = [];
		}

		arr = _config.onblur;

		if ( arr.length ) {
			arr.some(
				function ( item ) {
					return e.target !== item && !item.onblur( e );
				}
			);
		}

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
	 * @param {object.header} header - mensagem que será exibida no cabeçário.
	 * @param {object.body} body - mensagem que será exibida no corpo do modal.
	 * @param {number} y - posição na vertical do toaster.
	 * @param {number} time - tempo de duração do toaster.
	 * @param {number} delay - tempo de esperar para abrir o toaster.
	 */
	function showSnackbar( msg, y, time, delay ) {
		var uid, i, dom, html, openSnackbar, hideSnackbar, destroySnackbar, cancelHide, restoreHide;

		//Verifica se tem mais de um toaster
		if ( !_config.snackbar ) {
			_config.snackbar = [];
		}
		//se tiver, não exibe outro ( a se definir )
		else if ( _config.snackbar.length ) {
			return;
		}

		// Cria html do snackbar
		layout.domsnackbar = html = '<div class="unselectable plgsnackbar">' +
									'<div class="plgsnackbar-center" title="Ler mensagem">' +
									'<span class="plgsnackbar-header">' + ((msg && msg.header) ? msg.header : 'titulo da notificação muito longa ') + '</span>' +
									'<span class="plgsnackbar-body">' + ((msg && msg.body) ? msg.body : 'mensagem muito longa mesmo') + '</span>' +
									'</div>' +
									'<button class="plgsnackbar-right" title="Ler mais tarde">' +
									'<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="white" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/></svg>' +
									'</button>' +
									'</div>';

		uid = {};
		dom = addContentHTML( 'div', html, true ).childNodes[0];
		document.body.appendChild( dom );

		layout.domsnackbar = html = dom;

		// Configura valores padrões da animação.
		y     = y ? y : 50;
		delay = delay ? delay : 0.15;
		time  = time ? time : 2;

		html.getElementsByClassName( 'plgsnackbar-right' )[0].onclick = function ( e ) {
			//Remove eventos de blur da notificação.
			cancelHide();
			html.onmouseover = undefined;
			html.onmouseout  = undefined;

			showLaterOptions( e, onClick, onBlurOptions );
		};

		/**
		 * Restaura eventos de blur da notificação
		 */
		function onBlurOptions() {
			restoreHide();
			html.onmouseover = cancelHide;
			html.onmouseout  = restoreHide;
		}

		function onClick() {
			hideSnackbar();
			setTimeout(
				function () {
					showSnackbar( { header:'adiou a mensagem da snackbar!.' } );
				}, 3
			)
		}

		// deixa snackbar visivel
		layout.domsnackbar.openSnackbar = openSnackbar = function () {
			//Deixa toaster visivel
			dom.style.opacity    = 0.85;
			dom.style.bottom     = y + 'px';
			dom.style.visibility = 'visible';

			uid[2] = setTimeout(
				hideSnackbar, time * 1000 // tempo de exibição
			);
		};

		// esconde snackbar
		layout.domsnackbar.hideSnackbar = hideSnackbar = function () {
			html.onmouseout = html.onmouseover = undefined;

			//esconde toaster
			dom.style.opacity    = 0;
			dom.style.bottom     = '-50px';
			dom.style.visibility = 'hidden';

			uid[3] = setTimeout(
				destroySnackbar, layout.animationTime //tempo até remover da tela e animação
			);
		};
		//destroi snackbar
		layout.domsnackbar.destroySnackbar = destroySnackbar = function () {
			cancelHide();
			//remove da tela toaster
			document.body.removeChild( dom );
			html.getElementsByClassName( 'plgsnackbar-right' )[0].onclick = undefined;
			//remove referências dessa função.(evitar memory leak )
			i                                                             = _config.snackbar.indexOf( uid );
			_config.snackbar.splice( i, 1 );

			uid[1] = uid[2] = uid[3] = undefined;
			layout.domsnackbar = html = dom = i = uid = undefined;
		};

		// impede snackabar de esconder
		layout.domsnackbar.cancelHide = cancelHide = function ( e ) {
			clearTimeout( uid[2] );
		};

		//restora snackabar função de esconder
		layout.domsnackbar.restoreHide = restoreHide = function ( e ) {
			uid[2] = setTimeout(
				hideSnackbar, time * 1000 // tempo de exibição
			);
		};

		//se PASSAR o mouse por cima da snackbar impede de esconder
		html.onmouseover = cancelHide;
		//se TIRAR o mouse por cima da snackbar restaura de esconder
		html.onmouseout  = restoreHide;

		//salva referencia dos setTimeout, para poder cancelar , se necessário.
		_config.snackbar.push( uid );
		uid[1] = setTimeout(
			openSnackbar,
			delay * 1000 // delay inicial
		);
	}

	/**
	 * Atualiza elemento com número.
	 * @param {Object} res - respostar do socket, quando recebe novas notificações
	 */
	function counterIncrement( res ) {
		//showSnackbar(res);
		showSnackbar();
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
				select   :'select',

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

		if ( !api && _config.url ) {
			_config.url += (_config.url[_config.url.length] === '/' ? 'api/v1/' : '/api/v1/');

			api = {
				adiar   :_config.url + 'DelayTime',
				perturbe:_config.url + 'DisturbTime'
			};
		}

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
			container   :'plg',
			plugin      :'plg-notify',
			counter     :'plg-notify-counter',
			bell        :'plg-notify-bell',
			hide        :'plg-notify-hide',
			notification:'plg-notificacoes',
			list        :'plg-list',
			move        :'plg-notify-move',
			toaster     :'plgsnackbar',

			dombell        :undefined,
			domcounter     :undefined,
			domlist        :undefined,
			domnotification:undefined,
			domhide        :undefined,
			dommove        :undefined,

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
			css = '.plgtab{position:fixed;width:inherit}.plgtablink{background-color:#555;color:#fff;float:left;border:none;outline:0;cursor:pointer;padding:14px 16px;font-size:17px;width:40%;height:48px}.plgtablink:first-child{border-top-left-radius:10px}.plgtablink:hover{background-color:#777}.plgtablink-setting{border-top-right-radius:10px;width:20%}.tabcontent{color:#fff;display:none;padding:50px;text-align:center}.plgsnackbar{visibility:hidden;width:250px;margin-left:-125px;background-color:#333;color:#fff;text-align:center;position:fixed;z-index:150;left:50%;bottom:0;opacity:0;cursor:pointer;border-radius:10px;display:flex;-webkit-user-select:none;-ms-user-select:none;-moz-user-select:none;user-select:none}.plg-icon-btn,.plgsnackbar button{overflow:hidden;background-color:transparent;border:none;outline:0}.plgsnackbar span{display:block;text-transform:lowercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.plgsnackbar-right{width:36px;border-top-right-radius:10px;border-top-left-radius:0;border-bottom-right-radius:10px;border-bottom-left-radius:0}.plgsnackbar-center{padding:8px 4px 8px 8px;width:202px;border-top-right-radius:0;border-top-left-radius:10px;border-bottom-right-radius:0;border-bottom-left-radius:10px}.plgsnackbar-center span::first-letter{text-transform:uppercase}.plg-icon-btn:hover,.plgsnackbar-center:hover,.plgsnackbar-left:hover,.plgsnackbar-right:hover{background-color:#505050;cursor:pointer}.plgsnackbar-header{font-weight:700}.plg-icon-btn{height:24px;border-radius:10px;background-color:transparent;width:24px}.plg-icon-btn:hover path{color:#d3d3d3;fill:#fff}.plgloader{border:8px solid #f3f3f3!important;border-top:8px solid #3498db!important;border-radius:50%;width:36px!important;height:36px!important;animation:2s linear infinite spin}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}[draggable]{-moz-user-select:none;-khtml-user-select:none;-webkit-user-select:none;user-select:none;-khtml-user-drag:element;-webkit-user-drag:element}.draggable{position:absolute}.draggable,.draggable>*,.plg-notificacoes li{display:inline-block}.draggable>i{cursor:move}.hide{display:none!important}.hitbox{pointer-events:none;padding:0;margin:0}.plg-notificacoes{position:fixed;background:#fff;width:320px;display:inline-block;border:1px solid #ddd;box-shadow:0 0 10px 4px rgba(0,0,0,.1);border-radius:10px;overflow:hidden;height:420px;-webkit-transition:none!important;-moz-transition:none!important;-ms-transition:none!important;-o-transition:none!important;transition:none!important}.plg-notificacoes li{width:100%;padding:8px 0 8px 8px;border-bottom:1px solid rgba(235,238,240,.31);font-size:1rem;overflow:hidden;height:42px}.plg-notificacoes li:last-child{border-bottom:0}.plg-notificacoes li:nth-child(odd){background:#fafbfb}.plg-notificacoes li.lida{opacity:.5}.plg-notificacoes li.urgente{background:#d11d1d;color:#fff}.plg-notificacoes li.urgente *{color:#fff}.plg-notificacoes li p,.plg-notificacoes li span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;max-width:90%;min-width:30%;font-size:1.2rem;display:block;font-weight:900;color:#768e99}.circulo,.float-menu{border-radius:100%;width:80px;height:80px}.circulo{box-sizing:border-box;overflow:hidden}.float-menu{display:block;position:fixed;user-select:none;color:#fff;box-shadow:4px 4px 4px rgba(0,0,0,.3);font-family:sans-serif}.float-menu .lateral{width:38px;left:42px;position:absolute;height:40px}.float-menu .lateral a{display:inline-block;width:100%;text-align:center;padding:7px;box-sizing:border-box;background:#f32f2f;font-weight:600;font-size:15px;cursor:pointer;border-radius:100%;height:40px}.float-menu a.numeracao{background:#ff9800;cursor:default;position:absolute;right:0;top:-10px;height:16px;width:16px;padding:5px;margin:auto;border-radius:100%;font-weight:700;z-index:5}.float-menu a.numeracao:hover{background:#ffd200;color:#000}.float-menu .lateral a.esconder svg{margin-top:0}.float-menu .lateral a:hover{background:#a91b1b}.float-menu .lateral a svg{fill:#fff;margin-top:7px}.float-menu .lateral a:first-child{border-bottom:0;border-radius:0 100% 0 0}.float-menu .lateral a:last-child{border-bottom:0;border-radius:0 0 100%}.sino{width:50px;height:80px;cursor:pointer;padding:20px 0 0 10px;box-sizing:border-box;position:relative;background-color:#232b38}.sino svg{fill:#fff}.sino:hover{background:#3d4d60}.shake-anime{animation:1s cubic-bezier(.36,.07,.19,.97) both shake;transform:translate3d(0,0,0);backface-visibility:hidden;perspective:1000px}@keyframes shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}.plgmodal-btn{background:#428bca;border:1px solid #357ebd;border-radius:3px;color:#fff;display:inline-block;font-size:14px;padding:8px 15px;text-decoration:none;text-align:center;min-width:60px;position:relative;transition:color .1s ease}.plgmodal-btn:hover{background:#357ebd}.plgmodal-btn-big{color:#aaa;font-size:30px;text-decoration:none;position:absolute;right:5px;top:0}.plgmodal-btn-close:hover{color:#000}.plgmodal{display:block;background:rgba(0,0,0,.6);position:fixed;top:0;left:0;right:0;bottom:0;z-index:210}.plgmodal:target:before{display:block}.plgmodal-dialog{background:#fefefe;border:1px solid #333;border-radius:5px;margin-left:-200px;position:fixed;max-height:60%;left:50%;top:-10%;z-index:211;width:360px}.plgmodal-dialog a{cursor:pointer}.plgmodal-body{padding:20px}.plgmodal-footer,.plgmodal-header{padding:10px 20px}.plgmodal-header{border-bottom:1px solid #eee}.plgmodal-header h2{font-size:20px;margin:0}.plgmodal-footer{display:flex;border-top:1px solid #eee;height:30px}.plgmodal-left,.plgmodal-right{text-align:right;position:absolute}.plgmodal-right{right:10px}.plgmodal-left{left:10px}.plg-list{margin-top:48px;overflow-y:auto;overflow-x:hidden;height:376px}li.plgnot>*{pointer-events:none}li.plgnot:hover{background-color:rgba(112,128,144,.42)!important}li.plgnot:hover>*{color:#000!important}';
			addContentHTML( 'style', css );

			//adicionar plugin
			html = '<div draggable="true" class="unselectable hide float-menu plg-notify">' +
				   '<div class="circulo">' +
				   '<div class="lateral">' +
				   '<a class="mover plg-notify-move"><svg class="hitbox" enable-background="new 0 0 96 96" height="17" version="1.1" viewBox="0 0 96 96" width="17" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M94.828,45.171L80.687,31.029c-1.562-1.562-4.095-1.562-5.657,0c-1.562,1.562-1.562,4.095,0,5.657L82.344,44H52V13.657 l7.313,7.313c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L50.828,1.171c-1.562-1.562-4.095-1.562-5.657,0 L31.029,15.314c-1.562,1.562-1.562,4.095,0,5.657s4.095,1.562,5.657,0L44,13.657V44H13.657l7.313-7.313 c1.562-1.562,1.562-4.095,0-5.657s-4.095-1.562-5.657,0L1.171,45.171c-1.562,1.562-1.562,4.095,0,5.657l14.143,14.143 c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L13.657,52H44v30.344l-7.313-7.314 c-1.562-1.562-4.095-1.562-5.657,0c-1.562,1.562-1.562,4.095,0,5.657l14.142,14.142c1.562,1.562,4.095,1.562,5.657,0l14.143-14.142 c1.562-1.562,1.562-4.095,0-5.657c-1.562-1.562-4.095-1.562-5.657,0L52,82.343V52h30.343l-7.313,7.313 c-1.562,1.562-1.562,4.095,0,5.657c1.562,1.562,4.095,1.562,5.657,0l14.142-14.143C96.391,49.267,96.391,46.733,94.828,45.171z"/></svg> </a>' +
				   '<a class="esconder plg-notify-hide"><svg class="hitbox" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M24 9c-10 0-18.54 6.22-22 15 3.46 8.78 12 15 22 15s18.54-6.22 22-15c-3.46-8.78-11.99-15-22-15zm0 25c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10zm0-16c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg></a></div><div class="sino plg-notify-bell"><svg class="hitbox" height="40" viewBox="0 0 1792 1792" width="35" xmlns="http://www.w3.org/2000/svg"><path d="M912 1696q0-16-16-16-59 0-101.5-42.5t-42.5-101.5q0-16-16-16t-16 16q0 73 51.5 124.5t124.5 51.5q16 0 16-16zm816-288q0 52-38 90t-90 38h-448q0 106-75 181t-181 75-181-75-75-181h-448q-52 0-90-38t-38-90q50-42 91-88t85-119.5 74.5-158.5 50-206 19.5-260q0-152 117-282.5t307-158.5q-8-19-8-39 0-40 28-68t68-28 68 28 28 68q0 20-8 39 190 28 307 158.5t117 282.5q0 139 19.5 260t50 206 74.5 158.5 85 119.5 91 88z"/></svg></div></div><a class="numeracao hitbox"><span class="plg-notify-counter">0</span></a>' +
				   '</div>' +
				   '<div class="hide plg-notificacoes">' +
				   '<div class="plgtab ">' +
				   '<button class="plgtablink">Lida</button>' +
				   '<button class="plgtablink">Novas</button>' +
				   '<button class="plgtablink-setting plgtablink " title="Configurações">' +
				   '<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#000000" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/></svg>' +
				   '</button>' +
				   '</div>' +
				   '<div class="plg-list unselectable"></div>' +
				   '</div>' +
				   '</div></div>';
			dom  = addContentHTML( 'div', html, true );

			dom.classList.add( layout.container );
			document.body.appendChild( dom );

			//Cria mensagens da lista de notificação.
			//TODO: deletar na produção.
			modalMensages = '<li class="plgnot urgente"><span>20/06/2017</span><div>Essa mensagem é urgente !</div></li>' +
							'<li class="plgnot lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li>' +
							'<li class="plgnot lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li>' +
							'<li class="plgnot lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li>' +
							'<li class="plgnot lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li>' +
							'<li class="plgnot lida"><span>15/06/2017</span><div>Esta mensagem já foi lida.</div></li>' +
							'<li class="plgnot lida urgente"><span>20/06/2017</span><div>Essa mensagem é urgente e já foi lida!</div></li>' +
							'<li class="plgnot"><span>12/06/2017</span><div>Uma mensagem muito muito muito muito muito muitolonga mesmo ...</div></li>';

			//aplica mensagens falsas no modal
			// TODO: deletar na produção.
			dom           = dom.getElementsByClassName( layout.list )[0];
			dom.innerHTML = (
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
		layout.domlist      = document.getElementsByClassName( layout.notification )[0];
		layout.dommove      = document.getElementsByClassName( layout.move )[0];

		//style = getComputedStyle( layout.domplugin );

		//pega duração das transições configurado no site, senão usa 300ms.
		//layout.animationTime = parseFloat( style.transitionDuration.replace( /s|ms/, '' ) ) * (style.transitionDuration.match( 'ms' ) ? 1 : 1000) || 300;

		//layout.width  = parseInt( style.width.substr( 0, style.width.indexOf( 'px' ) ) );
		//layout.height = parseInt( style.height.substr( 0, style.width.indexOf( 'px' ) ) );

		//style = getComputedStyle( layout.domlist );

		//layout.widthList  = parseInt( style.width.substr( 0, style.width.indexOf( 'px' ) ) );
		//layout.heightList = parseInt( style.height.substr( 0, style.width.indexOf( 'px' ) ) );

		//showSnackbar( { header:'Seja bem vindo(a) !' }, 0, 1.25, 0.1 );

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
		if ( !_config || !_config.ws || !_config.ws.url || !window.$ || window.$ && !$.connection ) {
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
				hubs.src    = socket.url + ( socket.url[socket.url.length] === '/' ? 'hubs' : '/' + 'hubs');
				hubs.onload = startSocket;
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

		var disturbe = localStorage.getItem( 'disturbe' ), later = localStorage.getItem( 'later' );
		//if( later || disturbe ){
		//	_config.disturbe=disturbe;
		//	_config.later=later;
		//
		//	return;
		//}

		http.get(
			api.perturbe, {
				header :{
					'Content-Type' :'application/json;charset=UTF-8',
					'Authorization':'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyN0ExREZGMzgzM0E3NzM0MTQwRkUxRjVEMDEwODQ4NEUxNjgwMjciLCJ0eXAiOiJKV1QiLCJ4NXQiOiJFbm9kX3pnenAzTkJRUDRmWFFFSVNFNFdnQ2MifQ.eyJuYmYiOjE0OTg1OTA0NDUsImV4cCI6MTQ5ODU5NDA0NSwiaXNzIjoiaHR0cDovLzEwLjEwLjEwLjM3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzEwLjEwLjEwLjM3OjUwMDAvcmVzb3VyY2VzIiwiYXBpMSJdLCJjbGllbnRfaWQiOiJtc3RlY2hqcyIsInN1YiI6ImI4OGM2ZmY4LWY3MjEtZTIxMS1hNThkLTAwMTU1ZDAyZTcxNiIsImF1dGhfdGltZSI6MTQ5ODU5MDM3MSwiaWRwIjoibG9jYWwiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3ByaW1hcnlzaWQiOiI2Y2Y0MjRkYy04ZWMzLWUwMTEtOWIzNi0wMDE1NWQwMzMyMDYiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoidXN1YXJpby5zcWEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJ1c3Vhcmlvc3FhQG1zdGVjaC5jb20uYnIxMTEiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwiYXBpMSJdLCJhbXIiOlsicHdkIl19.t8qQYFDftCR5PhQmobzcc6X31v4-tJSP6wy_p_kKheLrErtigPwgCogCzUOfTMJGr87YkhUfYLFd9KCCRqTmU1J4vFlYg42YqR2dDfRIs87TVctAB3DjSmv-xqBXPP4UjhxHJm9JKbxVyvLu-7swoQ0k4N5f8V-EdlS75kUrIDFAnI4HSYIoBwEqOV3mcqPbnBSXy13StLRvSkVEORSiS4C16dUp9EaI1X9PUegLPGpXVaqA5ZdDnIw-dl-EFBAqHBU5eBpz-01C2_Uvyi-fQ5q5tYHxnWptU8t-kafo1UtT0amaf-eYUR8U2sHJv6r97gJS2xBb7mzXJj22YLYmvA'
				},
				success:cachaTime.bind( {}, 'disturbe' ),
				error  :errorCallback
			}
		);

		http.get(
			api.adiar, {
				header :{
					'Content-Type' :'application/json;charset=UTF-8',
					'Authorization':'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyN0ExREZGMzgzM0E3NzM0MTQwRkUxRjVEMDEwODQ4NEUxNjgwMjciLCJ0eXAiOiJKV1QiLCJ4NXQiOiJFbm9kX3pnenAzTkJRUDRmWFFFSVNFNFdnQ2MifQ.eyJuYmYiOjE0OTg1OTA0NDUsImV4cCI6MTQ5ODU5NDA0NSwiaXNzIjoiaHR0cDovLzEwLjEwLjEwLjM3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzEwLjEwLjEwLjM3OjUwMDAvcmVzb3VyY2VzIiwiYXBpMSJdLCJjbGllbnRfaWQiOiJtc3RlY2hqcyIsInN1YiI6ImI4OGM2ZmY4LWY3MjEtZTIxMS1hNThkLTAwMTU1ZDAyZTcxNiIsImF1dGhfdGltZSI6MTQ5ODU5MDM3MSwiaWRwIjoibG9jYWwiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3ByaW1hcnlzaWQiOiI2Y2Y0MjRkYy04ZWMzLWUwMTEtOWIzNi0wMDE1NWQwMzMyMDYiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoidXN1YXJpby5zcWEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJ1c3Vhcmlvc3FhQG1zdGVjaC5jb20uYnIxMTEiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwiYXBpMSJdLCJhbXIiOlsicHdkIl19.t8qQYFDftCR5PhQmobzcc6X31v4-tJSP6wy_p_kKheLrErtigPwgCogCzUOfTMJGr87YkhUfYLFd9KCCRqTmU1J4vFlYg42YqR2dDfRIs87TVctAB3DjSmv-xqBXPP4UjhxHJm9JKbxVyvLu-7swoQ0k4N5f8V-EdlS75kUrIDFAnI4HSYIoBwEqOV3mcqPbnBSXy13StLRvSkVEORSiS4C16dUp9EaI1X9PUegLPGpXVaqA5ZdDnIw-dl-EFBAqHBU5eBpz-01C2_Uvyi-fQ5q5tYHxnWptU8t-kafo1UtT0amaf-eYUR8U2sHJv6r97gJS2xBb7mzXJj22YLYmvA'
				},
				success:cachaTime.bind( {}, 'later' ),
				error  :errorCallback
			}
		);

		function errorCallback( r, s, x ) {
			console.error( r );
		};
		function cachaTime( string, data ) {
			if ( string && data ) {

				if ( typeof data === 'string' ) {
					_config[string] = arrayTimeToHTML( JSON.parse( data ) );
					data            = ( data );
				}

				localStorage.setItem( string, data );
			}
		}
	}

	/**
	 * Ordem de inicialização do plugin.
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

	/**
	 * Inicia plugin
	 */
	init();

	//exporta metodos públicos
	return exports;
}
