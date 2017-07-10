//noinspection ProblematicWhitespace
// noinspection JSUnresolvedVariable
/**
 * Created by ale on 6/13/17.
 */
function plgnotify( sysconfig ) {
	"use strict";

	// Variaveis globais do plugin
	var events, api, token, websocket, layout, http, _config, exports, socket;
	_config = sysconfig;
	exports = {};

	//Variáveis de controle de drag & drop.
	var offX, offY, dragging;

	// Visibilidade do plugin e lista de notificações
	var hideSnackbar, hidden, listOpened;

	//Contador de total de notificações.
	var counter              = 0;
	var pageSize             = 1;
	var paginator            = {
		read  :{
			page :0,
			size :10,
			total:Infinity
		},
		unread:{
			page :0,
			size :10,
			total:Infinity
		}
	};
	var selectedNotification = {
		'NotificationId':undefined,
		'Read'          :undefined,
		'DelayId'       :undefined
	};
	// noinspection JSUnresolvedVariable
	var _body                = document.body;

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
		var xhr = new XMLHttpRequest();

		if ( !xhr ) {
			alert( 'Não é possível fazer XHR.' );
			return false;
		}
		xhr.open( method, url, true );

		if ( config ) {
			if ( config.header ) {
				var property, obj = config.header;
				for ( property in obj ) {
					if ( obj.hasOwnProperty( property ) ) {
						xhr.setRequestHeader( property, obj[property] );
					}
				}
			}

		}

		xhr.onreadystatechange = function () {
			if ( this.readyState === XMLHttpRequest.DONE ) {
				if ( this.status === 200 ) {
					config && config.success && config.success( this );
				}
				else {
					config && config.error && config.error( this );
				}
			}
		};

		if ( method === 'get' ) {
			xhr.send();
		}
		else if ( method === 'post' ) {
			xhr.send( JSON.stringify( config.data ) );
		}
	}

	// macro para requisições, get e post
	http = {
		'get' :_http.bind( {}, 'get' ),
		'post':_http.bind( {}, 'post' )
	};

	/**
	 * Métodos específicos.
	 * **/

	function isSafari() {
		var is_safari = navigator.userAgent.toLowerCase().indexOf( 'safari/' ) > -1;
		return is_safari;

	}

	/**
	 * Formata cabeçario das requisições.
	 * @param type
	 * @returns {{groupSid: *, Authorization: *, Content-Type: *, Page: number, Size: *}}
	 */
	function getPaginationHeader( type ) {
		return {
			'groupSid'     :_config.header.groupSid,
			'Authorization':_config.header.Authorization,
			'Content-Type' :_config.header['Content-type'],
			'Page'         :paginator[type].page,
			'Size'         :paginator[type].size
		}
	}

	/**
	 * Controla efeito de loading da paginação.
	 */
	function tooglePagination() {
		var loader, span;
		if ( !this.childElementCount ) {
			return console.error( 'Pagination sem elementos' );
		}

		loader       = this.childNodes[1];
		span         = this.childNodes[0];
		this.loading = !this.loading;

		if ( !loader.classList.contains( 'hide' ) ) {
			loader.classList.add( 'hide' );
			span.classList.remove( 'hide' );
		}
		else {
			span.classList.add( 'hide' );
			loader.classList.remove( 'hide' );
		}
	}

	/**
	 * Adicina dados acima da páginação.
	 * @param pai
	 * @param dados
	 */
	function paginationNewContent( element, dados ) {
		var pai   = element.parentNode;
		var child = addContentHTML( 'a', dados, true );

		pai.insertBefore( child, element );
	}

	/**
	 * Controla a visibilidade da paginação.
	 */
	function paginationVisibility( t ) {
		if ( paginator[t].total > 0 ) {
			layout['domPag' + events[t]].classList.remove( 'hide' );
		}
		else {
			layout['domPag' + events[t]].classList.add( 'hide' );
		}
	}

	/**
	 *
	 * Valida se ainda tem paginação
	 */
	function paginationValidate( t, l ) {
		if ( !l.length || l.length < paginator[t].size ) {
			paginator[t].total = 0;
		}

		paginationVisibility( t );
	}

	/**
	 * Tratamento para caso haja mais páginas.
	 * @param lista - dados
	 */
	function paginationSuccess( type, lista ) {
		this.toogle();
		lista = JSON.parse( lista );

		paginationNewContent( this, notificationHTML( type, lista ).join( ' ' ) );
		paginationValidate( type, lista );
		if ( type === events.unread ) {
			counterIncrement( counter + lista.length );
		}
	}

	/**
	 * Tratamento para quando é clicado na paginação.
	 * @param mouseEvent
	 */
	function paginationClick( type, mouseEvent ) {
		var dom = mouseEvent && mouseEvent.currentTarget;
		if ( !dom || dom.loading ) {
			return;
		}

		//tratamento http para terminar de carregar ao final da requisição
		//callback de sucess deve validar se há mais paginas disponíveis
		this.toogle();

		++paginator[type].page;

		if ( events.unread === type ) {
			getUnreadList( paginationSuccess.bind( dom, type ) );
		}
		else {
			getReadList( paginationSuccess.bind( dom, type ) );
		}

		//paginationSuccess.bind( dom )(
		//	'<li class="plgnot">1</li>' +
		//	'<li class="plgnot">2</li>' +
		//	'<li class="plgnot">3</li>' +
		//	'<li class="plgnot">4</li>' +
		//	'<li class="plgnot">5</li>'
		//);
	}

	/**
	 * Aciona temporizador
	 */
	function updater() {
		window.requestAnimationFrame = window.requestAnimationFrame
									   || window.mozRequestAnimationFrame
									   || window.webkitRequestAnimationFrame
									   || window.msRequestAnimationFrame
									   || function ( f ) {
				return setTimeout( f, 1000 * 60 * 60 )
			}; // a cada minuto

		window.cancelAnimationFrame = window.cancelAnimationFrame
									  || window.mozCancelAnimationFrame
									  || function ( requestID ) {
				clearTimeout( requestID )
			}; //fall back
	}

	/**
	 * Cancela não perturbe.
	 */
	function disturbCancel( e ) {

		hideSnackbar = false;
		localStorage.removeItem( events.disturbTime );
		localStorage.removeItem( events.disturbTimeText );
		events.disturbId = undefined;

		if ( e ) {
			layout.domdisturbcancel.classList.add( 'hide' );
			document.querySelector( '.disturb p' ).innerHTML = "Mais opções";
		}
	}

	/**
	 * Valida se já acabou o tempo de 'não perturbe'.
	 */
	function disturbValidator() {
		var timeout, _local, texto;

		_local = localStorage.getItem( events.disturbTime );
		_local = parseInt( _local );

		if ( _local ) {
			timeout = (_local - Date.now()) > 0;
		}

		//Se o tempo do 'não perturbe' estiver ativo.
		if ( timeout ) {
			hideSnackbar = true;
			if ( events.disturbId ) {
				return;
			}

			//cancelAnimationFrame(localStorage.getItem(events.disturbId));
			//noinspection JSUndeclaredVariable
			requestAnimationFrame = setTimeout( disturbValidator, (_local - Date.now() | 0) );

			texto           = document.querySelector( '.disturb p' );
			texto.innerHTML = localStorage.getItem( events.disturbTimeText );

			//localStorage.setItem(events.disturbId, requestAnimationFrame(disturbValidator) );
			events.disturbId = requestAnimationFrame;
			layout.domlist.getElementsByClassName( 'cancelar' )[0].classList.remove( 'hide' );
			console.log( 'HideSnackbar' );
		}
		else if ( _local ) {
			console.info( 'Acabou não perturbe' );
			disturbCancel();
			layout.domplugin.classList.add( 'shake-anime' );
		}
	}

	/**
	 * Tratamento para quando seleciona um opção do não perturbe.
	 */
	function selectedDisturbOption( target ) {
		hidePlugin();
		hideList();
		disturbCancel();

		document.querySelector( '.disturb p' ).innerHTML = target.innerHTML;

		localStorage.setItem( events.disturbTime, (Date.now() + target.value) );
		localStorage.setItem( events.disturbTimeText, (target.innerHTML) );

		disturbValidator();
	}

	/**
	 * Exibie opções de 'não perturbe'.
	 * @param {event} e - evento do objeto clicado.
	 */
	function showDisturbOptions( e, onclick, onblur ) {
		var html, pai;

		//Valida se tem dados no local storage.
		if ( !_config.disturb ) {
			_config.disturb = getDisturbOptionsList(
				function success() {
					//valida se elemento ta na tela
					if ( html.parentNode ) {
						html.innerHTML = _config.disturb;
						setPosition( e.x, e.y - html.clientHeight, html );
					}
				},
				function error() {
					if ( html.parentNode ) {
						_config.disturb = '<h5>É preciso logar.</h5>';
						html.innerHTML  = _config.disturb;

					}
				}
			);
		}

		html = '<div class="plg-panel unselectable">';
		if ( _config.disturb ) {
			html += _config.disturb;
		}
		html += '</div>';

		html = addContentHTML( 'div', html, true ).childNodes[0];

		// evento para quando selecionar item da lista.
		html.onclick = function ( e ) {
			if ( html.onblur ) {
				html.onblur();
			}

			//se tiver 'value' e 'onclick' executa onclick
			if ( !isNaN( parseInt( e.target && e.target.value ) ) && onclick ) {
				onclick( e.target );
			}
		};

		// Adiciona evento de onblur, para caso clique em outra parte que não seja o item.
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

		pai = (e.currentTarget || e.target);

		if ( !pai ) {
			console.error( 'não existe elemeto.' );
			return;
		}
		pai = pai.parentNode;
		pai.appendChild( html );

		_config.onblur.push( html );

		html.style.zIndex = 190;
		//hasSpace(html, e.target );
		setPosition( e.pageX, e.pageY - html.clientHeight, html )
	}

	/**
	 * Mostra conteúdo da tab selecionada.
	 * @param {ElementDOM} tab - tab selecionada.
	 */
	function showTabContent( tab ) {

		if ( tab === document.querySelector( '.plgtablink-setting' ) ) {
			_config.onblur.push( layout.domdisturbcancel );
		}
		//Pegar tab selecionada
		// ocultar conteúdo
		// exibir novo conteúdo
	}

	/**
	 * Controla seleção de tabs.
	 * @param {event} e - evento de click.
	 */
	function selectTab( e ) {
		var domlastTab = layout.domlist.getElementsByClassName( 'visited' )[0];

		//remove classe da ultima tab clicada.
		if ( domlastTab ) {
			domlastTab.classList.remove( 'visited' );
		}
		layout.domtab = (e.currentTarget || e.target);
		layout.domtab.classList.add( 'visited' );

		showTabContent( layout.domtab, domlastTab );
	}

	/**
	 * Aplica valores do elemento em um html e retorna '<li>'
	 * @param e - elemento do array.
	 * @returns {string} - string do elemento DOM.
	 */
	function timeToHTML( e ) {
		return '<li id="' + (e.Id) + '" value="' + (e.TimeMinutes * 60 * 1000) + ' ">' + (e.Name) + '</li>';
	}

	/**
	 * converte lista de tempos para html.
	 * @param array - lista de tempos para 'adiar'/'não pertuber'
	 * @returns {string|*} html
	 */
	function arrayTimeToHTML( array ) {
		//itera em nos elementos convertendo-os,gera novo array e remove ',' por espaço.
		return array.map( timeToHTML ).join( ' ' );
	}

	/**
	 * Tratamento para quando seleciona um opção do não perturbe.
	 */
	function selectedLaterOption( data ) {
		//http://10.10.10.37:5019/Help/Api/POST-api-v1-Notification-id-Action
		http.post(
			api.later( data.NotificationId ), {
				header :_config.header,
				data   :{
					'NotificationId':data.NotificationId,
					'Read'          :data.Read,
					'DelayId'       :data.DelayId
				},
				success:function () {
					counterIncrement( data.Read ? --counter : ++counter );
				}
			}
		);
	}

	/**
	 * Exibie opções de 'Adiar'.
	 * @param {event} e - evento do objeto clicado.
	 */
	function showLaterOptions( e, onclick, onblur ) {
		var html, pai;

		//Valida se tem dados no local storage.
		if ( !_config.later ) {
			_config.later = getLaterOptionsList(
				function success() {
					//valida se elemento ta na tela
					if ( html.parentNode ) {
						html.innerHTML = _config.later;
						setPosition( e.x, e.y - html.clientHeight, html );
					}
				},
				function error() {
					if ( html.parentNode ) {
						_config.later  = '<li>É preciso logar.</li>';
						html.innerHTML = _config.later;

					}
				}
			);
		}

		html = '<div class="plg-panel unselectable">';
		if ( _config.later ) {
			html += _config.later;
		}
		html += '</div>';

		html = addContentHTML( 'div', html, true ).childNodes[0];

		// evento para quando selecionar item da lista.
		html.onclick = function ( e ) {
			if ( html.onblur ) {
				html.onblur();
			}

			//se tiver 'value' e 'onclick' executa onclick
			if ( !isNaN( parseInt( e.target && e.target.value ) ) && onclick ) {
				if ( selectedNotification ) {
					selectedLaterOption(
						{
							'NotificationId':selectedNotification.NotificationId,
							'Read'          :false,
							'DelayId'       :e.target.id
						}
					);
					console.info( 'Notificação adia:', selectedNotification.NotificationId );
				}
				onclick();
			}
		};

		// Adiciona evento de onblur, para caso clique em outra parte que não seja o item.
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

		pai = (e.currentTarget || e.target);

		if ( !pai ) {
			console.error( 'não existe elemeto.' );
			return;
		}
		pai = pai.parentNode;
		pai.appendChild( html );

		_config.onblur.push( html );

		html.style.zIndex = 190;
		//hasSpace(html, e.target );
		setPosition( e.pageX, e.pageY - html.clientHeight, html )

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
	 * Abre modal com notificação e esconde lista de notificações.
	 * @param {event} target - evento mousedown.
	 */
	/**
	 * Alterar modal em titulo e texto.
	 * @param dom - elemento dom
	 */
	function showMessage( dom, data ) {
		var uid, modal, dialog, header, body, sender, date, footer, text, title, fecharX, btnFechar, adiar;
		var hideModal, destroyModal;

		uid = {};

		//adicionar modal
		modal = '<div class="plgmodal" id="plgmodal" aria-hidden="true">' +
				'<div class="plgmodal-dialog">' +
				'<div class="plgmodal-header">' +
				'<h2 class="title"><span class="plgloader"></span></h2>' +
				'<div class="unselectable interactive plgmodal-xclose" aria-hidden="true">×</div>' +
				'</div>' +
				'<div class="plgmodal-body">' +
				'<p><span class="plgloader"></span></p>' +
				'</div>' +
				'<div class="plgmodal-footer">' +
				'<div class="sender">' +
				'<small>De: ' +
				'<span class="senderName"></span>' +
				//' em ' +
				//'<span class="date"></span>' +
				'</small>' +
				'</div>' +
				'<div class="plgmodal-left plg-icon-btn unselectable" id="plg-modal-adiar" title="Ler mais tarde">' +
				'<svg width="24" height="24" viewBox="0 0 24 24"><path fill="gray" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/></svg></div><div class="plgmodal-right">' +
				'<div class="plgmodal-btn-close interactive plgmodal-btn unselectable">Fechar</div>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>';

		modal = addContentHTML( 'div', modal, true ).childNodes[0];

		dialog = modal.getElementsByClassName( 'plgmodal-dialog' )[0];

		header = modal.getElementsByClassName( 'plgmodal-header' )[0];
		body   = modal.getElementsByClassName( 'plgmodal-body' )[0];
		footer = modal.getElementsByClassName( 'plgmodal-footer' )[0];
		sender = modal.getElementsByClassName( 'senderName' )[0];
		//date   = modal.getElementsByClassName( 'date' )[0];

		title = header.childNodes[0];
		text  = body.childNodes[0];

		text.innerHTML  = data.message;
		title.innerHTML = data.title;

		sender.innerHTML = data.senderName;

		btnFechar = footer.getElementsByClassName( 'plgmodal-btn-close' )[0];
		fecharX   = header.getElementsByClassName( 'plgmodal-xclose' )[0];
		adiar     = footer.children['plg-modal-adiar'];

		adiar.onclick = function ( e ) {
			e.id = data.id || dom.id;
			showLaterOptions( e, _onClick );
		};

		function _onClick() {
			modal.classList.add( 'hitbot' );
			fecharX.onclick();
		}

		//Verifica se tem mais de um toaster
		if ( !_config.modal ) {
			_config.modal = [];
		}

		// deixa modal visivel
		hideModal    = function () {
			if ( !modal ) {
				return;
			}
			modal.style.opacity = 0;

			uid[1] = setTimeout(
				destroyModal, layout.animationTime
			);
		};
		// destroi modal
		destroyModal = function () {
			uid = undefined;
			if ( !modal ) {
				return;
			}
			modal.parentNode.removeChild( modal );

			_config.onblur.splice( _config.onblur.indexOf( modal ), 1 );

			adiar.onclick   = undefined;
			fecharX.onclick = btnFechar.onclick = undefined;
			modal.onclick = undefined;
			modal         = undefined;
		};

		//remove modal quando clicar para sair
		fecharX.onclick = btnFechar.onclick = function () {
			uid[0] = setTimeout( hideModal, layout.animationTime );
		};

		//adiciona na tela
		_body.appendChild( modal );

		hideList();

		_config.onblur.push( modal );

		setTimeout(
			function () {
				dialog.style.top = 0;
			},
			layout.animationTime * .5
		);

	}

	/**
	 * Marca notificação como lida.
	 * @param id
	 */
	function postRead( id ) {
		console.info( 'Notificação lida:', id );
		selectedNotification.NotificationId = id;
		selectedLaterOption( selectedNotification );
	}

	/**
	 * Formata dados da notificação.
	 *
	 * @param dataString
	 * @returns {object}
	 {
		 id        :String,
		 title     :String,
		 message   :String,
		 senderName:String,
		 date      :String,
	 }

	 */
	function formatNotification( dataString ) {
		var obj = typeof dataString === 'string' && JSON.parse( dataString ) || dataString;
		return {
			id        :obj.Id,
			title     :obj.Title,
			message   :obj.Message,
			senderName:obj.SenderName,
			type      :obj.MessageType,
			dateStart :(new Date( obj.DateStartNotification )).toLocaleString( 'pt-bt' ),
			dateEnd   :(new Date( obj.DateEndNotification )).toLocaleString( 'pt-bt' )
		};
	}

	/**
	 * Pega notificação com id especifico.
	 * @param id
	 */
	function getNotification( id, success, error ) {
		http.get(
			api.notificationId( id ),
			{
				header :_config.header,
				success:success,
				error  :error
			}
		);
	}

	/**
	 * Tratamento de sucesso ao pegar notificação especifica.
	 * @param data
	 */
	function getNotificationSuccess( data ) {
		var obj;

		if ( !data ) {
			console.info( 'notificação vazia' );
			return;
		}
		obj = formatNotification( data.response );

		showMessage( this, obj );
	}

	/**
	 * Tratamento de erro ao pegar notificação especifica.
	 * @param data
	 */
	function getNotificationError( data ) {
		var obj;

		if ( !data ) {
			console.info( 'notificação vazia' );
			return;
		}
		obj = JSON.parse( data.response );

		//showMessage(this,obj);
		console.info( this, obj );
	}

	/**
	 * Abre notificação
	 * @param {event} e - evento
	 */
	function openNotification( e, id ) {

		if ( !(e && id) ) {
			return;
		}

		selectedNotification.NotificationId = id;
		selectedNotification.Read           = true;
		selectedNotification.DelayId        = undefined;

		getNotification( id, getNotificationSuccess.bind( e ), getNotificationError.bind( e ) );
	}

	/**
	 * Tratamentos de click dentro da lista de de notificações.
	 * @param {event} e - evento mousedown.
	 */
	function onListClick( e ) {
		var classlist;

		//todo - imperdir multiplos cliques

		classlist = e.target.classList;

		if ( classlist.contains( 'plgnot' ) ) {
			if ( e.target.id ) {
				if ( e.target.parentNode.id !== events.read ) {
					postRead( e.target.id );
				}
				openNotification( e, e.target.id );
			}
		}
		else if ( classlist.contains( 'plgtablink' ) && !classlist.contains( 'plgtablink-setting' ) ) {
			showList( document.querySelector( '.plgtab > .visited' ) );
		}
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
	 * Converte notificações para elemento DOM.
	 *
	 * @param type - tipo de lista, novas ou lidas.
	 * @param arr - lista de notificação.
	 * @returns {*}
	 */
	function notificationHTML( type, arr ) {
		arr  = arr.map( formatNotification );
		type = type === events.unread ? '' : 'lida';
		var string;
		return arr.map(
			function ( e ) {
				string = '<li class="plgnot ' + type + ' " id="' + e.id + '">';

				// adiciona exclamação, se urgente
				if ( e.type > 3 ) {
					string += '<svg class="plg-nu" width="20" height="20" viewBox="0 0 24 24"><path fill="#d11d1d" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
				}

				string += '<span>' + e.title + '</span>' +
						  '<div>' + e.message + '</div>' +
						  '</li>';

				return string;
			}
		);
	}

	/**
	 * Adiciona notificação na lista.
	 */
	function addNotification( type, data ) {
		var element, loader, lista;
		//caso selecione settings
		if ( !type ) {
			return;
		}
		element = document.querySelector( '#' + type + '.plg-list' );
		loader  = element.childNodes[0];

		if ( loader && loader.classList.contains( 'plgloader' ) ) {
			loader.parentNode.removeChild( loader );

		}

		lista = notificationHTML( type, JSON.parse( data ) );
		paginationValidate( type, lista );

		if ( events.unread === type ) {
			counterIncrement( lista.length );
		}

		element.innerHTML = lista.join( ' ' );
		if ( paginator[type].total ) {
			element.appendChild( layout['domPag' + events[type]] );
		}
	}

	/**
	 * Mostra conteúdo de um lista.
	 */
	function showList( target ) {
		var fn, bind;

		fn                         = (target.id === events.unread ) ? getUnreadList : getReadList;
		bind                       = addNotification.bind( {}, target.id );
		paginator[target.id].page  = 0;
		paginator[target.id].total = Infinity;

		fn(
			bind,
			function () {
				console.error( 'lista inválida' );
			}
		);
	}

	/**
	 * Pega lista de itens não lidos.
	 *
	 * @param success
	 * @param error
	 * @returns {*}
	 */
	function getUnreadList( success, error ) {
		return getNotificationList(
			events.unread, function ( r ) {
				var t = r.getResponseHeader( 'Total' );
				if ( t && !isNaN( t = parseInt( t ) ) ) {
					paginator[events.unread].total = t;
				}
				success( r.response );
			}, error
		);
	}

	/**
	 * Pega lista de itens lidos.
	 *
	 * @param success
	 * @param error
	 * @returns {*}
	 */
	function getReadList( success, error ) {
		return getNotificationList(
			events.read, function ( r ) {
				var t = r.getResponseHeader( 'Total' );
				if ( t && !isNaN( t = parseInt( t ) ) ) {
					paginator[events.read].total = t;
				}
				success( r.response );
			}, error
		);
	}

	/**
	 * Faz requisição para pegar lista de notificações
	 * @param type
	 */
	function getNotificationList( type, success, error ) {
		if ( !api || !api[type] ) {
			console.error( 'método não existe!', api, type );
			return;
		}

		http.get(
			api[type](),
			{
				header :getPaginationHeader( type ),
				success:success,
				error  :error
			}
		);
	}

	/**
	 * Tratamento para quando pressiona o sino.
	 * @param {Event} e - evento de mousedown.
	 */
	function toogleList( e ) {
		e.stopPropagation();

		//lista é preciso estar na tela para fazer calculo de posicionamento.

		layout.domlist.classList.remove( 'hide' );
		// verifica se é possível abrir lista
		if ( !hasSpace( layout.domlist ) ) {
			layout.domplugin.classList.add( 'shake-anime' );
			layout.domlist.classList.add( 'hide' );
			return;
		}

		layout.domlist.style.zIndex = layout.zIndex + 1;
		listOpened                  = true;

		layout.domlist.classList.remove( 'hide' );

		showList( document.querySelector( '.plgtab .visited' ) );
	}

	/**
	 * Tratamneto para esconder plugin.
	 * @param {event} e - evento de mousedown.
	 */
	function hidePlugin() {
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

		if ( !listOpened ) {
			_config.onblur.indexOf( layout.domlist ) < 0 && _config.onblur.push( layout.domlist );
		}

		//_config.onblur.concat() [layout.dommove, layout.domhide, layout.dombell, layout.domcontainer, layout.domlist];

		switch ( e.currentTarget ) {
			case layout.dommove:
				moveMouseDown( e );
				break;
			case layout.domhide:
				hidePlugin( e );
				break;
			case layout.dombell:
				toogleList( e );
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
		remDragging();
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

		//TODO validar no safari
		if ( x !== undefined ) {
			if ( hidden && layout.domplugin === dom ) {
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

			//if(isSafari()){
			//	y = innerHeight - y ;
			//}

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
	var windowResize = (function () {
		'use strict';

		var timeWindow = 500; // tempo em ms
		var timeout;

		function onResize() {
			setPosition( layout.domplugin.offsetLeft, layout.domplugin.offsetTop );
		}

		return function () {
			var context = this;
			var args    = arguments;
			clearTimeout( timeout );
			timeout = setTimeout(
				function () {
					onResize.apply( context, args );
				}, timeWindow
			);
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
		var hasFocus, arr, indexes = [], path = e.path;

		layout.domplugin.classList.remove( 'shake-anime' );

		//deve acontecer onblur nesses elementos do array.
		arr = _config.onblur;

		if ( !path ) {
			path     = [];
			hasFocus = e.target.parentNode;

			for ( ; ; ) {

				if ( !hasFocus || (hasFocus === _body) ) {
					break;
				}
				path.push( hasFocus );
				hasFocus = hasFocus.parentNode;
			}
		}

		if ( arr.length ) {
			//se hovuer alguem que deve executar onblur
			indexes  = arr.map(
				//varre todos e
				function ( a, i ) {
					var childs = path || [].slice.call( a.childNodes );

					//valida se algum item da tela é ele.
					return childs.some(
						function ( el ) {
							return el === a;
						}
					)
						// se for retorna elemento para dar blur.
						? -1 : i;
				}
			);
			hasFocus = !indexes.length;
		}

		//se NÃO perdeu o foco, não faz nada.
		if ( hasFocus ) {
			return;
		}

		indexes.every(
			function ( a ) {
				if ( arr[a] ) {
					arr[a].onblur && arr[a].onblur( e );
				}
				return true;
			}
		);
		//if(listOpened) hideList();
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
		var uid, i, dom, html, open, hide, destroy, cancelHide, restoreHide;

		if ( hideSnackbar ) {
			console.info( 'Não perturbe está ativado, snackbar escondidas.' );
			return;
		}

		if ( !msg || msg && !(msg.header || msg.body) ) {
			return;
		}

		//Verifica se tem mais de um toaster
		if ( !_config.snackbar ) {
			_config.snackbar = [];
		}
		//se tiver, não exibe outro ( a se definir )
		else if ( _config.snackbar.length ) {
			return true;
		}

		if(msg.body){
			msg.body.length =128;
		}
		if(msg.header){
			msg.header.length =128;
		}
		// Cria html do snackbar
		html = '<div class="unselectable plgsnackbar">' +
			   '<div class="plgsnackbar-center" id="' + (msg && msg.id || "") + '" title="Ler mensagem">' +
			   '<span class="plgsnackbar-header">' + (msg && msg.header || "") + '</span>' +
			   '<span class="plgsnackbar-body">' + (msg && msg.body || "") + '</span>' +
			   '</div>' +
			   '<button class="plgsnackbar-right" title="Ler mais tarde">' +
			   '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="white" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/></svg>' +
			   '</button>' +
			   '</div>';

		uid = {};
		dom = addContentHTML( 'div', html, true ).childNodes[0];
		layout.domcontainer.appendChild( dom );

		layout.domsnackbar = html = dom;

		// Configura valores padrões da animação.
		y     = y ? y : 50;
		delay = delay ? delay : 0.15;
		time  = time ? time : 10;

		html.getElementsByClassName( 'plgsnackbar-center' )[0].onclick = function ( e ) {
			postRead( e.currentTarget.id );
			openNotification( e, e.currentTarget.id );
			hide();
		};

		html.getElementsByClassName( 'plgsnackbar-right' )[0].onclick = function ( e ) {
			//Remove eventos de blur da notificação.
			cancelHide();
			html.onmouseover = undefined;
			html.onmouseout  = undefined;

			if ( !(e && e.target && e.target.id) ) {
				hide();
			}
			else {
				showLaterOptions( e, hide, onBlurOptions );

			}
		};

		/**
		 * Restaura eventos de blur da notificação
		 */
		function onBlurOptions() {
			restoreHide();
			html.onmouseover = cancelHide;
			html.onmouseout  = restoreHide;
		}

		function onClick( e ) {
			hide();
			setTimeout(
				function () {
					showSnackbar( { header:'adiou a mensagem da snackbar!.' } );
				}, 300
			)
		}

		// deixa snackbar visivel
		layout.domsnackbar.openSnackbar = open = function () {
			//Deixa toaster visivel
			dom.style.opacity    = 0.85;
			dom.style.bottom     = y + 'px';
			dom.style.visibility = 'visible';

			uid[2] = setTimeout(
				hide, time * 1000 // tempo de exibição
			);
		};

		// esconde snackbar
		layout.domsnackbar.hideSnackbar = hide = function () {
			html.onmouseout = html.onmouseover = undefined;

			//esconde toaster
			dom.style.opacity    = 0;
			dom.style.bottom     = '-50px';
			dom.style.visibility = 'hidden';

			uid[3] = setTimeout(
				destroy, layout.animationTime //tempo até remover da tela e animação
			);
		};
		//destroi snackbar
		layout.domsnackbar.destroySnackbar = destroy = function () {
			cancelHide();
			//remove da tela toaster
			dom.parentNode.removeChild( dom );
			html.getElementsByClassName( 'plgsnackbar-right' )[0].onclick = undefined;
			//remove referências dessa função.(evitar memory leak )
			i                                                             = _config.snackbar.indexOf( uid );
			_config.snackbar.splice( i, 1 );

			uid[1] = uid[2] = uid[3] = undefined;
			layout.domsnackbar = html = dom = i = uid = undefined;
		};

		// impede snackabar de esconder
		layout.domsnackbar.cancelHide = cancelHide = function () {
			clearTimeout( uid[2] );
		};

		//restora snackabar função de esconder
		layout.domsnackbar.restoreHide = restoreHide = function () {
			uid[2] = setTimeout(
				hide, time * 1000 // tempo de exibição
			);
		};

		//se PASSAR o mouse por cima da snackbar impede de esconder
		html.onmouseover = cancelHide;
		//se TIRAR o mouse por cima da snackbar restaura de esconder
		html.onmouseout  = restoreHide;
		//html.onclick  = onClick;

		//salva referencia dos setTimeout, para poder cancelar , se necessário.
		_config.snackbar.push( uid );
		uid[1] = setTimeout(
			open,
			delay * 1000 // delay inicial
		);
	}

	/**
	 * Atualiza elemento com número.
	 * @param {Object} res - respostar do socket, quando recebe novas notificações
	 */
	function counterIncrement( num ) {

		if ( counter < 0 ) {
			return;
		}
		counter                     = num;
		layout.domcounter.innerHTML = counter;
	}

	/**
	 * Atualiza elemento com número.
	 * @param {Object} res - respostar do socket, quando recebe novas notificações
	 */
	function onSocketMessage( res ) {

		if ( !res || !layout.domcounter ) {
			return;
		}

		showSnackbar(
			{
				'id'    :res.Id,
				'header':res.Title,
				'body'  :res.Message
			}
		);
		getUnreadList(
			function ( data ) {

				var lista = JSON.parse( data ).length;
				counterIncrement( lista );
			}
		);

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
		_config = sysconfig;

		// getter e setter para eventos de blur
		Object.defineProperty(
			_config,
			'onblur',
			{
				get:function () {
					if ( !this._onblur ) {
						this._onblur = [];
					}
					return this._onblur
				},
				set:function ( arrayOrElement ) {
					if ( !arrayOrElement ) {
						this._onblur = arrayOrElement;
					}
					else {
						this._onblur = [].concat( arrayOrElement );
					}
				}
			}
		);
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

				unread:'unread',
				read  :'read',

				notification  :'notification',
				notificationId:'notificationId',

				refresh:'refresh'
			};

		events.disturb         = 'disturb';
		events.disturbTime     = 'disturbTime';
		events.disturbTimeText = 'disturbTimeText';
		events.disturbId       = 0;
		events.later           = 'later';
	}

	/**
	 * Pega tempos para 'adiar' da API.
	 * @param success
	 * @param error
	 */
	function getLaterOptionsList( success, error ) {
		return getTimeList( events.later, success, error );
	}

	/**
	 * Pega tempos para 'não perturbe' da API.
	 * @param success
	 * @param error
	 */
	function getDisturbOptionsList( success, error ) {
		return getTimeList( events.disturb, success, error );
	}

	/**
	 * Tratamento para pegar tempos da api
	 */
	function getTimeList( type, success, error ) {
		var _local = sessionStorage.getItem( type );

		if ( !_local ) {
			sessionStorage.setItem( type, '<div class="plgloader"></div>' );

			http.get(
				api[type + 'Options'],
				{
					header :_config.header,
					success:function cachaTime( data ) {

						if ( data ) {
							data = data.response;

							if ( typeof data === 'string' ) {
								_config[type] = arrayTimeToHTML( JSON.parse( data ) );
							}

							sessionStorage.setItem( type, _config[type] );

							if ( success ) {
								success();
							}
						}
					},
					error  :function errorCallback() {
						sessionStorage.removeItem( type );
						if ( error ) {
							error();
						}
					}
				}
			);
		}
		_local = sessionStorage.getItem( type );
		return _config[type] = _local;
	}

	/**
	 * Configura endereço e métodos.
	 */
	function setAPI() {
		// pega token
		token = _config.tokenType + _config.token;

		// pega dados da api
		api = _config.api;

		if ( !api && _config.url ) {
			_config.url += (_config.url[_config.url.length] === '/' ? 'api/v1/' : '/api/v1/');

			api = {};

			//Pega notificações do usuário
			api[events.unread] = function () {
				return _config.url + 'Notification?userId=' + _config.userId + '&read=false';
			};
			api[events.read]   = function () {
				return _config.url + 'Notification?userId=' + _config.userId + '&read=true';
			};

			// Adia notificação
			api[events.later] = function ( id ) {
				return _config.url + 'Notification/' + id + '/Action';
			};

			// Pega notificação por id
			api[events.notificationId] = function ( id ) {
				return _config.url + 'Notification/' + id;
			};

			//Pega lista de opções de tempo para adiar e não perturbe.
			api[events.later + 'Options']   = _config.url + 'DelayTime';
			api[events.disturb + 'Options'] = _config.url + 'DisturbTime';
		}

		_config.header = {
			'Content-Type' :'application/json;charset=UTF-8',
			'Authorization':token,
			'groupSid'     :_config.groupSid
		};
	}

	/**
	 * Adiciona conteúdo ao HTML.
	 */
	function addContentHTML( type, content, reflow ) {
		var frag, typo, children = [];
		frag                     = document.createDocumentFragment();
		typo                     = document.createElement( content && type || 'div' );

		typo.innerHTML = content || type;

		//é para extrair o conteudo do innerHTML
		if ( reflow || !(content && type) ) {
			for ( ; typo.childElementCount ; ) {
				children.push( typo.removeChild( typo.lastChild ) );
			}

			children.reverse().map(
				function ( c, i ) {
					frag.appendChild( c );
					children[i] = c = undefined;
				}
			);
		}

		//retorna elemento dom
		if ( !reflow ) {
			return typo;
		}

		typo.innerHTML = null;
		typo           = null;

		return frag;

	}

	/**
	 * Valida se plugin está na tela, senão cria e insere.
	 */
	function hasPlugin() {
		var linksTabs, domdisturb, domdisturbcancel, pagread, pagunread;
		var style, css, html, dom;

		//TODO: possibilitar uso parcial de conteúdo( só insere o css, ou html ).

		if ( layout.domplugin ) {
			return;
		}
		console.warn( 'Plugin não está na tela.' );

		// adicionar elemntosDOM e styles, se não houver
		css = '.disturb.cancelar{display:block}.plg-panel{position:fixed;display:inline-block;text-align:center;background:#fff;box-shadow:0 0 10px 4px rgba(0,0,0,.1);border-radius:10px;border-bottom:1px solid #d3d3d3;color:#000!important;overflow-x:hidden;max-height:272px;width:154px}.plg-panel li{font-size:16px;font-weight:700;text-overflow:ellipsis;white-space:nowrap;padding:8px;width:initial;display:block}.plg-panel li:first-letter{text-transform:uppercase}.plg-panel li:hover{background-color:#d3d3d3}.plgtab{position:fixed;width:inherit}.plgtablink{background-color:#555;color:#fff;float:left;border:none;outline:0;padding:14px 16px;font-size:17px;width:40%;height:48px}.plgtablink.visited{background-color:#a9a9a9!important}.plgtablink-setting.visited~.plg-list.configuracoes,.plgtablink.lidas.visited~.plg-list.lidas,.plgtablink.novas.visited~.plg-list.novas{opacity:1;animation:.5s fadeIn;display:block}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.plgtablink:first-child{border-top-left-radius:10px}.plgtablink:active,.plgtablink:hover{background-color:#777;cursor:pointer}.plgtablink-setting{border-top-right-radius:10px;width:20%}.tabcontent{color:#fff;display:none;padding:50px;text-align:center}.plgsnackbar{visibility:hidden;width:250px;margin-left:-125px;background-color:#333;text-align:center;position:fixed;z-index:1150;left:50%;bottom:0;opacity:0;max-height:52px;border-radius:10px;display:flex}.plg-icon-btn,.plgsnackbar button{overflow:hidden;background-color:transparent;border:none;outline:0}.plgsnackbar span{display:block;color:#fff;text-transform:lowercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.plgsnackbar-right{width:36px;border-radius:0 10px 10px 0}.plgsnackbar-center{padding:8px 4px 8px 8px;width:214px;border-radius:10px 0 0 10px}.plgsnackbar-center span::first-letter{text-transform:uppercase}.plg-icon-btn:hover,.plgsnackbar-center:hover,.plgsnackbar-left:hover,.plgsnackbar-right:hover{background-color:#505050;cursor:pointer}.plgsnackbar-header{font-weight:700}.plg-icon-btn{height:24px;border-radius:10px;background-color:transparent;width:24px}.plg-icon-btn:hover path{color:#d3d3d3;fill:#fff}.plgloader{border:8px solid #f3f3f3!important;border-top:8px solid #3498db!important;border-radius:50%!important;width:36px;height:36px;margin:2px;animation:2s linear infinite spin!important}.fix36{width:36px!important;height:36px!important}.fix24{width:24px!important;height:24px!important}.plg-pag{text-align:center;vertical-align:middle;text-align:-webkit-center}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.plg-notify-bell,.plg-notify-hide,.plg-notify-move,.unselectable{-khtml-user-select:none;-webkit-user-select:none;-ms-user-select:none;-moz-user-select:none;user-select:none;cursor:pointer}[draggable]{-khtml-user-drag:element;-webkit-user-drag:element}.draggable{position:absolute}.draggable,.draggable>*{display:inline-block}.plg-notify-move{cursor:move!important}.hide{display:none!important}.hitbox,path,svg{pointer-events:none;padding:0;margin:0}.interactive,.interactive>*{pointer-events:auto}.plg-notificacoes{list-style-type:none;position:fixed;background:#fff;width:320px;display:inline-block;border:1px solid #ddd;box-shadow:0 0 10px 4px rgba(0,0,0,.1);border-radius:10px;overflow:hidden;height:420px;color:#000;-webkit-transition:none!important;-moz-transition:none!important;-ms-transition:none!important;-o-transition:none!important;transition:none!important}.plg-list.lidas>li,.plg-list.novas>li{width:100%;border-bottom:1px solid rgba(235,238,240,.31);font-size:16px;overflow:hidden;height:auto;cursor:pointer}.plg-list.lidas li:last-child,.plg-list.novas li:last-child{border-bottom:0}.plg-list.lidas li.lida,.plg-list.novas li.lida{opacity:.5}.plg-list.lidas li *,.plg-list.novas li *{color:#b1b1b1;height:auto;max-height:32px}.plg-list.lidas li p,.plg-list.lidas li span,.plg-list.novas li p,.plg-list.novas li span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;max-width:90%;min-width:30%;font-size:20px;display:block;font-weight:900;color:#16688e;padding:10px 0 0 10px}.circulo,.float-menu{border-radius:100%;width:80px;height:80px}.circulo{box-sizing:border-box;overflow:hidden}.float-menu{display:block;position:fixed;color:#fff;box-shadow:4px 4px 4px rgba(0,0,0,.3);font-family:sans-serif}.float-menu .lateral{width:38px;left:42px;position:absolute;height:40px}.float-menu .lateral a{display:inline-block;width:100%;text-align:center;padding:7px;box-sizing:border-box;background:#f32f2f;font-weight:600;font-size:16px;border-radius:100%;height:40px}.float-menu a.numeracao span.plg-notify-counter{font-size:16px;color:#fff}.float-menu a.numeracao{background:#ff9800;cursor:default;position:absolute;right:0;top:-10px;height:16px;width:16px;padding:5px;margin:auto;border-radius:100%;font-weight:700;z-index:15;box-sizing:content-box!important}.float-menu a.numeracao:hover{background:#ffd200;color:#000}.float-menu .lateral a.esconder svg{margin-top:0}.float-menu .lateral a:hover{background:#a91b1b}.float-menu .lateral a svg{fill:#fff;margin-top:7px}.float-menu .lateral a:first-child{border-bottom:0;border-radius:0 100% 0 0}.float-menu .lateral a:last-child{border-bottom:0;border-radius:0 0 100%}.sino{width:50px;height:80px;padding:20px 0 0 10px;box-sizing:border-box;position:relative;background-color:#232b38}.sino svg{fill:#fff}.sino:hover{background:#3d4d60}.shake-anime{animation:1s cubic-bezier(.36,.07,.19,.97) both shake;transform:translate3d(0,0,0);backface-visibility:hidden;perspective:1000px}@keyframes shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}.plgmodal-btn{background:#428bca;border:1px solid #357ebd;border-radius:3px;color:#fff;display:inline-block;font-size:16px;padding:8px 15px;text-decoration:none;text-align:center;min-width:60px;position:relative;transition:color .1s ease}.plgmodal-btn:hover{background:#357ebd}.plgmodal-xclose:hover{color:#000}.plgmodal-xclose{color:#aaa;font-size:30px;text-decoration:none;position:absolute;top:0;right:0;height:30px;width:30px;vertical-align:middle;text-align:center}.plgmodal{display:block;background:rgba(0,0,0,.6);position:fixed;top:0;left:0;right:0;bottom:0;z-index:1210;width:100%;height:100%;overflow:auto;background-color:#000;background-color:rgba(0,0,0,.4)}.plgmodal-dialog{z-index:1211;width:80%;min-width:300px;max-width:600px;height:auto;max-height:600px;left:0;top:-100%;position:relative;padding:0;margin:auto;margin-top:5%;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);border:1px solid #333;border-radius:5px;background:#fefefe;overflow:hidden}.plgmodal-dialog a{cursor:pointer}.plgmodal-body,.plgmodal-footer,.plgmodal-header{overflow:hidden;width:auto;height:auto;text-align:justify;word-break:break-all}.plgmodal-header{border-bottom:1px solid #eee;max-height:70px}.plgmodal-body{max-height:330px;overflow-x:hidden;overflow-y:auto;padding:10px}.plgmodal-footer{display:flex;border-top:1px solid #eee;height:70px}.plgmodal-header .title{font-size:20px;font-weight:900;line-height:24px;margin:0 0 10px;overflow:hidden;height:auto;padding:10px 35px 10px 10px}.plgmodal-left,.plgmodal-right{text-align:right;position:absolute;bottom:10px}.plgmodal-right{right:10px}.plgmodal-left{left:10px}.sender{bottom:46px;font-size:20px;position:absolute;left:10px;max-width:90%;height:20px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.plg-list{margin-top:48px;overflow-y:auto;overflow-x:hidden;height:376px;opacity:0;display:none}.configuracoes{padding:10px}.disturb{cursor:pointer;color:#696969;display:block}.disturb strong{cursor:default;display:block;margin-bottom:5px;line-height:38px;font-size:16px}.disturb svg{border:1px solid gray;display:inline;background-color:#f5f5f5;border-bottom-left-radius:10px;border-top-left-radius:10px;padding:10px;float:left;height:18px!important;width:18px!important;box-sizing:content-box!important}.cancelar p:hover,.disturb p:hover,.disturb svg:hover{background-color:#fff}.cancelar p:active,.disturb p:active,.disturb svg:active{border-color:#f5f5f5}.disturb p{height:18px;border:1px solid gray;border-left:none;display:block;color:#000;background-color:#f5f5f5;padding:10px;border-bottom-right-radius:10px;margin:0;border-top-right-radius:10px;float:left;font-size:16px;vertical-align:middle;text-align:center;box-sizing:content-box!important}.cancelar p{border:1px solid gray;margin:0 10px;border-radius:10px}li.plgnot{height:auto}li.plgnot>*{padding:5px}li.plgnot>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none}li.plgnot:hover{opacity:1;background-color:rgba(112,128,144,.42)!important}li.plgnot:hover>*{color:#000!important}.plg-nu{float:right!important;padding:5px!important}.plgsnackbar-body *,li.plgnot *,li.plgnot p *,li.plgnot span *{margin:0;padding:0}.plg,.plg>*{box-sizing:initial!important;z-index:1400}';
		dom = addContentHTML( 'style', css );
		_body.appendChild( dom );

		//adicionar plugin
		html = '<div draggable="true" class="float-menu plg-notify">' +
			   '<div class="circulo">' +
			   '<div class="lateral">' +
			   '<a class="mover plg-notify-move">' +
			   '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"/></svg>' +
			   '</a>' +
			   '<a class="esconder plg-notify-hide">' +
			   '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>' +
			   '</a>' +
			   '</div>' +
			   '<div class="sino plg-notify-bell">' +
			   '<svg width="40" height="40" viewBox="0 0 24 24"><path d="M14,20A2,2 0 0,1 12,22A2,2 0 0,1 10,20H14M12,2A1,1 0 0,1 13,3V4.08C15.84,4.56 18,7.03 18,10V16L21,19H3L6,16V10C6,7.03 8.16,4.56 11,4.08V3A1,1 0 0,1 12,2Z"/></svg>' +
			   '</div>' +
			   '<a class="numeracao hitbox"><span class="plg-notify-counter">0</span></a>' +
			   '</div>' +
			   '<div class="hide plg-notificacoes plgtab">' +
			   '<button class="plgtablink novas visited" id="' + events.unread + '">Novas</button>' +
			   '<button class="plgtablink lidas "id="' + events.read + '">Lidas</button>' +
			   '<button class="plgtablink-setting plgtablink " title="Configurações">' +
			   '<svg width="20" height="20" viewBox="0 0 24 24">' +
			   '<path fill="white" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/></svg>' +
			   '</button>' +
			   '<div class="plg-list novas" id="' + events.unread + '"><li class="plgnot plg-pag"><div class="plgloader fix24"></div></li></div>' +
			   '<div class="plg-list lidas" id="' + events.read + '"><li class="plgnot plg-pag"><div class="plgloader fix24"></div></li></div>' +
			   '<div class="plg-list configuracoes ">' +
			   '<li class="disturb interactive unselectable">' +
			   '<strong>Silênciar por:</strong>' +
			   '<svg width="24" height="24" viewBox="0 0 24 24">' +
			   '<path fill="gray" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />' +
			   '</svg>' +
			   '<p>Mais opções</p>' +
			   '</li>' +
			   '<li title="Cancelar não perturbe" class="disturb cancelar hide"><p>Cancelar</p></li>' +
			   '</div>' +
			   '</div>' +
			   '</div>';

		dom = addContentHTML( 'div', html );

		dom.classList.add( layout.container );

		//adiciona eventos de selectionar tab
		linksTabs = dom.querySelectorAll( 'button.plgtablink' );
		linksTabs.forEach(
			function ( e ) {
				e.onclick = selectTab;
			}
		);

		//aplica função de 'não perturbe'
		layout.domdisturb = domdisturb = dom.querySelector( '.disturb' );
		domdisturb.onclick = function ( e ) {
			showDisturbOptions( e, selectedDisturbOption );
		};

		//aplica função de cancelar 'não perturbe'
		layout.domdisturbcancel = domdisturbcancel = dom.querySelector( '.disturb.cancelar' );
		domdisturbcancel.onclick = disturbCancel;

		_body.appendChild( dom );
		console.info( 'Plugin adicionado na tela' );

		//Cria layout paginação, uma instancia para cada lista.
		var loadMore = '<li class="plgnot plg-pag">' +
					   '<span> Carregar mais</span>' +
					   '<div class="plgloader fix24 hide"></div>' +
					   '</li>';

		pagread = layout['domPag' + events.read] = addContentHTML( 'div', loadMore, true ).childNodes[0];
		pagunread = layout['domPag' + events.unread] = addContentHTML( 'div', loadMore, true ).childNodes[0];

		//_body.appendChild( layout['domPag'+events.unread] );
		//_body.appendChild( layout['domPag'+events.read] );

		pagread.toogle   = tooglePagination.bind( pagread );
		pagunread.toogle = tooglePagination.bind( pagunread );

		pagread.onclick   = paginationClick.bind( pagread, events.read );
		pagunread.onclick = paginationClick.bind( pagunread, events.unread );

	}

	/**
	 * Cria todo o layout do plugin.
	 */
	function setLayout() {

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
		hasPlugin();

		//pega todas as
		layout.domcontainer = document.getElementsByClassName( layout.container )[0];
		layout.domplugin    = document.getElementsByClassName( layout.plugin )[0];
		layout.dombell      = document.getElementsByClassName( layout.bell )[0];
		layout.domcounter   = document.getElementsByClassName( layout.counter )[0];
		layout.domhide      = document.getElementsByClassName( layout.hide )[0];
		layout.domlist      = document.getElementsByClassName( layout.notification )[0];
		layout.dommove      = document.getElementsByClassName( layout.move )[0];

		layout.domlist.onblur = hideList;

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
			addEventListener( layout.domlist, events.click, onListClick );
		}

		addEventListener( window, events.resize, windowResize );
		addEventListener( document, events.mousedown, onBlur );
		addEventListener( document, events.mouseup, onDragEnd );

		addEventListener( document, events.dragstart, onDragStart );
		addEventListener( document, events.dragend, onDragEnd );

		updater();
		disturbValidator();
	}

	/**
	 * Reseta configurações de socket e tenta conectar novamente.
	 */
	function resetSocketListeners() {
		startSocket();
		socket.hasListeners = true;
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
		if ( websocket || socket && socket.hasListeners ) {
			return console.warn( 'ws já instânciado.' );
		}

		if ( !socket || socket && socket.hasHubs ) {
			socket = _config.ws;

			if ( !socket.hasHubs ) {
				var hubs    = addContentHTML( 'script', 'hubs' );
				hubs.src    = socket.url + ( socket.url[socket.url.length] === '/' ? 'hubs' : '/' + 'hubs');
				hubs.onload = function () {
					socket.hasHubs = true;
					hubs.onload    = undefined;
					startSocket();
				};
				_body.appendChild( hubs );
				return;
			}

			socket.connection    = $.connection.notificationHub;
			$.connection.hub.qs  = 'authtoken=' + _config.token;
			$.connection.hub.url = socket.url;

			socket.connection.client.receiveNotification = (onSocketMessage);

			try {
				$.connection.hub.start( { transport:['webSockets', 'longPolling'] } )
				 .fail( resetSocketListeners );
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

		//Pega total de itens não lidos.
		getUnreadList(
			function ( data ) {
				var welcome, msg, lista = JSON.parse( data ).length;
				welcome                 = localStorage.getItem( 'welcome' );

				if ( lista ) {
					counterIncrement( lista );
					msg = {
						header:'Bem vindo',
						body  :'Há novas notificações!'
					};
				}
				else {
					msg = {
						header:'Bem vindo',
						body  :'Não há notificações.'
					}
				}

				if ( welcome ) {
					welcome = (new Date()).toLocaleDateString( 'pt-br' ) === welcome;
				}

				if ( !welcome ) {
					showSnackbar( msg, 0, 3 );
					localStorage.setItem( 'welcome', (new Date()).toLocaleDateString( 'pt-br' ) );
				}

			}
		);
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
};
