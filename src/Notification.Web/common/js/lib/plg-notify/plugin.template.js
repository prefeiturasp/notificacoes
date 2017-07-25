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

	function hasOwnProperty( obj, key ) {
		return obj.hasOwnProperty( key ) && obj[key];

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
			'Content-Type' :hasOwnProperty( _config.header, 'Content-Type' ),
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

		if ( !loader.classList.contains( 'plg-hide' ) ) {
			loader.classList.add( 'plg-hide' );
			span.classList.remove( 'plg-hide' );
		}
		else {
			span.classList.add( 'plg-hide' );
			loader.classList.remove( 'plg-hide' );
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
		var _layout = hasOwnProperty( layout, 'domPag' + events[t] )
		if ( paginator[t].total > 0 ) {
			_layout.classList.remove( 'plg-hide' );
		}
		else {
			_layout.classList.add( 'plg-hide' );
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
		//	'<ul class="plgnot">1</ul>' +
		//	'<ul class="plgnot">2</ul>' +
		//	'<ul class="plgnot">3</ul>' +
		//	'<ul class="plgnot">4</ul>' +
		//	'<ul class="plgnot">5</ul>'
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
				return setTimeout( f, 1000 * (1 / 60) )
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

		localStorage.removeItem( events.disturbTime );
		localStorage.removeItem( events.disturbTimeText );
		events.disturbId = undefined;

		hideSnackbar = false;

		layout.domdisturbcancel.classList.add( 'plg-hide' );
		document.querySelector( '.disturb p' ).innerHTML = "Mais opções";

		showSnackbar(
			{
				header :'Há novas notificações',
				body   :'Há ' + counter + ' notificações',
				noClick:true
			}
		);
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
				console.log( 'HideSnackbar', new Date( _local ) );
				return;
			}

			//cancelAnimationFrame(localStorage.getItem(events.disturbId));
			//noinspection JSUndeclaredVariable
			//Pega data atual e pega a diferença do tempo para parar o não perturbe.
			if ( !isNaN( requestAnimationFrame ) ) {
				clearTimeout( requestAnimationFrame );
			}
			requestAnimationFrame = setTimeout( disturbValidator, (_local - Date.now()) );

			texto           = document.querySelector( '.disturb p' );
			texto.innerHTML = localStorage.getItem( events.disturbTimeText );

			events.disturbId = requestAnimationFrame;
			layout.domlist.getElementsByClassName( 'plg-cancelar' )[0].classList.remove( 'plg-hide' );
			console.log( 'HideSnackbar', new Date( _local ) );
		}
		else if ( _local ) {
			console.info( 'Acabou não perturbe' );
			disturbCancel();
			layout.domplugin.classList.add( 'shake-anime' );

			setTimeout(
				function () {
					layout.domplugin.classList.remove( 'shake-anime' );
				}, 1100
			)
		}
	}

	/**
	 * Tratamento para quando seleciona um opção do não perturbe.
	 */
	function selectedDisturbOption( target ) {
		hidePlugin();
		hideList();

		document.querySelector( '.disturb p' ).innerHTML = target.innerHTML;

		localStorage.setItem( events.disturbTime, (Date.now() + parseInt( target.attributes.value.nodeValue )) );
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

		html = '<div class="plg-panel reticencias unselectable">';
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
			if ( !isNaN( parseInt( e.target && e.target.id ) ) && onclick ) {
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

		html.style.zIndex = layout.zIndex;
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
	 * Aplica valores do elemento em um html e retorna '<ul>'
	 * @param e - elemento do array.
	 * @returns {string} - string do elemento DOM.
	 */
	function timeToHTML( e ) {
		return '<ul id="' + (e.Id) + '" value="' + (e.TimeMinutes * 60 * 1000) + ' ">' + (e.Name) + '</ul>';
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
						_config.later  = '<ul>É preciso logar.</ul>';
						html.innerHTML = _config.later;

					}
				}
			);
		}

		html = '<div class="plg-panel reticencias unselectable">';
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
			if ( !isNaN( parseInt( e.target && e.target.id ) ) && onclick ) {
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

		html.style.zIndex = layout.zIndex;
		//hasSpace(html, e.target );
		setPosition( e.pageX, e.pageY - html.clientHeight, html )

	}

	/**
	 * Esconde lista dew notificações.
	 */
	function hideList() {
		listOpened = false;
		layout.domplugin.classList.remove( 'shake-anime' );
		layout.domlist.classList.add( 'plg-hide' );
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
				'<div class="sender reticencias">' +
				'<small>De: ' +
				'<span class="senderName "></span>' +
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
		adiar     = hasOwnProperty( footer.children, 'plg-modal-adiar' );

		adiar.onclick = function ( e ) {
			e.id = data.id || dom.id;
			showLaterOptions( e, _onClick );
		};

		function _onClick() {
			modal.classList.add( 'hitbox' );
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
		selectedNotification.Read           = true;
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
			showSnackbar(
				{
					header:'Tempo expirou!',
					body  :'Faça o login novamente.'
				}
			);
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
		type = type === events.unread ? 'novas' : 'lida';
		var string;
		return arr.map(
			function ( e ) {
				string = '<ul class="plgnot ' + type + ' " id="' + e.id + '">';

				// adiciona exclamação, se urgente
				if ( e.type > 3 ) {
					string += '<svg class="plg-nu" width="34" height="34" viewBox="0 0 24 24"><path fill="#d11d1d" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
				}

				string += '<span>' + e.title + '</span>' +
						  '<div>' + e.message + '</div>' +
						  '</ul>';

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
		loader  = element.getElementsByClassName( 'plgloader' )[0];

		if ( loader && loader.classList.contains( 'plgloader' ) ) {
			element.removeChild( element.childNodes[0] );
		}
		//
		//lista = notificationHTML( type, JSON.parse( data ) );
		//paginationValidate( type, lista );
		//lista=addContentHTML('li',lista.join( ' ' ),true);
		//
		//element.appendChild(lista);

		lista = notificationHTML( type, JSON.parse( data ) );
		paginationValidate( type, lista );

		element.innerHTML = lista.join( ' ' );

		if ( paginator[type].total ) {
			element.appendChild( hasOwnProperty( layout, 'domPag' + events[type] ) );
		}
	}

	/**
	 * Tratamento de erro para login.
	 */
	function getListError( e ) {
		var element = document.querySelector( '#' + this.id + '.plg-list' );
		var loader  = element.getElementsByClassName( 'plgloader' )[0];
		var title;
		var msg;

		if ( loader && loader.classList.contains( 'plgloader' ) ) {
			element.removeChild( element.childNodes[0] );
		}
		switch ( e.status ) {
			case 404, 500, 501, 502, 503, 504, 505:
				title = "Serviço indisponível";
				msg   = "Tente mais tarde.";
				break;
			case 200, 201, 202, 204, 205:
				return;
				break;
			default:
				title = "É preciso fazer login !";
				msg   = "Para poder ver as notificações.";
				break;
		}
		element.innerHTML = '<ul class="plgnot"><span>' + title + '</span>' +
							'<span><small>' + msg + '</small></span>' +
							'</ul>';

	}

	/**
	 * Mostra conteúdo de um lista.
	 */
	function showList( target ) {
		var fn;

		fn                         = (target.id === events.unread ) ? getUnreadList : getReadList;
		paginator[target.id].page  = 0;
		paginator[target.id].total = Infinity;

		fn(
			addNotification.bind( {}, target.id ),
			getListError.bind( target )
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
					counterIncrement( t );
				}
				success && success( r.response );
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

		layout.domlist.classList.remove( 'plg-hide' );
		// verifica se é possível abrir lista
		if ( !hasSpace( layout.domlist ) ) {
			layout.domplugin.classList.add( 'shake-anime' );
			layout.domlist.classList.add( 'plg-hide' );
			return;
		}

		layout.domlist.style.zIndex = layout.zIndex + 1;
		listOpened                  = true;

		layout.domlist.classList.remove( 'plg-hide' );
		var lista = document.querySelector( '.plgtab .visited' );

		if ( !lista.classList.contains( 'plgtablink-setting' ) ) {
			showList( lista );
		}
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
		console.log( 'dragging' )
		addDragging();

		if ( window.safari ) {
			addEventListener( window, events.mousemove, onMove );
		}
	}

	/**
	 * Tratamento para eventos de término arraste.
	 * @param {event} e - evento de dragend.
	 */
	function onDragEnd( e ) {
		console.log( 'onDragEnd' )
		if ( !dragging ) {
			return;
		}
		if ( window.safari ) {
			removeEventListener( window, events.mousemove, onMove );
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
			y = (y < 0) ? layout.paddingY : y;

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

		// Cria html do snackbar
		html = '<div class="unselectable reticencias plgsnackbar">' +
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

		layout.domsnackbar.noClick = msg.noClick || false;

		html.getElementsByClassName( 'plgsnackbar-center' )[0].onclick = function ( e ) {
			if ( e.currentTarget.id && e.currentTarget.id !== "" ) {
				postRead( e.currentTarget.id );
				openNotification( e, e.currentTarget.id );
			}
			hide();
		};

		html.getElementsByClassName( 'plgsnackbar-right' )[0].onclick = function ( e ) {
			//Remove eventos de blur da notificação.
			cancelHide();
			html.onmouseover = undefined;
			html.onmouseout  = undefined;

			if ( layout.domsnackbar.noClick ) {
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
			layout.domcounter.innerHTML = counter;
			return;
		}
		counter = num;

		//todo implementar substituição de classe.
		if ( counter > 99 ) {
			document.querySelector( '.plg-notify-counter' ).style.fontSize = '11px';
			layout.domcounter.innerHTML                                    = "99+";
		}
		else if ( counter > 9 ) {
			document.querySelector( '.plg-notify-counter' ).style.fontSize = '14px';
		}
		else {
			document.querySelector( '.plg-notify-counter' ).style.fontSize = '16px';
		}
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
		getUnreadList();
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

	var onMove = (function () {
		var timeWindow = 41.67; // tempo em ms
		var timeout;
		updater();
		return function ( e ) {
			cancelAnimationFrame( timeout );
			timeout = requestAnimationFrame(
				function () {
					dropPosition( layout.domplugin, e );
				}, timeWindow
			);
		};
	})();

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
	 * Remove evento à um elemento e seus parâmetros.
	 * @param {ElementDOM} el - elemento dom que recebe o evento.
	 * @param {Event} type - tipo de evento.
	 * @param {Function} callback - método que dispara quando evento acontecer.
	 * @param {Object} listenerConfig - configurações para evento.
	 */
	function removeEventListener( el, type, callback, listenerConfig ) {
		el.removeEventListener( type, callback, listenerConfig || false );
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
				mousemove:'mousemove',
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
		css = '<<css.min.css>>';
		dom = addContentHTML( 'style', css );
		_body.appendChild( dom );

		//adicionar plugin
		html = '<div ' + ((!window.safari) ? 'draggable="true"' : '') + ' class="float-menu plg-notify">' +
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
			   '<svg width="40" height="38" viewBox="0 0 24 24"><path d="M14,20A2,2 0 0,1 12,22A2,2 0 0,1 10,20H14M12,2A1,1 0 0,1 13,3V4.08C15.84,4.56 18,7.03 18,10V16L21,19H3L6,16V10C6,7.03 8.16,4.56 11,4.08V3A1,1 0 0,1 12,2Z"/></svg>' +
			   '</div>' +
			   '<a class="numeracao hitbox"><span class="plg-notify-counter">0</span></a>' +
			   '</div>' +
			   '<div class="plg-hide plg-notificacoes plgtab">' +
			   '<button class="plgtablink novas visited" id="' + events.unread + '">Novas</button>' +
			   '<button class="plgtablink lidas "id="' + events.read + '">Lidas</button>' +
			   '<button class="plgtablink-setting plgtablink " title="Configurações">' +
			   '<svg width="20" height="20" viewBox="0 0 24 24">' +
			   '<path fill="white" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/></svg>' +
			   '</button>' +
			   '<div class=" plg-list novas reticencias" id="' + events.unread + '"><ul class="plgnot plg-pag"><div class="plgloader fix24"></div></ul></div>' +
			   '<div class=" plg-list lidas reticencias" id="' + events.read + '"><ul class="plgnot plg-pag"><div class="plgloader fix24"></div></ul></div>' +
			   '<div class="plg-list configuracoes ">' +
			   '<ul class="disturb interactive unselectable">' +
			   '<strong>Silenciar por:</strong>' +
			   '<svg width="24" height="24" viewBox="0 0 24 24">' +
			   '<path fill="gray" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />' +
			   '</svg>' +
			   '<p>Mais opções</p>' +
			   '</ul>' +
			   '<ul title="Cancelar não perturbe" class="disturb plg-cancelar plg-hide"><p>Cancelar</p></ul>' +
			   '</div>' +
			   '</div>' +
			   '</div>';

		dom = addContentHTML( 'div', html );

		dom.classList.add( layout.container );

		//adiciona eventos de selectionar tab
		linksTabs = dom.querySelectorAll( 'button.plgtablink' );
		for ( var i = linksTabs.length ; i-- ; ) {
			if ( linksTabs[i] ) {
				linksTabs[i].onclick = selectTab;
			}
		}

		//aplica função de 'não perturbe'
		layout.domdisturb = domdisturb = dom.querySelector( '.disturb' );
		domdisturb.onclick = function ( e ) {
			showDisturbOptions( e, selectedDisturbOption );
		};

		//aplica função de cancelar 'não perturbe'
		layout.domdisturbcancel = domdisturbcancel = dom.querySelector( '.disturb.plg-cancelar' );
		domdisturbcancel.onclick = disturbCancel;

		_body.appendChild( dom );
		console.warn( 'Plugin adicionado na tela' );

		//Cria layout paginação, uma instancia para cada lista.
		var loadMore = '<ul class="plgnot plg-pag">' +
					   '<span> Carregar mais</span>' +
					   '<div class="plgloader fix24 plg-hide"></div>' +
					   '</ul>';

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

			zIndex :1400,
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

		//style = getComputedrrrtyle( layout.domplugin );

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
		addEventListener( window, events.mouseup, onDragEnd );
		addEventListener( window, events.mousedown, onBlur );

		if ( !window.safari ) {
			addEventListener( window, events.dragstart, onDragStart );
			addEventListener( window, events.dragend, onDragEnd );
		}
		else {
			//addEventListener( window, events.mousedown, onDragStart );
		}

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
		if ( !_config || !_config.ws || !_config.ws.url || !jQuery || jQuery && !jQuery.connection ) {
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
				hubs.src    = socket.url + ( socket.url[socket.url.length - 1] === '/' ? 'hubs' : '/' + 'hubs');
				hubs.onload = function () {
					socket.hasHubs = true;
					hubs.onload    = undefined;
					startSocket();
				};
				_body.appendChild( hubs );
				return;
			}

			socket.connection        = jQuery.connection.notificationHub;
			jQuery.connection.hub.qs = 'authtoken=' + _config.token;
			try {
				jQuery.connection.hub.start( { transport:['webSockets', 'longPolling'] } ).done(
					function () {
						socket.connection.client.receiveNotification = (onSocketMessage);
					}
					  )
					  .fail( resetSocketListeners );
			}
			catch ( e ) {
				console.error( 'não foi possível conectar no socket.\n', e );
			}

			jQuery.connection.hub.url = socket.url;
		}
	}

	/**
	 * Publica métodos para uso externo.
	 */
	function publish() {
		//Exibe plugin quanto todos os outros métodos tiver terminados.
		layout.domplugin.classList.remove( 'plg-hide' );

		//Pega total de itens não lidos.
		getUnreadList(
			function ( data ) {
				var welcome, msg, lista = JSON.parse( data ).length;
				welcome                 = localStorage.getItem( _config.userId );

				if ( lista ) {
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

				msg.noClick = true;

				if ( welcome ) {
					welcome = (new Date()).toLocaleDateString( 'pt-br' ) === welcome;
				}

				if ( !welcome ) {
					showSnackbar( msg, 0, 3 );
					localStorage.setItem( _config.userId, (new Date()).toLocaleDateString( 'pt-br' ) );
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

	if ( typeof(window.jQuery) == "function" || typeof(window.$) == "function" ) {
		var oldJQuery = window.jQuery || window.$
	}

	//polyfill classList
	if ( "document" in self ) {

		// Full polyfill for browsers with no classList support
		// Including IE < Edge missing SVGElement.classList
		if ( !("classList" in document.createElement( "_" ))
			 || document.createElementNS && !("classList" in document.createElementNS( "http://www.w3.org/2000/svg", "g" )) ) {

			(function ( view ) {

				"use strict";

				if ( !('Element' in view) ) {
					return;
				}

				var
					classListProp           = "classList"
					, protoProp             = "prototype"
					, elemCtrProto          = view.Element[protoProp]
					, objCtr                = Object
					, strTrim               = String[protoProp].trim || function () {
							return this.replace( /^\s+|\s+$/g, "" );
						}
					, arrIndexOf            = Array[protoProp].indexOf || function ( item ) {
							var
								i     = 0
								, len = this.length
								;
							for ( ; i < len ; i++ ) {
								if ( i in this && this[i] === item ) {
									return i;
								}
							}
							return -1;
						}
					// Vendors: please allow content code to instantiate DOMExceptions
					, DOMEx                 = function ( type, message ) {
						this.name    = type;
						this.code    = DOMException[type];
						this.message = message;
					}
					, checkTokenAndGetIndex = function ( classList, token ) {
						if ( token === "" ) {
							throw new DOMEx(
								"SYNTAX_ERR"
								, "An invalid or illegal string was specified"
							);
						}
						if ( /\s/.test( token ) ) {
							throw new DOMEx(
								"INVALID_CHARACTER_ERR"
								, "String contains an invalid character"
							);
						}
						return arrIndexOf.call( classList, token );
					}
					, ClassList             = function ( elem ) {
						var
							trimmedClasses = strTrim.call( elem.getAttribute( "class" ) || "" )
							, classes      = trimmedClasses ? trimmedClasses.split( /\s+/ ) : []
							, i            = 0
							, len          = classes.length
							;
						for ( ; i < len ; i++ ) {
							this.push( classes[i] );
						}
						this._updateClassName = function () {
							elem.setAttribute( "class", this.toString() );
						};
					}
					, classListProto        = ClassList[protoProp] = []
					, classListGetter = function () {
						return new ClassList( this );
					}
					;
				// Most DOMException implementations don't allow calling DOMException's toString()
				// on non-DOMExceptions. Error's toString() is sufficient here.
				DOMEx[protoProp]        = Error[protoProp];
				classListProto.item     = function ( i ) {
					return this[i] || null;
				};
				classListProto.contains = function ( token ) {
					token += "";
					return checkTokenAndGetIndex( this, token ) !== -1;
				};
				classListProto.add      = function () {
					var
						tokens    = arguments
						, i       = 0
						, l       = tokens.length
						, token
						, updated = false
						;
					do {
						token = tokens[i] + "";
						if ( checkTokenAndGetIndex( this, token ) === -1 ) {
							this.push( token );
							updated = true;
						}
					}
					while ( ++i < l );

					if ( updated ) {
						this._updateClassName();
					}
				};
				classListProto.remove   = function () {
					var
						tokens    = arguments
						, i       = 0
						, l       = tokens.length
						, token
						, updated = false
						, index
						;
					do {
						token = tokens[i] + "";
						index = checkTokenAndGetIndex( this, token );
						while ( index !== -1 ) {
							this.splice( index, 1 );
							updated = true;
							index   = checkTokenAndGetIndex( this, token );
						}
					}
					while ( ++i < l );

					if ( updated ) {
						this._updateClassName();
					}
				};
				classListProto.toggle   = function ( token, force ) {
					token += "";

					var
						result   = this.contains( token )
						, method = result ?
								   force !== true && "remove"
							:
								   force !== false && "add"
						;

					if ( method ) {
						this[method]( token );
					}

					if ( force === true || force === false ) {
						return force;
					}
					else {
						return !result;
					}
				};
				classListProto.toString = function () {
					return this.join( " " );
				};

				if ( objCtr.defineProperty ) {
					var classListPropDesc = {
						get           :classListGetter
						, enumerable  :true
						, configurable:true
					};
					try {
						objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
					}
					catch ( ex ) { // IE 8 doesn't support enumerable:true
						// adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
						// modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
						if ( ex.number === undefined || ex.number === -0x7FF5EC54 ) {
							classListPropDesc.enumerable = false;
							objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
						}
					}
				}
				else if ( objCtr[protoProp].__defineGetter__ ) {
					elemCtrProto.__defineGetter__( classListProp, classListGetter );
				}

			}( self ));

		}
	}

	/*! jQuery v2.1.4 | (c) 2005, 2015 jQuery Foundation, Inc. | jquery.org/license */
	!function ( a, b ) {
		"object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b( a, !0 ) : function ( a ) {
			if ( !a.document ) {
				throw new Error( "jQuery requires a window with a document" );
			}
			return b( a )
		} : b( a )
	}(
		"undefined" != typeof window ? window : this, function ( a, b ) {
			var c = [], d = c.slice, e = c.concat, f = c.push, g = c.indexOf, h = {}, i = h.toString, j = h.hasOwnProperty, k = {}, l = a.document, m = "2.1.4", n = function ( a, b ) {
				return new n.fn.init( a, b )
			}, o                                                                                                                                                   = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, p                                                                                                         = /^-ms-/, q = /-([\da-z])/gi, r = function ( a, b ) {
				return b.toUpperCase()
			};
			n.fn = n.prototype = {
				jquery:m, constructor:n, selector:"", length:0, toArray:function () {
					return d.call( this )
				}, get                                                 :function ( a ) {
					return null != a ? 0 > a ? this[a + this.length] : this[a] : d.call( this )
				}, pushStack                                           :function ( a ) {
					var b = n.merge( this.constructor(), a );
					return b.prevObject = this, b.context = this.context, b
				}, each                                                :function ( a, b ) {
					return n.each( this, a, b )
				}, map                                                 :function ( a ) {
					return this.pushStack(
						n.map(
							this, function ( b, c ) {
								return a.call( b, c, b )
							}
						)
					)
				}, slice                                               :function () {
					return this.pushStack( d.apply( this, arguments ) )
				}, first                                               :function () {
					return this.eq( 0 )
				}, last                                                :function () {
					return this.eq( -1 )
				}, eq                                                  :function ( a ) {
					var b = this.length, c = +a + (0 > a ? b : 0);
					return this.pushStack( c >= 0 && b > c ? [this[c]] : [] )
				}, end                                                 :function () {
					return this.prevObject || this.constructor( null )
				}, push                                                :f, sort:c.sort, splice:c.splice
			}, n.extend = n.fn.extend = function () {
				var a, b, c, d, e, f, g = arguments[0] || {}, h = 1, i = arguments.length, j = !1;
				for ( "boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || n.isFunction( g ) || (g = {}), h === i && (g = this, h--) ; i > h ; h++ )if ( null != (a = arguments[h]) )for ( b in a ) {
					c = g[b], d = a[b], g !== d && (j && d && (n.isPlainObject( d ) || (e = n.isArray( d ))) ? (e ? (e = !1, f = c && n.isArray( c ) ? c : []) : f = c && n.isPlainObject( c ) ? c : {}, g[b] = n.extend( j, f, d )) : void 0 !== d && (g[b] = d));
				}
				return g
			}, n.extend(
				{
					expando:"jQuery" + (m + Math.random()).replace( /\D/g, "" ), isReady:!0, error:function ( a ) {
					throw new Error( a )
				}, noop                                                                           :function () {
				}, isFunction                                                                     :function ( a ) {
					return "function" === n.type( a )
				}, isArray                                                                        :Array.isArray, isWindow:function ( a ) {
					return null != a && a === a.window
				}, isNumeric                                                                      :function ( a ) {
					return !n.isArray( a ) && a - parseFloat( a ) + 1 >= 0
				}, isPlainObject                                                                  :function ( a ) {
					return "object" !== n.type( a ) || a.nodeType || n.isWindow( a ) ? !1 : a.constructor && !j.call( a.constructor.prototype, "isPrototypeOf" ) ? !1 : !0
				}, isEmptyObject                                                                  :function ( a ) {
					var b;
					for ( b in a )return !1;
					return !0
				}, type                                                                           :function ( a ) {
					return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? h[i.call( a )] || "object" : typeof a
				}, globalEval                                                                     :function ( a ) {
					var b, c = eval;
					a = n.trim( a ), a && (1 === a.indexOf( "use strict" ) ? (b = l.createElement( "script" ), b.text = a, l.head.appendChild( b ).parentNode.removeChild( b )) : c( a ))
				}, camelCase                                                                      :function ( a ) {
					return a.replace( p, "ms-" ).replace( q, r )
				}, nodeName                                                                       :function ( a, b ) {
					return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase()
				}, each                                                                           :function ( a, b, c ) {
					var d, e = 0, f = a.length, g = s( a );
					if ( c ) {
						if ( g ) {
							for ( ; f > e ; e++ )if ( d = b.apply( a[e], c ), d === !1 )break
						}
						else for ( e in a )if ( d = b.apply( a[e], c ), d === !1 )break
					}
					else if ( g ) {
						for ( ; f > e ; e++ )if ( d = b.call( a[e], e, a[e] ), d === !1 )break
					}
					else for ( e in a )if ( d = b.call( a[e], e, a[e] ), d === !1 )break;
					return a
				}, trim                                                                           :function ( a ) {
					return null == a ? "" : (a + "").replace( o, "" )
				}, makeArray                                                                      :function ( a, b ) {
					var c = b || [];
					return null != a && (s( Object( a ) ) ? n.merge( c, "string" == typeof a ? [a] : a ) : f.call( c, a )), c
				}, inArray                                                                        :function ( a, b, c ) {
					return null == b ? -1 : g.call( b, a, c )
				}, merge                                                                          :function ( a, b ) {
					for ( var c = +b.length, d = 0, e = a.length ; c > d ; d++ )a[e++] = b[d];
					return a.length = e, a
				}, grep                                                                           :function ( a, b, c ) {
					for ( var d, e = [], f = 0, g = a.length, h = !c ; g > f ; f++ )d = !b( a[f], f ), d !== h && e.push( a[f] );
					return e
				}, map                                                                            :function ( a, b, c ) {
					var d, f = 0, g = a.length, h = s( a ), i = [];
					if ( h )for ( ; g > f ; f++ )d = b( a[f], f, c ), null != d && i.push( d );
					else for ( f in a )d = b( a[f], f, c ), null != d && i.push( d );
					return e.apply( [], i )
				}, guid                                                                           :1, proxy                                                                  :function ( a, b ) {
					var c, e, f;
					return "string" == typeof b && (c = a[b], b = a, a = c), n.isFunction( a ) ? (e = d.call( arguments, 2 ), f = function () {
						return a.apply( b || this, e.concat( d.call( arguments ) ) )
					}, f.guid = a.guid = a.guid || n.guid++, f) : void 0
				}, now                                                                            :Date.now, support                                                          :k
				}
			), n.each(
				"Boolean Number String Function Array Date RegExp Object Error".split( " " ), function ( a, b ) {
					h["[object " + b + "]"] = b.toLowerCase()
				}
			);
			function s( a ) {
				var b = "length" in a && a.length, c = n.type( a );
				return "function" === c || n.isWindow( a ) ? !1 : 1 === a.nodeType && b ? !0 : "array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a
			}

			var t = function ( a ) {
				var b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                = "sizzle" + 1 * new Date, v                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   = a.document, w = 0, x = 0, y = ha(), z = ha(), A = ha(), B = function ( a, b ) {
					return a === b && (l = !0), 0
				}, C                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          = 1 << 31, D                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             = {}.hasOwnProperty, E = [], F = E.pop, G = E.push, H = E.push, I = E.slice, J = function ( a, b ) {
					for ( var c = 0, d = a.length ; d > c ; c++ )if ( a[c] === b )return c;
					return -1
				}, K = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", L = "[\\x20\\t\\r\\n\\f]", M = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", N = M.replace( "w", "w#" ), O = "\\[" + L + "*(" + M + ")(?:" + L + "*([*^$|!~]?=)" + L + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + N + "))|)" + L + "*\\]", P = ":(" + M + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + O + ")*)|.*)\\)|)", Q = new RegExp( L + "+", "g" ), R = new RegExp( "^" + L + "+|((?:^|[^\\\\])(?:\\\\.)*)" + L + "+$", "g" ), S = new RegExp( "^" + L + "*," + L + "*" ), T = new RegExp( "^" + L + "*([>+~]|" + L + ")" + L + "*" ), U = new RegExp( "=" + L + "*([^\\]'\"]*?)" + L + "*\\]", "g" ), V = new RegExp( P ), W = new RegExp( "^" + N + "$" ), X = { ID:new RegExp( "^#(" + M + ")" ), CLASS:new RegExp( "^\\.(" + M + ")" ), TAG:new RegExp( "^(" + M.replace( "w", "w*" ) + ")" ), ATTR:new RegExp( "^" + O ), PSEUDO:new RegExp( "^" + P ), CHILD:new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + L + "*(even|odd|(([+-]|)(\\d*)n|)" + L + "*(?:([+-]|)" + L + "*(\\d+)|))" + L + "*\\)|)", "i" ), bool:new RegExp( "^(?:" + K + ")$", "i" ), needsContext:new RegExp( "^" + L + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + L + "*((?:-\\d)?\\d*)" + L + "*\\)|)(?=[^-]|$)", "i" ) }, Y = /^(?:input|select|textarea|button)$/i, Z = /^h\d$/i, $ = /^[^{]+\{\s*\[native \w/, _ = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, aa = /[+~]/, ba = /'|\\/g, ca = new RegExp( "\\\\([\\da-f]{1,6}" + L + "?|(" + L + ")|.)", "ig" ), da = function (
					a,
					b,
					c
				) {
					var d = "0x" + b - 65536;
					return d !== d || c ? b : 0 > d ? String.fromCharCode( d + 65536 ) : String.fromCharCode( d >> 10 | 55296, 1023 & d | 56320 )
				}, ea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         = function () {
					m()
				};
				try {
					H.apply( E = I.call( v.childNodes ), v.childNodes ), E[v.childNodes.length].nodeType
				}
				catch ( fa ) {
					H = {
						apply:E.length ? function ( a, b ) {
							G.apply( a, I.call( b ) )
						} : function ( a, b ) {
							var c = a.length, d = 0;
							while ( a[c++] = b[d++] );
							a.length = c - 1
						}
					}
				}
				function ga( a, b, d, e ) {
					var f, h, j, k, l, o, r, s, w, x;
					if ( (b ? b.ownerDocument || b : v) !== n && m( b ), b = b || n, d = d || [], k = b.nodeType, "string" != typeof a || !a || 1 !== k && 9 !== k && 11 !== k )return d;
					if ( !e && p ) {
						if ( 11 !== k && (f = _.exec( a )) )if ( j = f[1] ) {
							if ( 9 === k ) {
								if ( h = b.getElementById( j ), !h || !h.parentNode )return d;
								if ( h.id === j )return d.push( h ), d
							}
							else if ( b.ownerDocument && (h = b.ownerDocument.getElementById( j )) && t( b, h ) && h.id === j )return d.push( h ), d
						}
						else {
							if ( f[2] )return H.apply( d, b.getElementsByTagName( a ) ), d;
							if ( (j = f[3]) && c.getElementsByClassName )return H.apply( d, b.getElementsByClassName( j ) ), d
						}
						if ( c.qsa && (!q || !q.test( a )) ) {
							if ( s = r = u, w = b, x = 1 !== k && a, 1 === k && "object" !== b.nodeName.toLowerCase() ) {
								o = g( a ), (r = b.getAttribute( "id" )) ? s = r.replace( ba, "\\$&" ) : b.setAttribute( "id", s ), s = "[id='" + s + "'] ", l = o.length;
								while ( l-- )o[l] = s + ra( o[l] );
								w = aa.test( a ) && pa( b.parentNode ) || b, x = o.join( "," )
							}
							if ( x )try {
								return H.apply( d, w.querySelectorAll( x ) ), d
							}
							catch ( y ) {
							}
							finally {
								r || b.removeAttribute( "id" )
							}
						}
					}
					return i( a.replace( R, "$1" ), b, d, e )
				}

				function ha() {
					var a = [];

					function b( c, e ) {
						return a.push( c + " " ) > d.cacheLength && delete b[a.shift()], b[c + " "] = e
					}

					return b
				}

				function ia( a ) {
					return a[u] = !0, a
				}

				function ja( a ) {
					var b = n.createElement( "div" );
					try {
						return !!a( b )
					}
					catch ( c ) {
						return !1
					}
					finally {
						b.parentNode && b.parentNode.removeChild( b ), b = null
					}
				}

				function ka( a, b ) {
					var c = a.split( "|" ), e = a.length;
					while ( e-- )d.attrHandle[c[e]] = b
				}

				function la( a, b ) {
					var c = b && a, d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || C) - (~a.sourceIndex || C);
					if ( d )return d;
					if ( c )while ( c = c.nextSibling )if ( c === b )return -1;
					return a ? 1 : -1
				}

				function ma( a ) {
					return function ( b ) {
						var c = b.nodeName.toLowerCase();
						return "input" === c && b.type === a
					}
				}

				function na( a ) {
					return function ( b ) {
						var c = b.nodeName.toLowerCase();
						return ("input" === c || "button" === c) && b.type === a
					}
				}

				function oa( a ) {
					return ia(
						function ( b ) {
							return b = +b, ia(
								function ( c, d ) {
									var e, f = a( [], c.length, b ), g = f.length;
									while ( g-- )c[e = f[g]] && (c[e] = !(d[e] = c[e]))
								}
							)
						}
					)
				}

				function pa( a ) {
					return a && "undefined" != typeof a.getElementsByTagName && a
				}

				c = ga.support = {}, f = ga.isXML = function ( a ) {
					var b = a && (a.ownerDocument || a).documentElement;
					return b ? "HTML" !== b.nodeName : !1
				}, m = ga.setDocument = function ( a ) {
					var b, e, g = a ? a.ownerDocument || a : v;
					return g !== n && 9 === g.nodeType && g.documentElement ? (n = g, o = g.documentElement, e = g.defaultView, e && e !== e.top && (e.addEventListener ? e.addEventListener( "unload", ea, !1 ) : e.attachEvent && e.attachEvent( "onunload", ea )), p = !f( g ), c.attributes = ja(
						function ( a ) {
							return a.className = "i", !a.getAttribute( "className" )
						}
					), c.getElementsByTagName = ja(
						function ( a ) {
							return a.appendChild( g.createComment( "" ) ), !a.getElementsByTagName( "*" ).length
						}
					), c.getElementsByClassName = $.test( g.getElementsByClassName ), c.getById = ja(
						function ( a ) {
							return o.appendChild( a ).id = u, !g.getElementsByName || !g.getElementsByName( u ).length
						}
					), c.getById ? (d.find.ID = function ( a, b ) {
						if ( "undefined" != typeof b.getElementById && p ) {
							var c = b.getElementById( a );
							return c && c.parentNode ? [c] : []
						}
					}, d.filter.ID = function ( a ) {
						var b = a.replace( ca, da );
						return function ( a ) {
							return a.getAttribute( "id" ) === b
						}
					}) : (delete d.find.ID, d.filter.ID = function ( a ) {
						var b = a.replace( ca, da );
						return function ( a ) {
							var c = "undefined" != typeof a.getAttributeNode && a.getAttributeNode( "id" );
							return c && c.value === b
						}
					}), d.find.TAG = c.getElementsByTagName ? function ( a, b ) {
						return "undefined" != typeof b.getElementsByTagName ? b.getElementsByTagName( a ) : c.qsa ? b.querySelectorAll( a ) : void 0
					} : function ( a, b ) {
						var c, d = [], e = 0, f = b.getElementsByTagName( a );
						if ( "*" === a ) {
							while ( c = f[e++] )1 === c.nodeType && d.push( c );
							return d
						}
						return f
					}, d.find.CLASS = c.getElementsByClassName && function ( a, b ) {
							return p ? b.getElementsByClassName( a ) : void 0
						}, r = [], q = [], (c.qsa = $.test( g.querySelectorAll )) && (ja(
						function ( a ) {
							o.appendChild( a ).innerHTML = "<a id='" + u + "'></a><select id='" + u + "-\f]' msallowcapture=''><option selected=''></option></select>", a.querySelectorAll( "[msallowcapture^='']" ).length && q.push( "[*^$]=" + L + "*(?:''|\"\")" ), a.querySelectorAll( "[selected]" ).length || q.push( "\\[" + L + "*(?:value|" + K + ")" ), a.querySelectorAll( "[id~=" + u + "-]" ).length || q.push( "~=" ), a.querySelectorAll( ":checked" ).length || q.push( ":checked" ), a.querySelectorAll( "a#" + u + "+*" ).length || q.push( ".#.+[+~]" )
						}
					), ja(
						function ( a ) {
							var b = g.createElement( "input" );
							b.setAttribute( "type", "hidden" ), a.appendChild( b ).setAttribute( "name", "D" ), a.querySelectorAll( "[name=d]" ).length && q.push( "name" + L + "*[*^$|!~]?=" ), a.querySelectorAll( ":enabled" ).length || q.push( ":enabled", ":disabled" ), a.querySelectorAll( "*,:x" ), q.push( ",.*:" )
						}
					)), (c.matchesSelector = $.test( s = o.matches || o.webkitMatchesSelector || o.mozMatchesSelector || o.oMatchesSelector || o.msMatchesSelector )) && ja(
						function ( a ) {
							c.disconnectedMatch = s.call( a, "div" ), s.call( a, "[s!='']:x" ), r.push( "!=", P )
						}
					), q = q.length && new RegExp( q.join( "|" ) ), r = r.length && new RegExp( r.join( "|" ) ), b = $.test( o.compareDocumentPosition ), t = b || $.test( o.contains ) ? function ( a, b ) {
						var c = 9 === a.nodeType ? a.documentElement : a, d = b && b.parentNode;
						return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains( d ) : a.compareDocumentPosition && 16 & a.compareDocumentPosition( d )))
					} : function ( a, b ) {
						if ( b )while ( b = b.parentNode )if ( b === a )return !0;
						return !1
					}, B = b ? function ( a, b ) {
						if ( a === b )return l = !0, 0;
						var d = !a.compareDocumentPosition - !b.compareDocumentPosition;
						return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition( b ) : 1, 1 & d || !c.sortDetached && b.compareDocumentPosition( a ) === d ? a === g || a.ownerDocument === v && t( v, a ) ? -1 : b === g || b.ownerDocument === v && t( v, b ) ? 1 : k ? J( k, a ) - J( k, b ) : 0 : 4 & d ? -1 : 1)
					} : function ( a, b ) {
						if ( a === b )return l = !0, 0;
						var c, d = 0, e = a.parentNode, f = b.parentNode, h = [a], i = [b];
						if ( !e || !f )return a === g ? -1 : b === g ? 1 : e ? -1 : f ? 1 : k ? J( k, a ) - J( k, b ) : 0;
						if ( e === f )return la( a, b );
						c = a;
						while ( c = c.parentNode )h.unshift( c );
						c = b;
						while ( c = c.parentNode )i.unshift( c );
						while ( h[d] === i[d] )d++;
						return d ? la( h[d], i[d] ) : h[d] === v ? -1 : i[d] === v ? 1 : 0
					}, g) : n
				}, ga.matches = function ( a, b ) {
					return ga( a, null, null, b )
				}, ga.matchesSelector = function ( a, b ) {
					if ( (a.ownerDocument || a) !== n && m( a ), b = b.replace( U, "='$1']" ), !(!c.matchesSelector || !p || r && r.test( b ) || q && q.test( b )) )try {
						var d = s.call( a, b );
						if ( d || c.disconnectedMatch || a.document && 11 !== a.document.nodeType )return d
					}
					catch ( e ) {
					}
					return ga( b, n, null, [a] ).length > 0
				}, ga.contains = function ( a, b ) {
					return (a.ownerDocument || a) !== n && m( a ), t( a, b )
				}, ga.attr = function ( a, b ) {
					(a.ownerDocument || a) !== n && m( a );
					var e = d.attrHandle[b.toLowerCase()], f = e && D.call( d.attrHandle, b.toLowerCase() ) ? e( a, b, !p ) : void 0;
					return void 0 !== f ? f : c.attributes || !p ? a.getAttribute( b ) : (f = a.getAttributeNode( b )) && f.specified ? f.value : null
				}, ga.error = function ( a ) {
					throw new Error( "Syntax error, unrecognized expression: " + a )
				}, ga.uniqueSort = function ( a ) {
					var b, d = [], e = 0, f = 0;
					if ( l = !c.detectDuplicates, k = !c.sortStable && a.slice( 0 ), a.sort( B ), l ) {
						while ( b = a[f++] )b === a[f] && (e = d.push( f ));
						while ( e-- )a.splice( d[e], 1 )
					}
					return k = null, a
				}, e = ga.getText = function ( a ) {
					var b, c = "", d = 0, f = a.nodeType;
					if ( f ) {
						if ( 1 === f || 9 === f || 11 === f ) {
							if ( "string" == typeof a.textContent )return a.textContent;
							for ( a = a.firstChild ; a ; a = a.nextSibling )c += e( a )
						}
						else if ( 3 === f || 4 === f )return a.nodeValue
					}
					else while ( b = a[d++] )c += e( b );
					return c
				}, d = ga.selectors = {
					cacheLength:50, createPseudo:ia, match:X, attrHandle:{}, find:{}, relative:{ ">":{ dir:"parentNode", first:!0 }, " ":{ dir:"parentNode" }, "+":{ dir:"previousSibling", first:!0 }, "~":{ dir:"previousSibling" } }, preFilter:{
						ATTR     :function ( a ) {
							return a[1] = a[1].replace( ca, da ), a[3] = (a[3] || a[4] || a[5] || "").replace( ca, da ), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice( 0, 4 )
						}, CHILD :function ( a ) {
							return a[1] = a[1].toLowerCase(), "nth" === a[1].slice( 0, 3 ) ? (a[3] || ga.error( a[0] ), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && ga.error( a[0] ), a
						}, PSEUDO:function ( a ) {
							var b, c = !a[6] && a[2];
							return X.CHILD.test( a[0] ) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && V.test( c ) && (b = g( c, !0 )) && (b = c.indexOf( ")", c.length - b ) - c.length) && (a[0] = a[0].slice( 0, b ), a[2] = c.slice( 0, b )), a.slice( 0, 3 ))
						}
					}, filter                                                                                                                                                                                                                     :{
						TAG      :function ( a ) {
							var b = a.replace( ca, da ).toLowerCase();
							return "*" === a ? function () {
								return !0
							} : function ( a ) {
								return a.nodeName && a.nodeName.toLowerCase() === b
							}
						}, CLASS :function ( a ) {
							var b = y[a + " "];
							return b || (b = new RegExp( "(^|" + L + ")" + a + "(" + L + "|$)" )) && y(
									a, function ( a ) {
										return b.test( "string" == typeof a.className && a.className || "undefined" != typeof a.getAttribute && a.getAttribute( "class" ) || "" )
									}
								)
						}, ATTR  :function ( a, b, c ) {
							return function ( d ) {
								var e = ga.attr( d, a );
								return null == e ? "!=" === b : b ? (e += "", "=" === b ? e === c : "!=" === b ? e !== c : "^=" === b ? c && 0 === e.indexOf( c ) : "*=" === b ? c && e.indexOf( c ) > -1 : "$=" === b ? c && e.slice( -c.length ) === c : "~=" === b ? (" " + e.replace( Q, " " ) + " ").indexOf( c ) > -1 : "|=" === b ? e === c || e.slice( 0, c.length + 1 ) === c + "-" : !1) : !0
							}
						}, CHILD :function ( a, b, c, d, e ) {
							var f = "nth" !== a.slice( 0, 3 ), g = "last" !== a.slice( -4 ), h = "of-type" === b;
							return 1 === d && 0 === e ? function ( a ) {
								return !!a.parentNode
							} : function ( b, c, i ) {
								var j, k, l, m, n, o, p = f !== g ? "nextSibling" : "previousSibling", q = b.parentNode, r = h && b.nodeName.toLowerCase(), s = !i && !h;
								if ( q ) {
									if ( f ) {
										while ( p ) {
											l = b;
											while ( l = l[p] )if ( h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType )return !1;
											o = p = "only" === a && !o && "nextSibling"
										}
										return !0
									}
									if ( o = [g ? q.firstChild : q.lastChild], g && s ) {
										k = q[u] || (q[u] = {}), j = k[a] || [], n = j[0] === w && j[1], m = j[0] === w && j[2], l = n && q.childNodes[n];
										while ( l = ++n && l && l[p] || (m = n = 0) || o.pop() )if ( 1 === l.nodeType && ++m && l === b ) {
											k[a] = [w, n, m];
											break
										}
									}
									else if ( s && (j = (b[u] || (b[u] = {}))[a]) && j[0] === w )m = j[1];
									else while ( l = ++n && l && l[p] || (m = n = 0) || o.pop() )if ( (h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) && ++m && (s && ((l[u] || (l[u] = {}))[a] = [w, m]), l === b) )break;
									return m -= e, m === d || m % d === 0 && m / d >= 0
								}
							}
						}, PSEUDO:function ( a, b ) {
							var c, e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || ga.error( "unsupported pseudo: " + a );
							return e[u] ? e( b ) : e.length > 1 ? (c = [a, a, "", b], d.setFilters.hasOwnProperty( a.toLowerCase() ) ? ia(
								function ( a, c ) {
									var d, f = e( a, b ), g = f.length;
									while ( g-- )d = J( a, f[g] ), a[d] = !(c[d] = f[g])
								}
							) : function ( a ) {
								return e( a, 0, c )
							}) : e
						}
					}, pseudos                                                                                                                                                                                                                    :{
						not        :ia(
							function ( a ) {
								var b = [], c = [], d = h( a.replace( R, "$1" ) );
								return d[u] ? ia(
									function ( a, b, c, e ) {
										var f, g = d( a, null, e, [] ), h = a.length;
										while ( h-- )(f = g[h]) && (a[h] = !(b[h] = f))
									}
								) : function ( a, e, f ) {
									return b[0] = a, d( b, null, f, c ), b[0] = null, !c.pop()
								}
							}
						), has     :ia(
							function ( a ) {
								return function ( b ) {
									return ga( a, b ).length > 0
								}
							}
						), contains:ia(
							function ( a ) {
								return a = a.replace( ca, da ), function ( b ) {
									return (b.textContent || b.innerText || e( b )).indexOf( a ) > -1
								}
							}
						), lang    :ia(
							function ( a ) {
								return W.test( a || "" ) || ga.error( "unsupported lang: " + a ), a = a.replace( ca, da ).toLowerCase(), function ( b ) {
									var c;
									do if ( c = p ? b.lang : b.getAttribute( "xml:lang" ) || b.getAttribute( "lang" ) )return c = c.toLowerCase(), c === a || 0 === c.indexOf( a + "-" );
									while ( (b = b.parentNode) && 1 === b.nodeType );
									return !1
								}
							}
						), target  :function ( b ) {
							var c = a.location && a.location.hash;
							return c && c.slice( 1 ) === b.id
						}, root    :function ( a ) {
							return a === o
						}, focus   :function ( a ) {
							return a === n.activeElement && (!n.hasFocus || n.hasFocus()) && !!(a.type || a.href || ~a.tabIndex)
						}, enabled :function ( a ) {
							return a.disabled === !1
						}, disabled:function ( a ) {
							return a.disabled === !0
						}, checked :function ( a ) {
							var b = a.nodeName.toLowerCase();
							return "input" === b && !!a.checked || "option" === b && !!a.selected
						}, selected:function ( a ) {
							return a.parentNode && a.parentNode.selectedIndex, a.selected === !0
						}, empty   :function ( a ) {
							for ( a = a.firstChild ; a ; a = a.nextSibling )if ( a.nodeType < 6 )return !1;
							return !0
						}, parent  :function ( a ) {
							return !d.pseudos.empty( a )
						}, header  :function ( a ) {
							return Z.test( a.nodeName )
						}, input   :function ( a ) {
							return Y.test( a.nodeName )
						}, button  :function ( a ) {
							var b = a.nodeName.toLowerCase();
							return "input" === b && "button" === a.type || "button" === b
						}, text    :function ( a ) {
							var b;
							return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute( "type" )) || "text" === b.toLowerCase())
						}, first   :oa(
							function () {
								return [0]
							}
						), last    :oa(
							function ( a, b ) {
								return [b - 1]
							}
						), eq      :oa(
							function ( a, b, c ) {
								return [0 > c ? c + b : c]
							}
						), even    :oa(
							function ( a, b ) {
								for ( var c = 0 ; b > c ; c += 2 )a.push( c );
								return a
							}
						), odd     :oa(
							function ( a, b ) {
								for ( var c = 1 ; b > c ; c += 2 )a.push( c );
								return a
							}
						), lt      :oa(
							function ( a, b, c ) {
								for ( var d = 0 > c ? c + b : c ; --d >= 0 ; )a.push( d );
								return a
							}
						), gt      :oa(
							function ( a, b, c ) {
								for ( var d = 0 > c ? c + b : c ; ++d < b ; )a.push( d );
								return a
							}
						)
					}
				}, d.pseudos.nth = d.pseudos.eq;
				for ( b in{ radio:!0, checkbox:!0, file:!0, password:!0, image:!0 } )d.pseudos[b] = ma( b );
				for ( b in{ submit:!0, reset:!0 } )d.pseudos[b] = na( b );
				function qa() {
				}

				qa.prototype = d.filters = d.pseudos, d.setFilters = new qa, g = ga.tokenize = function ( a, b ) {
					var c, e, f, g, h, i, j, k = z[a + " "];
					if ( k )return b ? 0 : k.slice( 0 );
					h = a, i = [], j = d.preFilter;
					while ( h ) {
						(!c || (e = S.exec( h ))) && (e && (h = h.slice( e[0].length ) || h), i.push( f = [] )), c = !1, (e = T.exec( h )) && (c = e.shift(), f.push( { value:c, type:e[0].replace( R, " " ) } ), h = h.slice( c.length ));
						for ( g in d.filter )!(e = X[g].exec( h )) || j[g] && !(e = j[g]( e )) || (c = e.shift(), f.push( { value:c, type:g, matches:e } ), h = h.slice( c.length ));
						if ( !c )break
					}
					return b ? h.length : h ? ga.error( a ) : z( a, i ).slice( 0 )
				};
				function ra( a ) {
					for ( var b = 0, c = a.length, d = "" ; c > b ; b++ )d += a[b].value;
					return d
				}

				function sa( a, b, c ) {
					var d = b.dir, e = c && "parentNode" === d, f = x++;
					return b.first ? function ( b, c, f ) {
						while ( b = b[d] )if ( 1 === b.nodeType || e )return a( b, c, f )
					} : function ( b, c, g ) {
						var h, i, j = [w, f];
						if ( g ) {
							while ( b = b[d] )if ( (1 === b.nodeType || e) && a( b, c, g ) )return !0
						}
						else while ( b = b[d] )if ( 1 === b.nodeType || e ) {
							if ( i = b[u] || (b[u] = {}), (h = i[d]) && h[0] === w && h[1] === f )return j[2] = h[2];
							if ( i[d] = j, j[2] = a( b, c, g ) )return !0
						}
					}
				}

				function ta( a ) {
					return a.length > 1 ? function ( b, c, d ) {
						var e = a.length;
						while ( e-- )if ( !a[e]( b, c, d ) )return !1;
						return !0
					} : a[0]
				}

				function ua( a, b, c ) {
					for ( var d = 0, e = b.length ; e > d ; d++ )ga( a, b[d], c );
					return c
				}

				function va( a, b, c, d, e ) {
					for ( var f, g = [], h = 0, i = a.length, j = null != b ; i > h ; h++ )(f = a[h]) && (!c || c( f, d, e )) && (g.push( f ), j && b.push( h ));
					return g
				}

				function wa( a, b, c, d, e, f ) {
					return d && !d[u] && (d = wa( d )), e && !e[u] && (e = wa( e, f )), ia(
						function ( f, g, h, i ) {
							var j, k, l, m = [], n = [], o = g.length, p = f || ua( b || "*", h.nodeType ? [h] : h, [] ), q = !a || !f && b ? p : va( p, m, a, h, i ), r = c ? e || (f ? a : o || d) ? [] : g : q;
							if ( c && c( q, r, h, i ), d ) {
								j = va( r, n ), d( j, [], h, i ), k = j.length;
								while ( k-- )(l = j[k]) && (r[n[k]] = !(q[n[k]] = l))
							}
							if ( f ) {
								if ( e || a ) {
									if ( e ) {
										j = [], k = r.length;
										while ( k-- )(l = r[k]) && j.push( q[k] = l );
										e( null, r = [], j, i )
									}
									k = r.length;
									while ( k-- )(l = r[k]) && (j = e ? J( f, l ) : m[k]) > -1 && (f[j] = !(g[j] = l))
								}
							}
							else r = va( r === g ? r.splice( o, r.length ) : r ), e ? e( null, g, r, i ) : H.apply( g, r )
						}
					)
				}

				function xa( a ) {
					for ( var b, c, e, f = a.length, g = d.relative[a[0].type], h = g || d.relative[" "], i = g ? 1 : 0, k = sa(
						function ( a ) {
							return a === b
						}, h, !0
					), l                                                                                                   = sa(
						function ( a ) {
							return J( b, a ) > -1
						}, h, !0
					), m                                                                                                   = [
						function ( a, c, d ) {
							var e = !g && (d || c !== j) || ((b = c).nodeType ? k( a, c, d ) : l( a, c, d ));
							return b = null, e
						}
					] ; f > i ; i++ )if ( c = d.relative[a[i].type] )m = [sa( ta( m ), c )];
					else {
						if ( c = d.filter[a[i].type].apply( null, a[i].matches ), c[u] ) {
							for ( e = ++i ; f > e ; e++ )if ( d.relative[a[e].type] )break;
							return wa( i > 1 && ta( m ), i > 1 && ra( a.slice( 0, i - 1 ).concat( { value:" " === a[i - 2].type ? "*" : "" } ) ).replace( R, "$1" ), c, e > i && xa( a.slice( i, e ) ), f > e && xa( a = a.slice( e ) ), f > e && ra( a ) )
						}
						m.push( c )
					}
					return ta( m )
				}

				function ya( a, b ) {
					var c = b.length > 0, e = a.length > 0, f = function ( f, g, h, i, k ) {
						var l, m, o, p = 0, q = "0", r = f && [], s = [], t = j, u = f || e && d.find.TAG( "*", k ), v = w += null == t ? 1 : Math.random() || .1, x = u.length;
						for ( k && (j = g !== n && g) ; q !== x && null != (l = u[q]) ; q++ ) {
							if ( e && l ) {
								m = 0;
								while ( o = a[m++] )if ( o( l, g, h ) ) {
									i.push( l );
									break
								}
								k && (w = v)
							}
							c && ((l = !o && l) && p--, f && r.push( l ))
						}
						if ( p += q, c && q !== p ) {
							m = 0;
							while ( o = b[m++] )o( r, s, g, h );
							if ( f ) {
								if ( p > 0 )while ( q-- )r[q] || s[q] || (s[q] = F.call( i ));
								s = va( s )
							}
							H.apply( i, s ), k && !f && s.length > 0 && p + b.length > 1 && ga.uniqueSort( i )
						}
						return k && (w = v, j = t), r
					};
					return c ? ia( f ) : f
				}

				return h = ga.compile = function ( a, b ) {
					var c, d = [], e = [], f = A[a + " "];
					if ( !f ) {
						b || (b = g( a )), c = b.length;
						while ( c-- )f = xa( b[c] ), f[u] ? d.push( f ) : e.push( f );
						f = A( a, ya( e, d ) ), f.selector = a
					}
					return f
				}, i = ga.select = function ( a, b, e, f ) {
					var i, j, k, l, m, n = "function" == typeof a && a, o = !f && g( a = n.selector || a );
					if ( e = e || [], 1 === o.length ) {
						if ( j = o[0] = o[0].slice( 0 ), j.length > 2 && "ID" === (k = j[0]).type && c.getById && 9 === b.nodeType && p && d.relative[j[1].type] ) {
							if ( b = (d.find.ID( k.matches[0].replace( ca, da ), b ) || [])[0], !b )return e;
							n && (b = b.parentNode), a = a.slice( j.shift().value.length )
						}
						i = X.needsContext.test( a ) ? 0 : j.length;
						while ( i-- ) {
							if ( k = j[i], d.relative[l = k.type] )break;
							if ( (m = d.find[l]) && (f = m( k.matches[0].replace( ca, da ), aa.test( j[0].type ) && pa( b.parentNode ) || b )) ) {
								if ( j.splice( i, 1 ), a = f.length && ra( j ), !a )return H.apply( e, f ), e;
								break
							}
						}
					}
					return (n || h( a, o ))( f, b, !p, e, aa.test( a ) && pa( b.parentNode ) || b ), e
				}, c.sortStable = u.split( "" ).sort( B ).join( "" ) === u, c.detectDuplicates = !!l, m(), c.sortDetached = ja(
					function ( a ) {
						return 1 & a.compareDocumentPosition( n.createElement( "div" ) )
					}
				), ja(
					function ( a ) {
						return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute( "href" )
					}
				) || ka(
					"type|href|height|width", function ( a, b, c ) {
						return c ? void 0 : a.getAttribute( b, "type" === b.toLowerCase() ? 1 : 2 )
					}
				), c.attributes && ja(
					function ( a ) {
						return a.innerHTML = "<input/>", a.firstChild.setAttribute( "value", "" ), "" === a.firstChild.getAttribute( "value" )
					}
				) || ka(
					"value", function ( a, b, c ) {
						return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue
					}
				), ja(
					function ( a ) {
						return null == a.getAttribute( "disabled" )
					}
				) || ka(
					K, function ( a, b, c ) {
						var d;
						return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode( b )) && d.specified ? d.value : null
					}
				), ga
			}( a );
			n.find = t, n.expr = t.selectors, n.expr[":"] = n.expr.pseudos, n.unique = t.uniqueSort, n.text = t.getText, n.isXMLDoc = t.isXML, n.contains = t.contains;
			var u = n.expr.match.needsContext, v = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, w = /^.[^:#\[\.,]*$/;

			function x( a, b, c ) {
				if ( n.isFunction( b ) )return n.grep(
					a, function ( a, d ) {
						return !!b.call( a, d, a ) !== c
					}
				);
				if ( b.nodeType )return n.grep(
					a, function ( a ) {
						return a === b !== c
					}
				);
				if ( "string" == typeof b ) {
					if ( w.test( b ) )return n.filter( b, a, c );
					b = n.filter( b, a )
				}
				return n.grep(
					a, function ( a ) {
						return g.call( b, a ) >= 0 !== c
					}
				)
			}

			n.filter = function ( a, b, c ) {
				var d = b[0];
				return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? n.find.matchesSelector( d, a ) ? [d] : [] : n.find.matches(
					a, n.grep(
						b, function ( a ) {
							return 1 === a.nodeType
						}
					)
				)
			}, n.fn.extend(
				{
					find     :function ( a ) {
						var b, c = this.length, d = [], e = this;
						if ( "string" != typeof a )return this.pushStack(
							n( a ).filter(
								function () {
									for ( b = 0 ; c > b ; b++ )if ( n.contains( e[b], this ) )return !0
								}
							)
						);
						for ( b = 0 ; c > b ; b++ )n.find( a, e[b], d );
						return d = this.pushStack( c > 1 ? n.unique( d ) : d ), d.selector = this.selector ? this.selector + " " + a : a, d
					}, filter:function ( a ) {
					return this.pushStack( x( this, a || [], !1 ) )
				}, not       :function ( a ) {
					return this.pushStack( x( this, a || [], !0 ) )
				}, is        :function ( a ) {
					return !!x( this, "string" == typeof a && u.test( a ) ? n( a ) : a || [], !1 ).length
				}
				}
			);
			var y, z = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, A = n.fn.init = function ( a, b ) {
				var c, d;
				if ( !a )return this;
				if ( "string" == typeof a ) {
					if ( c = "<" === a[0] && ">" === a[a.length - 1] && a.length >= 3 ? [null, a, null] : z.exec( a ), !c || !c[1] && b )return !b || b.jquery ? (b || y).find( a ) : this.constructor( b ).find( a );
					if ( c[1] ) {
						if ( b = b instanceof n ? b[0] : b, n.merge( this, n.parseHTML( c[1], b && b.nodeType ? b.ownerDocument || b : l, !0 ) ), v.test( c[1] ) && n.isPlainObject( b ) )for ( c in b )n.isFunction( this[c] ) ? this[c]( b[c] ) : this.attr( c, b[c] );
						return this
					}
					return d = l.getElementById( c[2] ), d && d.parentNode && (this.length = 1, this[0] = d), this.context = l, this.selector = a, this
				}
				return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : n.isFunction( a ) ? "undefined" != typeof y.ready ? y.ready( a ) : a( n ) : (void 0 !== a.selector && (this.selector = a.selector, this.context = a.context), n.makeArray( a, this ))
			};
			A.prototype = n.fn, y = n( l );
			var B = /^(?:parents|prev(?:Until|All))/, C = { children:!0, contents:!0, next:!0, prev:!0 };
			n.extend(
				{
					dir       :function ( a, b, c ) {
						var d = [], e = void 0 !== c;
						while ( (a = a[b]) && 9 !== a.nodeType )if ( 1 === a.nodeType ) {
							if ( e && n( a ).is( c ) )break;
							d.push( a )
						}
						return d
					}, sibling:function ( a, b ) {
					for ( var c = [] ; a ; a = a.nextSibling )1 === a.nodeType && a !== b && c.push( a );
					return c
				}
				}
			), n.fn.extend(
				{
					has       :function ( a ) {
						var b = n( a, this ), c = b.length;
						return this.filter(
							function () {
								for ( var a = 0 ; c > a ; a++ )if ( n.contains( this, b[a] ) )return !0
							}
						)
					}, closest:function ( a, b ) {
					for ( var c, d = 0, e = this.length, f = [], g = u.test( a ) || "string" != typeof a ? n( a, b || this.context ) : 0 ; e > d ; d++ )for ( c = this[d] ; c && c !== b ; c = c.parentNode )if ( c.nodeType < 11 && (g ? g.index( c ) > -1 : 1 === c.nodeType && n.find.matchesSelector( c, a )) ) {
						f.push( c );
						break
					}
					return this.pushStack( f.length > 1 ? n.unique( f ) : f )
				}, index      :function ( a ) {
					return a ? "string" == typeof a ? g.call( n( a ), this[0] ) : g.call( this, a.jquery ? a[0] : a ) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1
				}, add        :function ( a, b ) {
					return this.pushStack( n.unique( n.merge( this.get(), n( a, b ) ) ) )
				}, addBack    :function ( a ) {
					return this.add( null == a ? this.prevObject : this.prevObject.filter( a ) )
				}
				}
			);
			function D( a, b ) {
				while ( (a = a[b]) && 1 !== a.nodeType );
				return a
			}

			n.each(
				{
					parent     :function ( a ) {
						var b = a.parentNode;
						return b && 11 !== b.nodeType ? b : null
					}, parents :function ( a ) {
					return n.dir( a, "parentNode" )
				}, parentsUntil:function ( a, b, c ) {
					return n.dir( a, "parentNode", c )
				}, next        :function ( a ) {
					return D( a, "nextSibling" )
				}, prev        :function ( a ) {
					return D( a, "previousSibling" )
				}, nextAll     :function ( a ) {
					return n.dir( a, "nextSibling" )
				}, prevAll     :function ( a ) {
					return n.dir( a, "previousSibling" )
				}, nextUntil   :function ( a, b, c ) {
					return n.dir( a, "nextSibling", c )
				}, prevUntil   :function ( a, b, c ) {
					return n.dir( a, "previousSibling", c )
				}, siblings    :function ( a ) {
					return n.sibling( (a.parentNode || {}).firstChild, a )
				}, children    :function ( a ) {
					return n.sibling( a.firstChild )
				}, contents    :function ( a ) {
					return a.contentDocument || n.merge( [], a.childNodes )
				}
				}, function ( a, b ) {
					n.fn[a] = function ( c, d ) {
						var e = n.map( this, b, c );
						return "Until" !== a.slice( -5 ) && (d = c), d && "string" == typeof d && (e = n.filter( d, e )), this.length > 1 && (C[a] || n.unique( e ), B.test( a ) && e.reverse()), this.pushStack( e )
					}
				}
			);
			var E = /\S+/g, F = {};

			function G( a ) {
				var b = F[a] = {};
				return n.each(
					a.match( E ) || [], function ( a, c ) {
						b[c] = !0
					}
				), b
			}

			n.Callbacks = function ( a ) {
				a                                                  = "string" == typeof a ? F[a] || G( a ) : n.extend( {}, a );
				var b, c, d, e, f, g, h = [], i = !a.once && [], j = function ( l ) {
					for ( b = a.memory && l, c = !0, g = e || 0, e = 0, f = h.length, d = !0 ; h && f > g ; g++ )if ( h[g].apply( l[0], l[1] ) === !1 && a.stopOnFalse ) {
						b = !1;
						break
					}
					d = !1, h && (i ? i.length && j( i.shift() ) : b ? h = [] : k.disable())
				}, k                                               = {
					add        :function () {
						if ( h ) {
							var c = h.length;
							!function g( b ) {
								n.each(
									b, function ( b, c ) {
										var d = n.type( c );
										"function" === d ? a.unique && k.has( c ) || h.push( c ) : c && c.length && "string" !== d && g( c )
									}
								)
							}( arguments ), d ? f = h.length : b && (e = c, j( b ))
						}
						return this
					}, remove  :function () {
						return h && n.each(
							arguments, function ( a, b ) {
								var c;
								while ( (c = n.inArray( b, h, c )) > -1 )h.splice( c, 1 ), d && (f >= c && f--, g >= c && g--)
							}
						), this
					}, has     :function ( a ) {
						return a ? n.inArray( a, h ) > -1 : !(!h || !h.length)
					}, empty   :function () {
						return h = [], f = 0, this
					}, disable :function () {
						return h = i = b = void 0, this
					}, disabled:function () {
						return !h
					}, lock    :function () {
						return i = void 0, b || k.disable(), this
					}, locked  :function () {
						return !i
					}, fireWith:function ( a, b ) {
						return !h || c && !i || (b = b || [], b = [a, b.slice ? b.slice() : b], d ? i.push( b ) : j( b )), this
					}, fire    :function () {
						return k.fireWith( this, arguments ), this
					}, fired   :function () {
						return !!c
					}
				};
				return k
			}, n.extend(
				{
					Deferred:function ( a ) {
						var b = [["resolve", "done", n.Callbacks( "once memory" ), "resolved"], ["reject", "fail", n.Callbacks( "once memory" ), "rejected"], ["notify", "progress", n.Callbacks( "memory" )]], c = "pending", d = {
							state     :function () {
								return c
							}, always :function () {
								return e.done( arguments ).fail( arguments ), this
							}, then   :function () {
								var a = arguments;
								return n.Deferred(
									function ( c ) {
										n.each(
											b, function ( b, f ) {
												var g = n.isFunction( a[b] ) && a[b];
												e[f[1]](
													function () {
														var a = g && g.apply( this, arguments );
														a && n.isFunction( a.promise ) ? a.promise().done( c.resolve ).fail( c.reject ).progress( c.notify ) : c[f[0] + "With"]( this === d ? c.promise() : this, g ? [a] : arguments )
													}
												)
											}
										), a = null
									}
								).promise()
							}, promise:function ( a ) {
								return null != a ? n.extend( a, d ) : d
							}
						}, e                                                                                                                                                                                                     = {};
						return d.pipe = d.then, n.each(
							b, function ( a, f ) {
								var g = f[2], h = f[3];
								d[f[1]] = g.add, h && g.add(
									function () {
										c = h
									}, b[1 ^ a][2].disable, b[2][2].lock
								), e[f[0]] = function () {
									return e[f[0] + "With"]( this === e ? d : this, arguments ), this
								}, e[f[0] + "With"] = g.fireWith
							}
						), d.promise( e ), a && a.call( e, e ), e
					}, when :function ( a ) {
					var b = 0, c = d.call( arguments ), e = c.length, f = 1 !== e || a && n.isFunction( a.promise ) ? e : 0, g = 1 === f ? a : n.Deferred(), h = function ( a, b, c ) {
						return function ( e ) {
							b[a] = this, c[a] = arguments.length > 1 ? d.call( arguments ) : e, c === i ? g.notifyWith( b, c ) : --f || g.resolveWith( b, c )
						}
					}, i, j, k;
					if ( e > 1 )for ( i = new Array( e ), j = new Array( e ), k = new Array( e ) ; e > b ; b++ )c[b] && n.isFunction( c[b].promise ) ? c[b].promise().done( h( b, k, c ) ).fail( g.reject ).progress( h( b, j, i ) ) : --f;
					return f || g.resolveWith( k, c ), g.promise()
				}
				}
			);
			var H;
			n.fn.ready = function ( a ) {
				return n.ready.promise().done( a ), this
			}, n.extend(
				{
					isReady:!1, readyWait:1, holdReady:function ( a ) {
					a ? n.readyWait++ : n.ready( !0 )
				}, ready                              :function ( a ) {
					(a === !0 ? --n.readyWait : n.isReady) || (n.isReady = !0, a !== !0 && --n.readyWait > 0 || (H.resolveWith( l, [n] ), n.fn.triggerHandler && (n( l ).triggerHandler( "ready" ), n( l ).off( "ready" ))))
				}
				}
			);
			function I() {
				l.removeEventListener( "DOMContentLoaded", I, !1 ), a.removeEventListener( "load", I, !1 ), n.ready()
			}

			n.ready.promise = function ( b ) {
				return H || (H = n.Deferred(), "complete" === l.readyState ? setTimeout( n.ready ) : (l.addEventListener( "DOMContentLoaded", I, !1 ), a.addEventListener( "load", I, !1 ))), H.promise( b )
			}, n.ready.promise();
			var J = n.access = function ( a, b, c, d, e, f, g ) {
				var h = 0, i = a.length, j = null == c;
				if ( "object" === n.type( c ) ) {
					e = !0;
					for ( h in c )n.access( a, b, h, c[h], !0, f, g )
				}
				else if ( void 0 !== d && (e = !0, n.isFunction( d ) || (g = !0), j && (g ? (b.call( a, d ), b = null) : (j = b, b = function ( a, b, c ) {
						return j.call( n( a ), c )
					})), b) )for ( ; i > h ; h++ )b( a[h], c, g ? d : d.call( a[h], h, b( a[h], c ) ) );
				return e ? a : j ? b.call( a ) : i ? b( a[0], c ) : f
			};
			n.acceptData = function ( a ) {
				return 1 === a.nodeType || 9 === a.nodeType || !+a.nodeType
			};
			function K() {
				Object.defineProperty(
					this.cache = {}, 0, {
						get:function () {
							return {}
						}
					}
				), this.expando = n.expando + K.uid++
			}

			K.uid = 1, K.accepts = n.acceptData, K.prototype = {
				key       :function ( a ) {
					if ( !K.accepts( a ) )return 0;
					var b = {}, c = a[this.expando];
					if ( !c ) {
						c = K.uid++;
						try {
							b[this.expando] = { value:c }, Object.defineProperties( a, b )
						}
						catch ( d ) {
							b[this.expando] = c, n.extend( a, b )
						}
					}
					return this.cache[c] || (this.cache[c] = {}), c
				}, set    :function ( a, b, c ) {
					var d, e = this.key( a ), f = this.cache[e];
					if ( "string" == typeof b )f[b] = c;
					else if ( n.isEmptyObject( f ) )n.extend( this.cache[e], b );
					else for ( d in b )f[d] = b[d];
					return f
				}, get    :function ( a, b ) {
					var c = this.cache[this.key( a )];
					return void 0 === b ? c : c[b]
				}, access :function ( a, b, c ) {
					var d;
					return void 0 === b || b && "string" == typeof b && void 0 === c ? (d = this.get( a, b ), void 0 !== d ? d : this.get( a, n.camelCase( b ) )) : (this.set( a, b, c ), void 0 !== c ? c : b)
				}, remove :function ( a, b ) {
					var c, d, e, f = this.key( a ), g = this.cache[f];
					if ( void 0 === b )this.cache[f] = {};
					else {
						n.isArray( b ) ? d = b.concat( b.map( n.camelCase ) ) : (e = n.camelCase( b ), b in g ? d = [b, e] : (d = e, d = d in g ? [d] : d.match( E ) || [])), c = d.length;
						while ( c-- )delete g[d[c]]
					}
				}, hasData:function ( a ) {
					return !n.isEmptyObject( this.cache[a[this.expando]] || {} )
				}, discard:function ( a ) {
					a[this.expando] && delete this.cache[a[this.expando]]
				}
			};
			var L = new K, M = new K, N = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, O = /([A-Z])/g;

			function P( a, b, c ) {
				var d;
				if ( void 0 === c && 1 === a.nodeType )if ( d = "data-" + b.replace( O, "-$1" ).toLowerCase(), c = a.getAttribute( d ), "string" == typeof c ) {
					try {
						c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : N.test( c ) ? n.parseJSON( c ) : c
					}
					catch ( e ) {
					}
					M.set( a, b, c )
				}
				else c = void 0;
				return c
			}

			n.extend(
				{
					hasData   :function ( a ) {
						return M.hasData( a ) || L.hasData( a )
					}, data   :function ( a, b, c ) {
					return M.access( a, b, c )
				}, removeData :function ( a, b ) {
					M.remove( a, b )
				}, _data      :function ( a, b, c ) {
					return L.access( a, b, c )
				}, _removeData:function ( a, b ) {
					L.remove( a, b )
				}
				}
			), n.fn.extend(
				{
					data         :function ( a, b ) {
						var c, d, e, f = this[0], g = f && f.attributes;
						if ( void 0 === a ) {
							if ( this.length && (e = M.get( f ), 1 === f.nodeType && !L.get( f, "hasDataAttrs" )) ) {
								c = g.length;
								while ( c-- )g[c] && (d = g[c].name, 0 === d.indexOf( "data-" ) && (d = n.camelCase( d.slice( 5 ) ), P( f, d, e[d] )));
								L.set( f, "hasDataAttrs", !0 )
							}
							return e
						}
						return "object" == typeof a ? this.each(
							function () {
								M.set( this, a )
							}
						) : J(
							this, function ( b ) {
								var c, d = n.camelCase( a );
								if ( f && void 0 === b ) {
									if ( c = M.get( f, a ), void 0 !== c )return c;
									if ( c = M.get( f, d ), void 0 !== c )return c;
									if ( c = P( f, d, void 0 ), void 0 !== c )return c
								}
								else this.each(
									function () {
										var c = M.get( this, d );
										M.set( this, d, b ), -1 !== a.indexOf( "-" ) && void 0 !== c && M.set( this, a, b )
									}
								)
							}, null, b, arguments.length > 1, null, !0
						)
					}, removeData:function ( a ) {
					return this.each(
						function () {
							M.remove( this, a )
						}
					)
				}
				}
			), n.extend(
				{
					queue     :function ( a, b, c ) {
						var d;
						return a ? (b = (b || "fx") + "queue", d = L.get( a, b ), c && (!d || n.isArray( c ) ? d = L.access( a, b, n.makeArray( c ) ) : d.push( c )), d || []) : void 0
					}, dequeue:function ( a, b ) {
					b                                                                                  = b || "fx";
					var c = n.queue( a, b ), d = c.length, e = c.shift(), f = n._queueHooks( a, b ), g = function () {
						n.dequeue( a, b )
					};
					"inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift( "inprogress" ), delete f.stop, e.call( a, g, f )), !d && f && f.empty.fire()
				}, _queueHooks:function ( a, b ) {
					var c = b + "queueHooks";
					return L.get( a, c ) || L.access(
							a, c, {
								empty:n.Callbacks( "once memory" ).add(
									function () {
										L.remove( a, [b + "queue", c] )
									}
								)
							}
						)
				}
				}
			), n.fn.extend(
				{
					queue     :function ( a, b ) {
						var c = 2;
						return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? n.queue( this[0], a ) : void 0 === b ? this : this.each(
							function () {
								var c = n.queue( this, a, b );
								n._queueHooks( this, a ), "fx" === a && "inprogress" !== c[0] && n.dequeue( this, a )
							}
						)
					}, dequeue:function ( a ) {
					return this.each(
						function () {
							n.dequeue( this, a )
						}
					)
				}, clearQueue :function ( a ) {
					return this.queue( a || "fx", [] )
				}, promise    :function ( a, b ) {
					var c, d = 1, e = n.Deferred(), f = this, g = this.length, h = function () {
						--d || e.resolveWith( f, [f] )
					};
					"string" != typeof a && (b = a, a = void 0), a = a || "fx";
					while ( g-- )c = L.get( f[g], a + "queueHooks" ), c && c.empty && (d++, c.empty.add( h ));
					return h(), e.promise( b )
				}
				}
			);
			var Q = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, R = ["Top", "Right", "Bottom", "Left"], S = function ( a, b ) {
				return a = b || a, "none" === n.css( a, "display" ) || !n.contains( a.ownerDocument, a )
			}, T                                                                                            = /^(?:checkbox|radio)$/i;
			!function () {
				var a = l.createDocumentFragment(), b = a.appendChild( l.createElement( "div" ) ), c = l.createElement( "input" );
				c.setAttribute( "type", "radio" ), c.setAttribute( "checked", "checked" ), c.setAttribute( "name", "t" ), b.appendChild( c ), k.checkClone = b.cloneNode( !0 ).cloneNode( !0 ).lastChild.checked, b.innerHTML = "<textarea>x</textarea>", k.noCloneChecked = !!b.cloneNode( !0 ).lastChild.defaultValue
			}();
			var U                                                                                                = "undefined";
			k.focusinBubbles                                                                                     = "onfocusin" in a;
			var V = /^key/, W = /^(?:mouse|pointer|contextmenu)|click/, X = /^(?:focusinfocus|focusoutblur)$/, Y = /^([^.]*)(?:\.(.+)|)$/;

			function Z() {
				return !0
			}

			function $() {
				return !1
			}

			function _() {
				try {
					return l.activeElement
				}
				catch ( a ) {
				}
			}

			n.event = {
				global                                                                                                                                                              :{}, add:function ( a, b, c, d, e ) {
					var f, g, h, i, j, k, l, m, o, p, q, r = L.get( a );
					if ( r ) {
						c.handler && (f = c, c = f.handler, e = f.selector), c.guid || (c.guid = n.guid++), (i = r.events) || (i = r.events = {}), (g = r.handle) || (g = r.handle = function ( b ) {
							return typeof n !== U && n.event.triggered !== b.type ? n.event.dispatch.apply( a, arguments ) : void 0
						}), b = (b || "").match( E ) || [""], j = b.length;
						while ( j-- )h = Y.exec( b[j] ) || [], o = q = h[1], p = (h[2] || "").split( "." )
																							 .sort(), o && (l = n.event.special[o] || {}, o = (e ? l.delegateType : l.bindType) || o, l = n.event.special[o] || {}, k = n.extend( { type:o, origType:q, data:d, handler:c, guid:c.guid, selector:e, needsContext:e && n.expr.match.needsContext.test( e ), namespace:p.join( "." ) }, f ), (m = i[o]) || (m = i[o] = [], m.delegateCount = 0, l.setup && l.setup.call( a, d, p, g ) !== !1 || a.addEventListener && a.addEventListener( o, g, !1 )), l.add && (l.add.call( a, k ), k.handler.guid || (k.handler.guid = c.guid)), e ? m.splice( m.delegateCount++, 0, k ) : m.push( k ), n.event.global[o] = !0)
					}
				}, remove                                                                                                                                                           :function ( a, b, c, d, e ) {
					var f, g, h, i, j, k, l, m, o, p, q, r = L.hasData( a ) && L.get( a );
					if ( r && (i = r.events) ) {
						b = (b || "").match( E ) || [""], j = b.length;
						while ( j-- )if ( h = Y.exec( b[j] ) || [], o = q = h[1], p = (h[2] || "").split( "." ).sort(), o ) {
							l = n.event.special[o] || {}, o = (d ? l.delegateType : l.bindType) || o, m = i[o] || [], h = h[2] && new RegExp( "(^|\\.)" + p.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ), g = f = m.length;
							while ( f-- )k = m[f], !e && q !== k.origType || c && c.guid !== k.guid || h && !h.test( k.namespace ) || d && d !== k.selector && ("**" !== d || !k.selector) || (m.splice( f, 1 ), k.selector && m.delegateCount--, l.remove && l.remove.call( a, k ));
							g && !m.length && (l.teardown && l.teardown.call( a, p, r.handle ) !== !1 || n.removeEvent( a, o, r.handle ), delete i[o])
						}
						else for ( o in i )n.event.remove( a, o + b[j], c, d, !0 );
						n.isEmptyObject( i ) && (delete r.handle, L.remove( a, "events" ))
					}
				}, trigger                                                                                                                                                          :function ( b, c, d, e ) {
					var f, g, h, i, k, m, o, p = [d || l], q = j.call( b, "type" ) ? b.type : b, r = j.call( b, "namespace" ) ? b.namespace.split( "." ) : [];
					if ( g = h = d = d || l, 3 !== d.nodeType && 8 !== d.nodeType && !X.test( q + n.event.triggered ) && (q.indexOf( "." ) >= 0 && (r = q.split( "." ), q = r.shift(), r.sort()), k = q.indexOf( ":" ) < 0 && "on" + q, b = b[n.expando] ? b : new n.Event( q, "object" == typeof b && b ), b.isTrigger = e ? 2 : 3, b.namespace = r.join( "." ), b.namespace_re = b.namespace ? new RegExp( "(^|\\.)" + r.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) : null, b.result = void 0, b.target || (b.target = d), c = null == c ? [b] : n.makeArray( c, [b] ), o = n.event.special[q] || {}, e || !o.trigger || o.trigger.apply( d, c ) !== !1) ) {
						if ( !e && !o.noBubble && !n.isWindow( d ) ) {
							for ( i = o.delegateType || q, X.test( i + q ) || (g = g.parentNode) ; g ; g = g.parentNode )p.push( g ), h = g;
							h === (d.ownerDocument || l) && p.push( h.defaultView || h.parentWindow || a )
						}
						f = 0;
						while ( (g = p[f++]) && !b.isPropagationStopped() )b.type = f > 1 ? i : o.bindType || q, m = (L.get( g, "events" ) || {})[b.type] && L.get( g, "handle" ), m && m.apply( g, c ), m = k && g[k], m && m.apply && n.acceptData( g ) && (b.result = m.apply( g, c ), b.result === !1 && b.preventDefault());
						return b.type = q, e || b.isDefaultPrevented() || o._default && o._default.apply( p.pop(), c ) !== !1 || !n.acceptData( d ) || k && n.isFunction( d[q] ) && !n.isWindow( d ) && (h = d[k], h && (d[k] = null), n.event.triggered = q, d[q](), n.event.triggered = void 0, h && (d[k] = h)), b.result
					}
				}, dispatch                                                                                                                                                         :function ( a ) {
					a                                                                                                        = n.event.fix( a );
					var b, c, e, f, g, h = [], i = d.call( arguments ), j = (L.get( this, "events" ) || {})[a.type] || [], k = n.event.special[a.type] || {};
					if ( i[0] = a, a.delegateTarget = this, !k.preDispatch || k.preDispatch.call( this, a ) !== !1 ) {
						h = n.event.handlers.call( this, a, j ), b = 0;
						while ( (f = h[b++]) && !a.isPropagationStopped() ) {
							a.currentTarget = f.elem, c = 0;
							while ( (g = f.handlers[c++]) && !a.isImmediatePropagationStopped() )(!a.namespace_re || a.namespace_re.test( g.namespace )) && (a.handleObj = g, a.data = g.data, e = ((n.event.special[g.origType] || {}).handle || g.handler).apply( f.elem, i ), void 0 !== e && (a.result = e) === !1 && (a.preventDefault(), a.stopPropagation()))
						}
						return k.postDispatch && k.postDispatch.call( this, a ), a.result
					}
				}, handlers                                                                                                                                                         :function ( a, b ) {
					var c, d, e, f, g = [], h = b.delegateCount, i = a.target;
					if ( h && i.nodeType && (!a.button || "click" !== a.type) )for ( ; i !== this ; i = i.parentNode || this )if ( i.disabled !== !0 || "click" !== a.type ) {
						for ( d = [], c = 0 ; h > c ; c++ )f = b[c], e = f.selector + " ", void 0 === d[e] && (d[e] = f.needsContext ? n( e, this ).index( i ) >= 0 : n.find( e, this, null, [i] ).length), d[e] && d.push( f );
						d.length && g.push( { elem:i, handlers:d } )
					}
					return h < b.length && g.push( { elem:this, handlers:b.slice( h ) } ), g
				}, props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split( " " ), fixHooks:{}, keyHooks:{
					props:"char charCode key keyCode".split( " " ), filter:function ( a, b ) {
						return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a
					}
				}, mouseHooks                                                                                                                                                       :{
					props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split( " " ), filter:function ( a, b ) {
						var c, d, e, f = b.button;
						return null == a.pageX && null != b.clientX && (c = a.target.ownerDocument || l, d = c.documentElement, e = c.body, a.pageX = b.clientX + (d && d.scrollLeft || e && e.scrollLeft || 0) - (d && d.clientLeft || e && e.clientLeft || 0), a.pageY = b.clientY + (d && d.scrollTop || e && e.scrollTop || 0) - (d && d.clientTop || e && e.clientTop || 0)), a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0), a
					}
				}, fix                                                                                                                                                              :function ( a ) {
					if ( a[n.expando] )return a;
					var b, c, d, e = a.type, f = a, g = this.fixHooks[e];
					g || (this.fixHooks[e] = g = W.test( e ) ? this.mouseHooks : V.test( e ) ? this.keyHooks : {}), d = g.props ? this.props.concat( g.props ) : this.props, a = new n.Event( f ), b = d.length;
					while ( b-- )c = d[b], a[c] = f[c];
					return a.target || (a.target = l), 3 === a.target.nodeType && (a.target = a.target.parentNode), g.filter ? g.filter( a, f ) : a
				}, special                                                                                                                                                          :{
					load:{ noBubble:!0 }, focus:{
						trigger        :function () {
							return this !== _() && this.focus ? (this.focus(), !1) : void 0
						}, delegateType:"focusin"
					}, blur                    :{
						trigger        :function () {
							return this === _() && this.blur ? (this.blur(), !1) : void 0
						}, delegateType:"focusout"
					}, click                   :{
						trigger    :function () {
							return "checkbox" === this.type && this.click && n.nodeName( this, "input" ) ? (this.click(), !1) : void 0
						}, _default:function ( a ) {
							return n.nodeName( a.target, "a" )
						}
					}, beforeunload            :{
						postDispatch:function ( a ) {
							void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result)
						}
					}
				}, simulate                                                                                                                                                         :function ( a, b, c, d ) {
					var e = n.extend( new n.Event, c, { type:a, isSimulated:!0, originalEvent:{} } );
					d ? n.event.trigger( e, null, b ) : n.event.dispatch.call( b, e ), e.isDefaultPrevented() && c.preventDefault()
				}
			}, n.removeEvent = function ( a, b, c ) {
				a.removeEventListener && a.removeEventListener( b, c, !1 )
			}, n.Event = function ( a, b ) {
				return this instanceof n.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && a.returnValue === !1 ? Z : $) : this.type = a, b && n.extend( this, b ), this.timeStamp = a && a.timeStamp || n.now(), void(this[n.expando] = !0)) : new n.Event( a, b )
			}, n.Event.prototype = {
				isDefaultPrevented:$, isPropagationStopped:$, isImmediatePropagationStopped:$, preventDefault:function () {
					var a = this.originalEvent;
					this.isDefaultPrevented = Z, a && a.preventDefault && a.preventDefault()
				}, stopPropagation                                                                           :function () {
					var a = this.originalEvent;
					this.isPropagationStopped = Z, a && a.stopPropagation && a.stopPropagation()
				}, stopImmediatePropagation                                                                  :function () {
					var a = this.originalEvent;
					this.isImmediatePropagationStopped = Z, a && a.stopImmediatePropagation && a.stopImmediatePropagation(), this.stopPropagation()
				}
			}, n.each(
				{ mouseenter:"mouseover", mouseleave:"mouseout", pointerenter:"pointerover", pointerleave:"pointerout" }, function ( a, b ) {
					n.event.special[a] = {
						delegateType:b, bindType:b, handle:function ( a ) {
							var c, d = this, e = a.relatedTarget, f = a.handleObj;
							return (!e || e !== d && !n.contains( d, e )) && (a.type = f.origType, c = f.handler.apply( this, arguments ), a.type = b), c
						}
					}
				}
			), k.focusinBubbles || n.each(
				{ focus:"focusin", blur:"focusout" }, function ( a, b ) {
					var c              = function ( a ) {
						n.event.simulate( b, a.target, n.event.fix( a ), !0 )
					};
					n.event.special[b] = {
						setup      :function () {
							var d = this.ownerDocument || this, e = L.access( d, b );
							e || d.addEventListener( a, c, !0 ), L.access( d, b, (e || 0) + 1 )
						}, teardown:function () {
							var d = this.ownerDocument || this, e = L.access( d, b ) - 1;
							e ? L.access( d, b, e ) : (d.removeEventListener( a, c, !0 ), L.remove( d, b ))
						}
					}
				}
			), n.fn.extend(
				{
					on           :function ( a, b, c, d, e ) {
						var f, g;
						if ( "object" == typeof a ) {
							"string" != typeof b && (c = c || b, b = void 0);
							for ( g in a )this.on( g, b, c, a[g], e );
							return this
						}
						if ( null == c && null == d ? (d = b, c = b = void 0) : null == d && ("string" == typeof b ? (d = c, c = void 0) : (d = c, c = b, b = void 0)), d === !1 )d = $;
						else if ( !d )return this;
						return 1 === e && (f = d, d = function ( a ) {
							return n().off( a ), f.apply( this, arguments )
						}, d.guid = f.guid || (f.guid = n.guid++)), this.each(
							function () {
								n.event.add( this, a, d, c, b )
							}
						)
					}, one       :function ( a, b, c, d ) {
					return this.on( a, b, c, d, 1 )
				}, off           :function ( a, b, c ) {
					var d, e;
					if ( a && a.preventDefault && a.handleObj )return d = a.handleObj, n( a.delegateTarget ).off( d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler ), this;
					if ( "object" == typeof a ) {
						for ( e in a )this.off( e, b, a[e] );
						return this
					}
					return (b === !1 || "function" == typeof b) && (c = b, b = void 0), c === !1 && (c = $), this.each(
						function () {
							n.event.remove( this, a, c, b )
						}
					)
				}, trigger       :function ( a, b ) {
					return this.each(
						function () {
							n.event.trigger( a, b, this )
						}
					)
				}, triggerHandler:function ( a, b ) {
					var c = this[0];
					return c ? n.event.trigger( a, b, c, !0 ) : void 0
				}
				}
			);
			var aa = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, ba = /<([\w:]+)/, ca = /<|&#?\w+;/, da = /<(?:script|style|link)/i, ea = /checked\s*(?:[^=]|=\s*.checked.)/i, fa = /^$|\/(?:java|ecma)script/i, ga = /^true\/(.*)/, ha = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, ia = {
				option:[1, "<select multiple='multiple'>", "</select>"], thead:[1, "<table>", "</table>"], col:[2, "<table><colgroup>", "</colgroup></table>"], tr:[
					2,
					"<table><tbody>",
					"</tbody></table>"
				], td                                                                                                                                             :[3, "<table><tbody><tr>", "</tr></tbody></table>"], _default:[0, "", ""]
			};
			ia.optgroup = ia.option, ia.tbody = ia.tfoot = ia.colgroup = ia.caption = ia.thead, ia.th = ia.td;
			function ja( a, b ) {
				return n.nodeName( a, "table" ) && n.nodeName( 11 !== b.nodeType ? b : b.firstChild, "tr" ) ? a.getElementsByTagName( "tbody" )[0] || a.appendChild( a.ownerDocument.createElement( "tbody" ) ) : a
			}

			function ka( a ) {
				return a.type = (null !== a.getAttribute( "type" )) + "/" + a.type, a
			}

			function la( a ) {
				var b = ga.exec( a.type );
				return b ? a.type = b[1] : a.removeAttribute( "type" ), a
			}

			function ma( a, b ) {
				for ( var c = 0, d = a.length ; d > c ; c++ )L.set( a[c], "globalEval", !b || L.get( b[c], "globalEval" ) )
			}

			function na( a, b ) {
				var c, d, e, f, g, h, i, j;
				if ( 1 === b.nodeType ) {
					if ( L.hasData( a ) && (f = L.access( a ), g = L.set( b, f ), j = f.events) ) {
						delete g.handle, g.events = {};
						for ( e in j )for ( c = 0, d = j[e].length ; d > c ; c++ )n.event.add( b, e, j[e][c] )
					}
					M.hasData( a ) && (h = M.access( a ), i = n.extend( {}, h ), M.set( b, i ))
				}
			}

			function oa( a, b ) {
				var c = a.getElementsByTagName ? a.getElementsByTagName( b || "*" ) : a.querySelectorAll ? a.querySelectorAll( b || "*" ) : [];
				return void 0 === b || b && n.nodeName( a, b ) ? n.merge( [a], c ) : c
			}

			function pa( a, b ) {
				var c = b.nodeName.toLowerCase();
				"input" === c && T.test( a.type ) ? b.checked = a.checked : ("input" === c || "textarea" === c) && (b.defaultValue = a.defaultValue)
			}

			n.extend(
				{
					clone           :function ( a, b, c ) {
						var d, e, f, g, h = a.cloneNode( !0 ), i = n.contains( a.ownerDocument, a );
						if ( !(k.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || n.isXMLDoc( a )) )for ( g = oa( h ), f = oa( a ), d = 0, e = f.length ; e > d ; d++ )pa( f[d], g[d] );
						if ( b )if ( c )for ( f = f || oa( a ), g = g || oa( h ), d = 0, e = f.length ; e > d ; d++ )na( f[d], g[d] );
						else na( a, h );
						return g = oa( h, "script" ), g.length > 0 && ma( g, !i && oa( a, "script" ) ), h
					}, buildFragment:function ( a, b, c, d ) {
					for ( var e, f, g, h, i, j, k = b.createDocumentFragment(), l = [], m = 0, o = a.length ; o > m ; m++ )if ( e = a[m], e || 0 === e )if ( "object" === n.type( e ) )n.merge( l, e.nodeType ? [e] : e );
					else if ( ca.test( e ) ) {
						f = f || k.appendChild( b.createElement( "div" ) ), g = (ba.exec( e ) || ["", ""])[1].toLowerCase(), h = ia[g] || ia._default, f.innerHTML = h[1] + e.replace( aa, "<$1></$2>" ) + h[2], j = h[0];
						while ( j-- )f = f.lastChild;
						n.merge( l, f.childNodes ), f = k.firstChild, f.textContent = ""
					}
					else l.push( b.createTextNode( e ) );
					k.textContent = "", m = 0;
					while ( e = l[m++] )if ( (!d || -1 === n.inArray( e, d )) && (i = n.contains( e.ownerDocument, e ), f = oa( k.appendChild( e ), "script" ), i && ma( f ), c) ) {
						j = 0;
						while ( e = f[j++] )fa.test( e.type || "" ) && c.push( e )
					}
					return k
				}, cleanData        :function ( a ) {
					for ( var b, c, d, e, f = n.event.special, g = 0 ; void 0 !== (c = a[g]) ; g++ ) {
						if ( n.acceptData( c ) && (e = c[L.expando], e && (b = L.cache[e])) ) {
							if ( b.events )for ( d in b.events )f[d] ? n.event.remove( c, d ) : n.removeEvent( c, d, b.handle );
							L.cache[e] && delete L.cache[e]
						}
						delete M.cache[c[M.expando]]
					}
				}
				}
			), n.fn.extend(
				{
					text      :function ( a ) {
						return J(
							this, function ( a ) {
								return void 0 === a ? n.text( this ) : this.empty().each(
									function () {
										(1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) && (this.textContent = a)
									}
								)
							}, null, a, arguments.length
						)
					}, append :function () {
					return this.domManip(
						arguments, function ( a ) {
							if ( 1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType ) {
								var b = ja( this, a );
								b.appendChild( a )
							}
						}
					)
				}, prepend    :function () {
					return this.domManip(
						arguments, function ( a ) {
							if ( 1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType ) {
								var b = ja( this, a );
								b.insertBefore( a, b.firstChild )
							}
						}
					)
				}, before     :function () {
					return this.domManip(
						arguments, function ( a ) {
							this.parentNode && this.parentNode.insertBefore( a, this )
						}
					)
				}, after      :function () {
					return this.domManip(
						arguments, function ( a ) {
							this.parentNode && this.parentNode.insertBefore( a, this.nextSibling )
						}
					)
				}, remove     :function ( a, b ) {
					for ( var c, d = a ? n.filter( a, this ) : this, e = 0 ; null != (c = d[e]) ; e++ )b || 1 !== c.nodeType || n.cleanData( oa( c ) ), c.parentNode && (b && n.contains( c.ownerDocument, c ) && ma( oa( c, "script" ) ), c.parentNode.removeChild( c ));
					return this
				}, empty      :function () {
					for ( var a, b = 0 ; null != (a = this[b]) ; b++ )1 === a.nodeType && (n.cleanData( oa( a, !1 ) ), a.textContent = "");
					return this
				}, clone      :function ( a, b ) {
					return a = null == a ? !1 : a, b = null == b ? a : b, this.map(
						function () {
							return n.clone( this, a, b )
						}
					)
				}, html       :function ( a ) {
					return J(
						this, function ( a ) {
							var b = this[0] || {}, c = 0, d = this.length;
							if ( void 0 === a && 1 === b.nodeType )return b.innerHTML;
							if ( "string" == typeof a && !da.test( a ) && !ia[(ba.exec( a ) || ["", ""])[1].toLowerCase()] ) {
								a = a.replace( aa, "<$1></$2>" );
								try {
									for ( ; d > c ; c++ )b = this[c] || {}, 1 === b.nodeType && (n.cleanData( oa( b, !1 ) ), b.innerHTML = a);
									b = 0
								}
								catch ( e ) {
								}
							}
							b && this.empty().append( a )
						}, null, a, arguments.length
					)
				}, replaceWith:function () {
					var a = arguments[0];
					return this.domManip(
						arguments, function ( b ) {
							a = this.parentNode, n.cleanData( oa( this ) ), a && a.replaceChild( b, this )
						}
					), a && (a.length || a.nodeType) ? this : this.remove()
				}, detach     :function ( a ) {
					return this.remove( a, !0 )
				}, domManip   :function ( a, b ) {
					a                                                                              = e.apply( [], a );
					var c, d, f, g, h, i, j = 0, l = this.length, m = this, o = l - 1, p = a[0], q = n.isFunction( p );
					if ( q || l > 1 && "string" == typeof p && !k.checkClone && ea.test( p ) )return this.each(
						function ( c ) {
							var d = m.eq( c );
							q && (a[0] = p.call( this, c, d.html() )), d.domManip( a, b )
						}
					);
					if ( l && (c = n.buildFragment( a, this[0].ownerDocument, !1, this ), d = c.firstChild, 1 === c.childNodes.length && (c = d), d) ) {
						for ( f = n.map( oa( c, "script" ), ka ), g = f.length ; l > j ; j++ )h = c, j !== o && (h = n.clone( h, !0, !0 ), g && n.merge( f, oa( h, "script" ) )), b.call( this[j], h, j );
						if ( g )for ( i = f[f.length - 1].ownerDocument, n.map( f, la ), j = 0 ; g > j ; j++ )h = f[j], fa.test( h.type || "" ) && !L.access( h, "globalEval" ) && n.contains( i, h ) && (h.src ? n._evalUrl && n._evalUrl( h.src ) : n.globalEval( h.textContent.replace( ha, "" ) ))
					}
					return this
				}
				}
			), n.each(
				{ appendTo:"append", prependTo:"prepend", insertBefore:"before", insertAfter:"after", replaceAll:"replaceWith" }, function ( a, b ) {
					n.fn[a] = function ( a ) {
						for ( var c, d = [], e = n( a ), g = e.length - 1, h = 0 ; g >= h ; h++ )c = h === g ? this : this.clone( !0 ), n( e[h] )[b]( c ), f.apply( d, c.get() );
						return this.pushStack( d )
					}
				}
			);
			var qa, ra = {};

			function sa( b, c ) {
				var d, e = n( c.createElement( b ) ).appendTo( c.body ), f = a.getDefaultComputedStyle && (d = a.getDefaultComputedStyle( e[0] )) ? d.display : n.css( e[0], "display" );
				return e.detach(), f
			}

			function ta( a ) {
				var b = l, c = ra[a];
				return c || (c = sa( a, b ), "none" !== c && c || (qa = (qa || n( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( b.documentElement ), b = qa[0].contentDocument, b.write(), b.close(), c = sa( a, b ), qa.detach()), ra[a] = c), c
			}

			var ua = /^margin/, va = new RegExp( "^(" + Q + ")(?!px)[a-z%]+$", "i" ), wa = function ( b ) {
				return b.ownerDocument.defaultView.opener ? b.ownerDocument.defaultView.getComputedStyle( b, null ) : a.getComputedStyle( b, null )
			};

			function xa( a, b, c ) {
				var d, e, f, g, h = a.style;
				return c = c || wa( a ), c && (g = c.getPropertyValue( b ) || c[b]), c && ("" !== g || n.contains( a.ownerDocument, a ) || (g = n.style( a, b )), va.test( g ) && ua.test( b ) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 !== g ? g + "" : g
			}

			function ya( a, b ) {
				return {
					get:function () {
						return a() ? void delete this.get : (this.get = b).apply( this, arguments )
					}
				}
			}

			!function () {
				var b, c, d = l.documentElement, e = l.createElement( "div" ), f = l.createElement( "div" );
				if ( f.style ) {
					f.style.backgroundClip = "content-box", f.cloneNode( !0 ).style.backgroundClip = "", k.clearCloneStyle = "content-box" === f.style.backgroundClip, e.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;position:absolute", e.appendChild( f );
					function g() {
						f.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute", f.innerHTML = "", d.appendChild( e );
						var g = a.getComputedStyle( f, null );
						b = "1%" !== g.top, c = "4px" === g.width, d.removeChild( e )
					}

					a.getComputedStyle && n.extend(
						k, {
							pixelPosition         :function () {
								return g(), b
							}, boxSizingReliable  :function () {
								return null == c && g(), c
							}, reliableMarginRight:function () {
								var b, c = f.appendChild( l.createElement( "div" ) );
								return c.style.cssText = f.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0", c.style.marginRight = c.style.width = "0", f.style.width = "1px", d.appendChild( e ), b = !parseFloat( a.getComputedStyle( c, null ).marginRight ), d.removeChild( e ), f.removeChild( c ), b
							}
						}
					)
				}
			}(), n.swap = function ( a, b, c, d ) {
				var e, f, g = {};
				for ( f in b )g[f] = a.style[f], a.style[f] = b[f];
				e = c.apply( a, d || [] );
				for ( f in b )a.style[f] = g[f];
				return e
			};
			var za = /^(none|table(?!-c[ea]).+)/, Aa = new RegExp( "^(" + Q + ")(.*)$", "i" ), Ba = new RegExp( "^([+-])=(" + Q + ")", "i" ), Ca = { position:"absolute", visibility:"hidden", display:"block" }, Da = { letterSpacing:"0", fontWeight:"400" }, Ea = ["Webkit", "O", "Moz", "ms"];

			function Fa( a, b ) {
				if ( b in a )return b;
				var c = b[0].toUpperCase() + b.slice( 1 ), d = b, e = Ea.length;
				while ( e-- )if ( b = Ea[e] + c, b in a )return b;
				return d
			}

			function Ga( a, b, c ) {
				var d = Aa.exec( b );
				return d ? Math.max( 0, d[1] - (c || 0) ) + (d[2] || "px") : b
			}

			function Ha( a, b, c, d, e ) {
				for ( var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0 ; 4 > f ; f += 2 )"margin" === c && (g += n.css( a, c + R[f], !0, e )), d ? ("content" === c && (g -= n.css( a, "padding" + R[f], !0, e )), "margin" !== c && (g -= n.css( a, "border" + R[f] + "Width", !0, e ))) : (g += n.css( a, "padding" + R[f], !0, e ), "padding" !== c && (g += n.css( a, "border" + R[f] + "Width", !0, e )));
				return g
			}

			function Ia( a, b, c ) {
				var d = !0, e = "width" === b ? a.offsetWidth : a.offsetHeight, f = wa( a ), g = "border-box" === n.css( a, "boxSizing", !1, f );
				if ( 0 >= e || null == e ) {
					if ( e = xa( a, b, f ), (0 > e || null == e) && (e = a.style[b]), va.test( e ) )return e;
					d = g && (k.boxSizingReliable() || e === a.style[b]), e = parseFloat( e ) || 0
				}
				return e + Ha( a, b, c || (g ? "border" : "content"), d, f ) + "px"
			}

			function Ja( a, b ) {
				for ( var c, d, e, f = [], g = 0, h = a.length ; h > g ; g++ )d = a[g], d.style && (f[g] = L.get( d, "olddisplay" ), c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && S( d ) && (f[g] = L.access( d, "olddisplay", ta( d.nodeName ) ))) : (e = S( d ), "none" === c && e || L.set( d, "olddisplay", e ? c : n.css( d, "display" ) )));
				for ( g = 0 ; h > g ; g++ )d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none"));
				return a
			}

			n.extend(
				{
					cssHooks                                                                                                                                                                                                          :{
						opacity:{
							get:function ( a, b ) {
								if ( b ) {
									var c = xa( a, "opacity" );
									return "" === c ? "1" : c
								}
							}
						}
					}, cssNumber:{ columnCount:!0, fillOpacity:!0, flexGrow:!0, flexShrink:!0, fontWeight:!0, lineHeight:!0, opacity:!0, order:!0, orphans:!0, widows:!0, zIndex:!0, zoom:!0 }, cssProps:{ "float":"cssFloat" }, style:function ( a, b, c, d ) {
					if ( a && 3 !== a.nodeType && 8 !== a.nodeType && a.style ) {
						var e, f, g, h = n.camelCase( b ), i = a.style;
						return b = n.cssProps[h] || (n.cssProps[h] = Fa( i, h )), g = n.cssHooks[b] || n.cssHooks[h], void 0 === c ? g && "get" in g && void 0 !== (e = g.get( a, !1, d )) ? e : i[b] : (f = typeof c, "string" === f && (e = Ba.exec( c )) && (c = (e[1] + 1) * e[2] + parseFloat( n.css( a, b ) ), f = "number"), null != c && c === c && ("number" !== f || n.cssNumber[h] || (c += "px"), k.clearCloneStyle || "" !== c || 0 !== b.indexOf( "background" ) || (i[b] = "inherit"), g && "set" in g && void 0 === (c = g.set( a, c, d )) || (i[b] = c)), void 0)
					}
				}, css                                                                                                                                                                                                                :function ( a, b, c, d ) {
					var e, f, g, h = n.camelCase( b );
					return b = n.cssProps[h] || (n.cssProps[h] = Fa( a.style, h )), g = n.cssHooks[b] || n.cssHooks[h], g && "get" in g && (e = g.get( a, !0, c )), void 0 === e && (e = xa( a, b, d )), "normal" === e && b in Da && (e = Da[b]), "" === c || c ? (f = parseFloat( e ), c === !0 || n.isNumeric( f ) ? f || 0 : e) : e
				}
				}
			), n.each(
				["height", "width"], function ( a, b ) {
					n.cssHooks[b] = {
						get   :function ( a, c, d ) {
							return c ? za.test( n.css( a, "display" ) ) && 0 === a.offsetWidth ? n.swap(
								a, Ca, function () {
									return Ia( a, b, d )
								}
							) : Ia( a, b, d ) : void 0
						}, set:function ( a, c, d ) {
							var e = d && wa( a );
							return Ga( a, c, d ? Ha( a, b, d, "border-box" === n.css( a, "boxSizing", !1, e ), e ) : 0 )
						}
					}
				}
			), n.cssHooks.marginRight = ya(
				k.reliableMarginRight, function ( a, b ) {
					return b ? n.swap( a, { display:"inline-block" }, xa, [a, "marginRight"] ) : void 0
				}
			), n.each(
				{ margin:"", padding:"", border:"Width" }, function ( a, b ) {
					n.cssHooks[a + b] = {
						expand:function ( c ) {
							for ( var d = 0, e = {}, f = "string" == typeof c ? c.split( " " ) : [c] ; 4 > d ; d++ )e[a + R[d] + b] = f[d] || f[d - 2] || f[0];
							return e
						}
					}, ua.test( a ) || (n.cssHooks[a + b].set = Ga)
				}
			), n.fn.extend(
				{
					css    :function ( a, b ) {
						return J(
							this, function ( a, b, c ) {
								var d, e, f = {}, g = 0;
								if ( n.isArray( b ) ) {
									for ( d = wa( a ), e = b.length ; e > g ; g++ )f[b[g]] = n.css( a, b[g], !1, d );
									return f
								}
								return void 0 !== c ? n.style( a, b, c ) : n.css( a, b )
							}, a, b, arguments.length > 1
						)
					}, show:function () {
					return Ja( this, !0 )
				}, hide    :function () {
					return Ja( this )
				}, toggle  :function ( a ) {
					return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(
						function () {
							S( this ) ? n( this ).show() : n( this ).hide()
						}
					)
				}
				}
			);
			function Ka( a, b, c, d, e ) {
				return new Ka.prototype.init( a, b, c, d, e )
			}

			n.Tween = Ka, Ka.prototype = {
				constructor:Ka, init:function ( a, b, c, d, e, f ) {
					this.elem = a, this.prop = c, this.easing = e || "swing", this.options = b, this.start = this.now = this.cur(), this.end = d, this.unit = f || (n.cssNumber[c] ? "" : "px")
				}, cur              :function () {
					var a = Ka.propHooks[this.prop];
					return a && a.get ? a.get( this ) : Ka.propHooks._default.get( this )
				}, run              :function ( a ) {
					var b, c = Ka.propHooks[this.prop];
					return this.options.duration ? this.pos = b = n.easing[this.easing]( a, this.options.duration * a, 0, 1, this.options.duration ) : this.pos = b = a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call( this.elem, this.now, this ), c && c.set ? c.set( this ) : Ka.propHooks._default.set( this ), this
				}
			}, Ka.prototype.init.prototype = Ka.prototype, Ka.propHooks = {
				_default:{
					get   :function ( a ) {
						var b;
						return null == a.elem[a.prop] || a.elem.style && null != a.elem.style[a.prop] ? (b = n.css( a.elem, a.prop, "" ), b && "auto" !== b ? b : 0) : a.elem[a.prop]
					}, set:function ( a ) {
						n.fx.step[a.prop] ? n.fx.step[a.prop]( a ) : a.elem.style && (null != a.elem.style[n.cssProps[a.prop]] || n.cssHooks[a.prop]) ? n.style( a.elem, a.prop, a.now + a.unit ) : a.elem[a.prop] = a.now
					}
				}
			}, Ka.propHooks.scrollTop = Ka.propHooks.scrollLeft = {
				set:function ( a ) {
					a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now)
				}
			}, n.easing = {
				linear  :function ( a ) {
					return a
				}, swing:function ( a ) {
					return .5 - Math.cos( a * Math.PI ) / 2
				}
			}, n.fx = Ka.prototype.init, n.fx.step = {};
			var La, Ma, Na = /^(?:toggle|show|hide)$/, Oa = new RegExp( "^(?:([+-])=|)(" + Q + ")([a-z%]*)$", "i" ), Pa = /queueHooks$/, Qa = [Va], Ra = {
				"*":[
					function ( a, b ) {
						var c = this.createTween( a, b ), d = c.cur(), e = Oa.exec( b ), f = e && e[3] || (n.cssNumber[a] ? "" : "px"), g = (n.cssNumber[a] || "px" !== f && +d) && Oa.exec( n.css( c.elem, a ) ), h = 1, i = 20;
						if ( g && g[3] !== f ) {
							f = f || g[3], e = e || [], g = +d || 1;
							do h = h || ".5", g /= h, n.style( c.elem, a, g + f );
							while ( h !== (h = c.cur() / d) && 1 !== h && --i )
						}
						return e && (g = c.start = +g || +d || 0, c.unit = f, c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2]), c
					}
				]
			};

			function Sa() {
				return setTimeout(
					function () {
						La = void 0
					}
				), La = n.now()
			}

			function Ta( a, b ) {
				var c, d = 0, e = { height:a };
				for ( b = b ? 1 : 0 ; 4 > d ; d += 2 - b )c = R[d], e["margin" + c] = e["padding" + c] = a;
				return b && (e.opacity = e.width = a), e
			}

			function Ua( a, b, c ) {
				for ( var d, e = (Ra[b] || []).concat( Ra["*"] ), f = 0, g = e.length ; g > f ; f++ )if ( d = e[f].call( c, b, a ) )return d
			}

			function Va( a, b, c ) {
				var d, e, f, g, h, i, j, k, l = this, m = {}, o = a.style, p = a.nodeType && S( a ), q = L.get( a, "fxshow" );
				c.queue || (h = n._queueHooks( a, "fx" ), null == h.unqueued && (h.unqueued = 0, i = h.empty.fire, h.empty.fire = function () {
					h.unqueued || i()
				}), h.unqueued++, l.always(
					function () {
						l.always(
							function () {
								h.unqueued--, n.queue( a, "fx" ).length || h.empty.fire()
							}
						)
					}
				)), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [o.overflow, o.overflowX, o.overflowY], j = n.css( a, "display" ), k = "none" === j ? L.get( a, "olddisplay" ) || ta( a.nodeName ) : j, "inline" === k && "none" === n.css( a, "float" ) && (o.display = "inline-block")), c.overflow && (o.overflow = "hidden", l.always(
					function () {
						o.overflow = c.overflow[0], o.overflowX = c.overflow[1], o.overflowY = c.overflow[2]
					}
				));
				for ( d in b )if ( e = b[d], Na.exec( e ) ) {
					if ( delete b[d], f = f || "toggle" === e, e === (p ? "hide" : "show") ) {
						if ( "show" !== e || !q || void 0 === q[d] )continue;
						p = !0
					}
					m[d] = q && q[d] || n.style( a, d )
				}
				else j = void 0;
				if ( n.isEmptyObject( m ) )"inline" === ("none" === j ? ta( a.nodeName ) : j) && (o.display = j);
				else {
					q ? "hidden" in q && (p = q.hidden) : q = L.access( a, "fxshow", {} ), f && (q.hidden = !p), p ? n( a ).show() : l.done(
						function () {
							n( a ).hide()
						}
					), l.done(
						function () {
							var b;
							L.remove( a, "fxshow" );
							for ( b in m )n.style( a, b, m[b] )
						}
					);
					for ( d in m )g = Ua( p ? q[d] : 0, d, l ), d in q || (q[d] = g.start, p && (g.end = g.start, g.start = "width" === d || "height" === d ? 1 : 0))
				}
			}

			function Wa( a, b ) {
				var c, d, e, f, g;
				for ( c in a )if ( d = n.camelCase( c ), e = b[d], f = a[c], n.isArray( f ) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = n.cssHooks[d], g && "expand" in g ) {
					f = g.expand( f ), delete a[d];
					for ( c in f )c in a || (a[c] = f[c], b[c] = e)
				}
				else b[d] = e
			}

			function Xa( a, b, c ) {
				var d, e, f = 0, g = Qa.length, h = n.Deferred().always(
					function () {
						delete i.elem
					}
				), i                              = function () {
					if ( e )return !1;
					for ( var b = La || Sa(), c = Math.max( 0, j.startTime + j.duration - b ), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length ; i > g ; g++ )j.tweens[g].run( f );
					return h.notifyWith( a, [j, f, c] ), 1 > f && i ? c : (h.resolveWith( a, [j] ), !1)
				}, j                              = h.promise(
					{
						elem:a, props:n.extend( {}, b ), opts:n.extend( !0, { specialEasing:{} }, c ), originalProperties:b, originalOptions:c, startTime:La || Sa(), duration:c.duration, tweens:[], createTween:function ( b, c ) {
						var d = n.Tween( a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing );
						return j.tweens.push( d ), d
					}, stop                                                                                                                                                                                      :function ( b ) {
						var c = 0, d = b ? j.tweens.length : 0;
						if ( e )return this;
						for ( e = !0 ; d > c ; c++ )j.tweens[c].run( 1 );
						return b ? h.resolveWith( a, [j, b] ) : h.rejectWith( a, [j, b] ), this
					}
					}
				), k                              = j.props;
				for ( Wa( k, j.opts.specialEasing ) ; g > f ; f++ )if ( d = Qa[f].call( j, a, k, j.opts ) )return d;
				return n.map( k, Ua, j ), n.isFunction( j.opts.start ) && j.opts.start.call( a, j ), n.fx.timer( n.extend( i, { elem:a, anim:j, queue:j.opts.queue } ) ), j.progress( j.opts.progress ).done( j.opts.done, j.opts.complete ).fail( j.opts.fail ).always( j.opts.always )
			}

			n.Animation = n.extend(
				Xa, {
					tweener     :function ( a, b ) {
						n.isFunction( a ) ? (b = a, a = ["*"]) : a = a.split( " " );
						for ( var c, d = 0, e = a.length ; e > d ; d++ )c = a[d], Ra[c] = Ra[c] || [], Ra[c].unshift( b )
					}, prefilter:function ( a, b ) {
						b ? Qa.unshift( a ) : Qa.push( a )
					}
				}
			), n.speed = function ( a, b, c ) {
				var d = a && "object" == typeof a ? n.extend( {}, a ) : { complete:c || !c && b || n.isFunction( a ) && a, duration:a, easing:c && b || b && !n.isFunction( b ) && b };
				return d.duration = n.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in n.fx.speeds ? n.fx.speeds[d.duration] : n.fx.speeds._default, (null == d.queue || d.queue === !0) && (d.queue = "fx"), d.old = d.complete, d.complete = function () {
					n.isFunction( d.old ) && d.old.call( this ), d.queue && n.dequeue( this, d.queue )
				}, d
			}, n.fn.extend(
				{
					fadeTo    :function ( a, b, c, d ) {
						return this.filter( S ).css( "opacity", 0 ).show().end().animate( { opacity:b }, a, c, d )
					}, animate:function ( a, b, c, d ) {
					var e = n.isEmptyObject( a ), f = n.speed( b, c, d ), g = function () {
						var b = Xa( this, n.extend( {}, a ), f );
						(e || L.get( this, "finish" )) && b.stop( !0 )
					};
					return g.finish = g, e || f.queue === !1 ? this.each( g ) : this.queue( f.queue, g )
				}, stop       :function ( a, b, c ) {
					var d = function ( a ) {
						var b = a.stop;
						delete a.stop, b( c )
					};
					return "string" != typeof a && (c = b, b = a, a = void 0), b && a !== !1 && this.queue( a || "fx", [] ), this.each(
						function () {
							var b = !0, e = null != a && a + "queueHooks", f = n.timers, g = L.get( this );
							if ( e )g[e] && g[e].stop && d( g[e] );
							else for ( e in g )g[e] && g[e].stop && Pa.test( e ) && d( g[e] );
							for ( e = f.length ; e-- ; )f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop( c ), b = !1, f.splice( e, 1 ));
							(b || !c) && n.dequeue( this, a )
						}
					)
				}, finish     :function ( a ) {
					return a !== !1 && (a = a || "fx"), this.each(
						function () {
							var b, c = L.get( this ), d = c[a + "queue"], e = c[a + "queueHooks"], f = n.timers, g = d ? d.length : 0;
							for ( c.finish = !0, n.queue( this, a, [] ), e && e.stop && e.stop.call( this, !0 ), b = f.length ; b-- ; )f[b].elem === this && f[b].queue === a && (f[b].anim.stop( !0 ), f.splice( b, 1 ));
							for ( b = 0 ; g > b ; b++ )d[b] && d[b].finish && d[b].finish.call( this );
							delete c.finish
						}
					)
				}
				}
			), n.each(
				["toggle", "show", "hide"], function ( a, b ) {
					var c   = n.fn[b];
					n.fn[b] = function ( a, d, e ) {
						return null == a || "boolean" == typeof a ? c.apply( this, arguments ) : this.animate( Ta( b, !0 ), a, d, e )
					}
				}
			), n.each(
				{ slideDown:Ta( "show" ), slideUp:Ta( "hide" ), slideToggle:Ta( "toggle" ), fadeIn:{ opacity:"show" }, fadeOut:{ opacity:"hide" }, fadeToggle:{ opacity:"toggle" } }, function ( a, b ) {
					n.fn[a] = function ( a, c, d ) {
						return this.animate( b, a, c, d )
					}
				}
			), n.timers = [], n.fx.tick = function () {
				var a, b = 0, c = n.timers;
				for ( La = n.now() ; b < c.length ; b++ )a = c[b], a() || c[b] !== a || c.splice( b--, 1 );
				c.length || n.fx.stop(), La = void 0
			}, n.fx.timer = function ( a ) {
				n.timers.push( a ), a() ? n.fx.start() : n.timers.pop()
			}, n.fx.interval = 13, n.fx.start = function () {
				Ma || (Ma = setInterval( n.fx.tick, n.fx.interval ))
			}, n.fx.stop = function () {
				clearInterval( Ma ), Ma = null
			}, n.fx.speeds = { slow:600, fast:200, _default:400 }, n.fn.delay = function ( a, b ) {
				return a = n.fx ? n.fx.speeds[a] || a : a, b = b || "fx", this.queue(
					b, function ( b, c ) {
						var d  = setTimeout( b, a );
						c.stop = function () {
							clearTimeout( d )
						}
					}
				)
			}, function () {
				var a = l.createElement( "input" ), b = l.createElement( "select" ), c = b.appendChild( l.createElement( "option" ) );
				a.type = "checkbox", k.checkOn = "" !== a.value, k.optSelected = c.selected, b.disabled = !0, k.optDisabled = !c.disabled, a = l.createElement( "input" ), a.value = "t", a.type = "radio", k.radioValue = "t" === a.value
			}();
			var Ya, Za, $a = n.expr.attrHandle;
			n.fn.extend(
				{
					attr         :function ( a, b ) {
						return J( this, n.attr, a, b, arguments.length > 1 )
					}, removeAttr:function ( a ) {
					return this.each(
						function () {
							n.removeAttr( this, a )
						}
					)
				}
				}
			), n.extend(
				{
					attr         :function ( a, b, c ) {
						var d, e, f = a.nodeType;
						if ( a && 3 !== f && 8 !== f && 2 !== f )return typeof a.getAttribute === U ? n.prop( a, b, c ) : (1 === f && n.isXMLDoc( a ) || (b = b.toLowerCase(), d = n.attrHooks[b] || (n.expr.match.bool.test( b ) ? Za : Ya)),
							void 0 === c ? d && "get" in d && null !== (e = d.get( a, b )) ? e : (e = n.find.attr( a, b ), null == e ? void 0 : e) : null !== c ? d && "set" in d && void 0 !== (e = d.set( a, c, b )) ? e : (a.setAttribute( b, c + "" ), c) : void n.removeAttr( a, b ))
					}, removeAttr:function ( a, b ) {
					var c, d, e = 0, f = b && b.match( E );
					if ( f && 1 === a.nodeType )while ( c = f[e++] )d = n.propFix[c] || c, n.expr.match.bool.test( c ) && (a[d] = !1), a.removeAttribute( c )
				}, attrHooks     :{
					type:{
						set:function ( a, b ) {
							if ( !k.radioValue && "radio" === b && n.nodeName( a, "input" ) ) {
								var c = a.value;
								return a.setAttribute( "type", b ), c && (a.value = c), b
							}
						}
					}
				}
				}
			), Za = {
				set:function ( a, b, c ) {
					return b === !1 ? n.removeAttr( a, c ) : a.setAttribute( c, c ), c
				}
			}, n.each(
				n.expr.match.bool.source.match( /\w+/g ), function ( a, b ) {
					var c = $a[b] || n.find.attr;
					$a[b] = function ( a, b, d ) {
						var e, f;
						return d || (f = $a[b], $a[b] = e, e = null != c( a, b, d ) ? b.toLowerCase() : null, $a[b] = f), e
					}
				}
			);
			var _a = /^(?:input|select|textarea|button)$/i;
			n.fn.extend(
				{
					prop         :function ( a, b ) {
						return J( this, n.prop, a, b, arguments.length > 1 )
					}, removeProp:function ( a ) {
					return this.each(
						function () {
							delete this[n.propFix[a] || a]
						}
					)
				}
				}
			), n.extend(
				{
					propFix:{ "for":"htmlFor", "class":"className" }, prop:function ( a, b, c ) {
					var d, e, f, g = a.nodeType;
					if ( a && 3 !== g && 8 !== g && 2 !== g )return f = 1 !== g || !n.isXMLDoc( a ), f && (b = n.propFix[b] || b, e = n.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set( a, c, b )) ? d : a[b] = c : e && "get" in e && null !== (d = e.get( a, b )) ? d : a[b]
				}, propHooks                                              :{
					tabIndex:{
						get:function ( a ) {
							return a.hasAttribute( "tabindex" ) || _a.test( a.nodeName ) || a.href ? a.tabIndex : -1
						}
					}
				}
				}
			), k.optSelected || (n.propHooks.selected = {
				get:function ( a ) {
					var b = a.parentNode;
					return b && b.parentNode && b.parentNode.selectedIndex, null
				}
			}), n.each(
				["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
					n.propFix[this.toLowerCase()] = this
				}
			);
			var ab = /[\t\r\n\f]/g;
			n.fn.extend(
				{
					addClass      :function ( a ) {
						var b, c, d, e, f, g, h = "string" == typeof a && a, i = 0, j = this.length;
						if ( n.isFunction( a ) )return this.each(
							function ( b ) {
								n( this ).addClass( a.call( this, b, this.className ) )
							}
						);
						if ( h )for ( b = (a || "").match( E ) || [] ; j > i ; i++ )if ( c = this[i], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace( ab, " " ) : " ") ) {
							f = 0;
							while ( e = b[f++] )d.indexOf( " " + e + " " ) < 0 && (d += e + " ");
							g = n.trim( d ), c.className !== g && (c.className = g)
						}
						return this
					}, removeClass:function ( a ) {
					var b, c, d, e, f, g, h = 0 === arguments.length || "string" == typeof a && a, i = 0, j = this.length;
					if ( n.isFunction( a ) )return this.each(
						function ( b ) {
							n( this ).removeClass( a.call( this, b, this.className ) )
						}
					);
					if ( h )for ( b = (a || "").match( E ) || [] ; j > i ; i++ )if ( c = this[i], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace( ab, " " ) : "") ) {
						f = 0;
						while ( e = b[f++] )while ( d.indexOf( " " + e + " " ) >= 0 )d = d.replace( " " + e + " ", " " );
						g = a ? n.trim( d ) : "", c.className !== g && (c.className = g)
					}
					return this
				}, toggleClass    :function ( a, b ) {
					var c = typeof a;
					return "boolean" == typeof b && "string" === c ? b ? this.addClass( a ) : this.removeClass( a ) : this.each(
						n.isFunction( a ) ? function ( c ) {
							n( this ).toggleClass( a.call( this, c, this.className, b ), b )
						} : function () {
							if ( "string" === c ) {
								var b, d = 0, e = n( this ), f = a.match( E ) || [];
								while ( b = f[d++] )e.hasClass( b ) ? e.removeClass( b ) : e.addClass( b )
							}
							else(c === U || "boolean" === c) && (this.className && L.set( this, "__className__", this.className ), this.className = this.className || a === !1 ? "" : L.get( this, "__className__" ) || "")
						}
					)
				}, hasClass       :function ( a ) {
					for ( var b = " " + a + " ", c = 0, d = this.length ; d > c ; c++ )if ( 1 === this[c].nodeType && (" " + this[c].className + " ").replace( ab, " " ).indexOf( b ) >= 0 )return !0;
					return !1
				}
				}
			);
			var bb = /\r/g;
			n.fn.extend(
				{
					val:function ( a ) {
						var b, c, d, e = this[0];
						{
							if ( arguments.length )return d = n.isFunction( a ), this.each(
								function ( c ) {
									var e;
									1 === this.nodeType && (e = d ? a.call( this, c, n( this ).val() ) : a, null == e ? e = "" : "number" == typeof e ? e += "" : n.isArray( e ) && (e = n.map(
										e, function ( a ) {
											return null == a ? "" : a + ""
										}
									)), b = n.valHooks[this.type] || n.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set( this, e, "value" ) || (this.value = e))
								}
							);
							if ( e )return b = n.valHooks[e.type] || n.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get( e, "value" )) ? c : (c = e.value, "string" == typeof c ? c.replace( bb, "" ) : null == c ? "" : c)
						}
					}
				}
			), n.extend(
				{
					valHooks:{
						option   :{
							get:function ( a ) {
								var b = n.find.attr( a, "value" );
								return null != b ? b : n.trim( n.text( a ) )
							}
						}, select:{
							get   :function ( a ) {
								for ( var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0 ; h > i ; i++ )if ( c = d[i], !(!c.selected && i !== e || (k.optDisabled ? c.disabled : null !== c.getAttribute( "disabled" )) || c.parentNode.disabled && n.nodeName( c.parentNode, "optgroup" )) ) {
									if ( b = n( c ).val(), f )return b;
									g.push( b )
								}
								return g
							}, set:function ( a, b ) {
								var c, d, e = a.options, f = n.makeArray( b ), g = e.length;
								while ( g-- )d = e[g], (d.selected = n.inArray( d.value, f ) >= 0) && (c = !0);
								return c || (a.selectedIndex = -1), f
							}
						}
					}
				}
			), n.each(
				["radio", "checkbox"], function () {
					n.valHooks[this] = {
						set:function ( a, b ) {
							return n.isArray( b ) ? a.checked = n.inArray( n( a ).val(), b ) >= 0 : void 0
						}
					}, k.checkOn || (n.valHooks[this].get = function ( a ) {
						return null === a.getAttribute( "value" ) ? "on" : a.value
					})
				}
			), n.each(
				"blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split( " " ), function ( a, b ) {
					n.fn[b] = function ( a, c ) {
						return arguments.length > 0 ? this.on( b, null, a, c ) : this.trigger( b )
					}
				}
			), n.fn.extend(
				{
					hover    :function ( a, b ) {
						return this.mouseenter( a ).mouseleave( b || a )
					}, bind  :function ( a, b, c ) {
					return this.on( a, null, b, c )
				}, unbind    :function ( a, b ) {
					return this.off( a, null, b )
				}, delegate  :function ( a, b, c, d ) {
					return this.on( b, a, c, d )
				}, undelegate:function ( a, b, c ) {
					return 1 === arguments.length ? this.off( a, "**" ) : this.off( b, a || "**", c )
				}
				}
			);
			var cb = n.now(), db = /\?/;
			n.parseJSON = function ( a ) {
				return JSON.parse( a + "" )
			}, n.parseXML = function ( a ) {
				var b, c;
				if ( !a || "string" != typeof a )return null;
				try {
					c = new DOMParser, b = c.parseFromString( a, "text/xml" )
				}
				catch ( d ) {
					b = void 0
				}
				return (!b || b.getElementsByTagName( "parsererror" ).length) && n.error( "Invalid XML: " + a ), b
			};
			var eb = /#.*$/, fb = /([?&])_=[^&]*/, gb = /^(.*?):[ \t]*([^\r\n]*)$/gm, hb = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, ib = /^(?:GET|HEAD)$/, jb = /^\/\//, kb = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, lb = {}, mb = {}, nb = "*/".concat( "*" ), ob = a.location.href, pb = kb.exec( ob.toLowerCase() ) || [];

			function qb( a ) {
				return function ( b, c ) {
					"string" != typeof b && (c = b, b = "*");
					var d, e = 0, f = b.toLowerCase().match( E ) || [];
					if ( n.isFunction( c ) )while ( d = f[e++] )"+" === d[0] ? (d = d.slice( 1 ) || "*", (a[d] = a[d] || []).unshift( c )) : (a[d] = a[d] || []).push( c )
				}
			}

			function rb( a, b, c, d ) {
				var e = {}, f = a === mb;

				function g( h ) {
					var i;
					return e[h] = !0, n.each(
						a[h] || [], function ( a, h ) {
							var j = h( b, c, d );
							return "string" != typeof j || f || e[j] ? f ? !(i = j) : void 0 : (b.dataTypes.unshift( j ), g( j ), !1)
						}
					), i
				}

				return g( b.dataTypes[0] ) || !e["*"] && g( "*" )
			}

			function sb( a, b ) {
				var c, d, e = n.ajaxSettings.flatOptions || {};
				for ( c in b )void 0 !== b[c] && ((e[c] ? a : d || (d = {}))[c] = b[c]);
				return d && n.extend( !0, a, d ), a
			}

			function tb( a, b, c ) {
				var d, e, f, g, h = a.contents, i = a.dataTypes;
				while ( "*" === i[0] )i.shift(), void 0 === d && (d = a.mimeType || b.getResponseHeader( "Content-Type" ));
				if ( d )for ( e in h )if ( h[e] && h[e].test( d ) ) {
					i.unshift( e );
					break
				}
				if ( i[0] in c )f = i[0];
				else {
					for ( e in c ) {
						if ( !i[0] || a.converters[e + " " + i[0]] ) {
							f = e;
							break
						}
						g || (g = e)
					}
					f = f || g
				}
				return f ? (f !== i[0] && i.unshift( f ), c[f]) : void 0
			}

			function ub( a, b, c, d ) {
				var e, f, g, h, i, j = {}, k = a.dataTypes.slice();
				if ( k[1] )for ( g in a.converters )j[g.toLowerCase()] = a.converters[g];
				f = k.shift();
				while ( f )if ( a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter( b, a.dataType )), i = f, f = k.shift() )if ( "*" === f )f = i;
				else if ( "*" !== i && i !== f ) {
					if ( g = j[i + " " + f] || j["* " + f], !g )for ( e in j )if ( h = e.split( " " ), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]]) ) {
						g === !0 ? g = j[e] : j[e] !== !0 && (f = h[0], k.unshift( h[1] ));
						break
					}
					if ( g !== !0 )if ( g && a["throws"] )b = g( b );
					else try {
							b = g( b )
						}
						catch ( l ) {
							return { state:"parsererror", error:g ? l : "No conversion from " + i + " to " + f }
						}
				}
				return { state:"success", data:b }
			}

			n.extend(
				{
					active:0, lastModified:{}, etag:{}, ajaxSettings:{ url:ob, type:"GET", isLocal:hb.test( pb[1] ), global:!0, processData:!0, async:!0, contentType:"application/x-www-form-urlencoded; charset=UTF-8", accepts:{ "*":nb, text:"text/plain", html:"text/html", xml:"application/xml, text/xml", json:"application/json, text/javascript" }, contents:{ xml:/xml/, html:/html/, json:/json/ }, responseFields:{ xml:"responseXML", text:"responseText", json:"responseJSON" }, converters:{ "* text":String, "text html":!0, "text json":n.parseJSON, "text xml":n.parseXML }, flatOptions:{ url:!0, context:!0 } }, ajaxSetup:function (
					a,
					b
				) {
					return b ? sb( sb( a, n.ajaxSettings ), b ) : sb( n.ajaxSettings, a )
				}, ajaxPrefilter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               :qb( lb ), ajaxTransport                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       :qb( mb ), ajax:function ( a, b ) {
					"object" == typeof a && (b = a, a = void 0), b = b || {};
					var c, d, e, f, g, h, i, j, k = n.ajaxSetup( {}, b ), l = k.context || k, m = k.context && (l.nodeType || l.jquery) ? n( l ) : n.event, o = n.Deferred(), p = n.Callbacks( "once memory" ), q = k.statusCode || {}, r = {}, s = {}, t = 0, u = "canceled", v = {
						readyState:0, getResponseHeader:function ( a ) {
							var b;
							if ( 2 === t ) {
								if ( !f ) {
									f = {};
									while ( b = gb.exec( e ) )f[b[1].toLowerCase()] = b[2]
								}
								b = f[a.toLowerCase()]
							}
							return null == b ? null : b
						}, getAllResponseHeaders       :function () {
							return 2 === t ? e : null
						}, setRequestHeader            :function ( a, b ) {
							var c = a.toLowerCase();
							return t || (a = s[c] = s[c] || a, r[a] = b), this
						}, overrideMimeType            :function ( a ) {
							return t || (k.mimeType = a), this
						}, statusCode                  :function ( a ) {
							var b;
							if ( a )if ( 2 > t )for ( b in a )q[b] = [q[b], a[b]];
							else v.always( a[v.status] );
							return this
						}, abort                       :function ( a ) {
							var b = a || u;
							return c && c.abort( b ), x( 0, b ), this
						}
					};
					if ( o.promise( v ).complete = p.add, v.success = v.done, v.error = v.fail, k.url = ((a || k.url || ob) + "").replace( eb, "" ).replace( jb, pb[1] + "//" ), k.type = b.method || b.type || k.method || k.type, k.dataTypes = n.trim( k.dataType || "*" )
																																																												   .toLowerCase()
																																																												   .match( E ) || [""], null == k.crossDomain && (h = kb.exec( k.url.toLowerCase() ), k.crossDomain = !(!h || h[1] === pb[1] && h[2] === pb[2] && (h[3] || ("http:" === h[1] ? "80" : "443")) === (pb[3] || ("http:" === pb[1] ? "80" : "443")))), k.data && k.processData && "string" != typeof k.data && (k.data = n.param( k.data, k.traditional )), rb( lb, k, b, v ), 2 === t )return v;
					i = n.event && k.global, i && 0 === n.active++ && n.event.trigger( "ajaxStart" ), k.type = k.type.toUpperCase(), k.hasContent = !ib.test( k.type ), d = k.url, k.hasContent || (k.data && (d = k.url += (db.test( d ) ? "&" : "?") + k.data, delete k.data), k.cache === !1 && (k.url = fb.test( d ) ? d.replace( fb, "$1_=" + cb++ ) : d + (db.test( d ) ? "&" : "?") + "_=" + cb++)), k.ifModified && (n.lastModified[d] && v.setRequestHeader( "If-Modified-Since", n.lastModified[d] ), n.etag[d] && v.setRequestHeader( "If-None-Match", n.etag[d] )), (k.data && k.hasContent && k.contentType !== !1 || b.contentType) && v.setRequestHeader( "Content-Type", k.contentType ), v.setRequestHeader( "Accept", k.dataTypes[0] && k.accepts[k.dataTypes[0]] ? k.accepts[k.dataTypes[0]] + ("*" !== k.dataTypes[0] ? ", " + nb + "; q=0.01" : "") : k.accepts["*"] );
					for ( j in k.headers )v.setRequestHeader( j, k.headers[j] );
					if ( k.beforeSend && (k.beforeSend.call( l, v, k ) === !1 || 2 === t) )return v.abort();
					u = "abort";
					for ( j in{ success:1, error:1, complete:1 } )v[j]( k[j] );
					if ( c = rb( mb, k, b, v ) ) {
						v.readyState = 1, i && m.trigger( "ajaxSend", [v, k] ), k.async && k.timeout > 0 && (g = setTimeout(
							function () {
								v.abort( "timeout" )
							}, k.timeout
						));
						try {
							t = 1, c.send( r, x )
						}
						catch ( w ) {
							if ( !(2 > t) )throw w;
							x( -1, w )
						}
					}
					else x( -1, "No Transport" );
					function x( a, b, f, h ) {
						var j, r, s, u, w, x = b;
						2 !== t && (t = 2, g && clearTimeout( g ), c = void 0, e = h || "", v.readyState = a > 0 ? 4 : 0, j = a >= 200 && 300 > a || 304 === a, f && (u = tb( k, v, f )), u = ub( k, u, v, j ), j ? (k.ifModified && (w = v.getResponseHeader( "Last-Modified" ), w && (n.lastModified[d] = w), w = v.getResponseHeader( "etag" ), w && (n.etag[d] = w)), 204 === a || "HEAD" === k.type ? x = "nocontent" : 304 === a ? x = "notmodified" : (x = u.state, r = u.data, s = u.error, j = !s)) : (s = x, (a || !x) && (x = "error", 0 > a && (a = 0))), v.status = a, v.statusText = (b || x) + "", j ? o.resolveWith(
							l, [
								r,
								x,
								v
							]
						) : o.rejectWith( l, [v, x, s] ), v.statusCode( q ), q = void 0, i && m.trigger( j ? "ajaxSuccess" : "ajaxError", [v, k, j ? r : s] ), p.fireWith( l, [v, x] ), i && (m.trigger( "ajaxComplete", [v, k] ), --n.active || n.event.trigger( "ajaxStop" )))
					}

					return v
				}, getJSON                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     :function ( a, b, c ) {
					return n.get( a, b, c, "json" )
				}, getScript                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   :function ( a, b ) {
					return n.get( a, void 0, b, "script" )
				}
				}
			), n.each(
				["get", "post"], function ( a, b ) {
					n[b] = function ( a, c, d, e ) {
						return n.isFunction( c ) && (e = e || d, d = c, c = void 0), n.ajax( { url:a, type:b, dataType:e, data:c, success:d } )
					}
				}
			), n._evalUrl = function ( a ) {
				return n.ajax( { url:a, type:"GET", dataType:"script", async:!1, global:!1, "throws":!0 } )
			}, n.fn.extend(
				{
					wrapAll     :function ( a ) {
						var b;
						return n.isFunction( a ) ? this.each(
							function ( b ) {
								n( this ).wrapAll( a.call( this, b ) )
							}
						) : (this[0] && (b = n( a, this[0].ownerDocument ).eq( 0 ).clone( !0 ), this[0].parentNode && b.insertBefore( this[0] ), b.map(
							function () {
								var a = this;
								while ( a.firstElementChild )a = a.firstElementChild;
								return a
							}
						).append( this )), this)
					}, wrapInner:function ( a ) {
					return this.each(
						n.isFunction( a ) ? function ( b ) {
							n( this ).wrapInner( a.call( this, b ) )
						} : function () {
							var b = n( this ), c = b.contents();
							c.length ? c.wrapAll( a ) : b.append( a )
						}
					)
				}, wrap         :function ( a ) {
					var b = n.isFunction( a );
					return this.each(
						function ( c ) {
							n( this ).wrapAll( b ? a.call( this, c ) : a )
						}
					)
				}, unwrap       :function () {
					return this.parent().each(
						function () {
							n.nodeName( this, "body" ) || n( this ).replaceWith( this.childNodes )
						}
					).end()
				}
				}
			), n.expr.filters.hidden = function ( a ) {
				return a.offsetWidth <= 0 && a.offsetHeight <= 0
			}, n.expr.filters.visible = function ( a ) {
				return !n.expr.filters.hidden( a )
			};
			var vb = /%20/g, wb = /\[\]$/, xb = /\r?\n/g, yb = /^(?:submit|button|image|reset|file)$/i, zb = /^(?:input|select|textarea|keygen)/i;

			function Ab( a, b, c, d ) {
				var e;
				if ( n.isArray( b ) )n.each(
					b, function ( b, e ) {
						c || wb.test( a ) ? d( a, e ) : Ab( a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d )
					}
				);
				else if ( c || "object" !== n.type( b ) )d( a, b );
				else for ( e in b )Ab( a + "[" + e + "]", b[e], c, d )
			}

			n.param = function ( a, b ) {
				var c, d = [], e = function ( a, b ) {
					b = n.isFunction( b ) ? b() : null == b ? "" : b, d[d.length] = encodeURIComponent( a ) + "=" + encodeURIComponent( b )
				};
				if ( void 0 === b && (b = n.ajaxSettings && n.ajaxSettings.traditional), n.isArray( a ) || a.jquery && !n.isPlainObject( a ) )n.each(
					a, function () {
						e( this.name, this.value )
					}
				);
				else for ( c in a )Ab( c, a[c], b, e );
				return d.join( "&" ).replace( vb, "+" )
			}, n.fn.extend(
				{
					serialize        :function () {
						return n.param( this.serializeArray() )
					}, serializeArray:function () {
					return this.map(
						function () {
							var a = n.prop( this, "elements" );
							return a ? n.makeArray( a ) : this
						}
					).filter(
						function () {
							var a = this.type;
							return this.name && !n( this ).is( ":disabled" ) && zb.test( this.nodeName ) && !yb.test( a ) && (this.checked || !T.test( a ))
						}
					).map(
						function ( a, b ) {
							var c = n( this ).val();
							return null == c ? null : n.isArray( c ) ? n.map(
								c, function ( a ) {
									return { name:b.name, value:a.replace( xb, "\r\n" ) }
								}
							) : { name:b.name, value:c.replace( xb, "\r\n" ) }
						}
					).get()
				}
				}
			), n.ajaxSettings.xhr = function () {
				try {
					return new XMLHttpRequest
				}
				catch ( a ) {
				}
			};
			var Bb = 0, Cb = {}, Db = { 0:200, 1223:204 }, Eb = n.ajaxSettings.xhr();
			a.attachEvent && a.attachEvent(
				"onunload", function () {
					for ( var a in Cb )Cb[a]()
				}
			), k.cors = !!Eb && "withCredentials" in Eb, k.ajax = Eb = !!Eb, n.ajaxTransport(
				function ( a ) {
					var b;
					return k.cors || Eb && !a.crossDomain ? {
						send    :function ( c, d ) {
							var e, f = a.xhr(), g = ++Bb;
							if ( f.open( a.type, a.url, a.async, a.username, a.password ), a.xhrFields )for ( e in a.xhrFields )f[e] = a.xhrFields[e];
							a.mimeType && f.overrideMimeType && f.overrideMimeType( a.mimeType ), a.crossDomain || c["X-Requested-With"] || (c["X-Requested-With"] = "XMLHttpRequest");
							for ( e in c )f.setRequestHeader( e, c[e] );
							b = function ( a ) {
								return function () {
									b && (delete Cb[g], b = f.onload = f.onerror = null, "abort" === a ? f.abort() : "error" === a ? d( f.status, f.statusText ) : d( Db[f.status] || f.status, f.statusText, "string" == typeof f.responseText ? { text:f.responseText } : void 0, f.getAllResponseHeaders() ))
								}
							}, f.onload = b(), f.onerror = b( "error" ), b = Cb[g] = b( "abort" );
							try {
								f.send( a.hasContent && a.data || null )
							}
							catch ( h ) {
								if ( b )throw h
							}
						}, abort:function () {
							b && b()
						}
					} : void 0
				}
			), n.ajaxSetup(
				{
					accepts:{ script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" }, contents:{ script:/(?:java|ecma)script/ }, converters:{
					"text script":function ( a ) {
						return n.globalEval( a ), a
					}
				}
				}
			), n.ajaxPrefilter(
				"script", function ( a ) {
					void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET")
				}
			), n.ajaxTransport(
				"script", function ( a ) {
					if ( a.crossDomain ) {
						var b, c;
						return {
							send    :function ( d, e ) {
								b = n( "<script>" ).prop( { async:!0, charset:a.scriptCharset, src:a.url } ).on(
									"load error", c = function ( a ) {
										b.remove(), c = null, a && e( "error" === a.type ? 404 : 200, a.type )
									}
								), l.head.appendChild( b[0] )
							}, abort:function () {
								c && c()
							}
						}
					}
				}
			);
			var Fb = [], Gb = /(=)\?(?=&|$)|\?\?/;
			n.ajaxSetup(
				{
					jsonp:"callback", jsonpCallback:function () {
					var a = Fb.pop() || n.expando + "_" + cb++;
					return this[a] = !0, a
				}
				}
			), n.ajaxPrefilter(
				"json jsonp", function ( b, c, d ) {
					var e, f, g, h = b.jsonp !== !1 && (Gb.test( b.url ) ? "url" : "string" == typeof b.data && !(b.contentType || "").indexOf( "application/x-www-form-urlencoded" ) && Gb.test( b.data ) && "data");
					return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = n.isFunction( b.jsonpCallback ) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace( Gb, "$1" + e ) : b.jsonp !== !1 && (b.url += (db.test( b.url ) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function () {
						return g || n.error( e + " was not called" ), g[0]
					}, b.dataTypes[0] = "json", f = a[e], a[e] = function () {
						g = arguments
					}, d.always(
						function () {
							a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, Fb.push( e )), g && n.isFunction( f ) && f( g[0] ), g = f = void 0
						}
					), "script") : void 0
				}
			), n.parseHTML = function ( a, b, c ) {
				if ( !a || "string" != typeof a )return null;
				"boolean" == typeof b && (c = b, b = !1), b = b || l;
				var d = v.exec( a ), e = !c && [];
				return d ? [b.createElement( d[1] )] : (d = n.buildFragment( [a], b, e ), e && e.length && n( e ).remove(), n.merge( [], d.childNodes ))
			};
			var Hb = n.fn.load;
			n.fn.load = function ( a, b, c ) {
				if ( "string" != typeof a && Hb )return Hb.apply( this, arguments );
				var d, e, f, g = this, h = a.indexOf( " " );
				return h >= 0 && (d = n.trim( a.slice( h ) ), a = a.slice( 0, h )), n.isFunction( b ) ? (c = b, b = void 0) : b && "object" == typeof b && (e = "POST"), g.length > 0 && n.ajax( { url:a, type:e, dataType:"html", data:b } ).done(
					function ( a ) {
						f = arguments, g.html( d ? n( "<div>" ).append( n.parseHTML( a ) ).find( d ) : a )
					}
				).complete(
																																										 c && function ( a, b ) {
																																											 g.each( c, f || [a.responseText, b, a] )
																																										 }
				), this
			}, n.each(
				["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function ( a, b ) {
					n.fn[b] = function ( a ) {
						return this.on( b, a )
					}
				}
			), n.expr.filters.animated = function ( a ) {
				return n.grep(
					n.timers, function ( b ) {
						return a === b.elem
					}
				).length
			};
			var Ib = a.document.documentElement;

			function Jb( a ) {
				return n.isWindow( a ) ? a : 9 === a.nodeType && a.defaultView
			}

			n.offset = {
				setOffset:function ( a, b, c ) {
					var d, e, f, g, h, i, j, k = n.css( a, "position" ), l = n( a ), m = {};
					"static" === k && (a.style.position = "relative"), h = l.offset(), f = n.css( a, "top" ), i = n.css( a, "left" ), j = ("absolute" === k || "fixed" === k) && (f + i).indexOf( "auto" ) > -1, j ? (d = l.position(), g = d.top, e = d.left) : (g = parseFloat( f ) || 0, e = parseFloat( i ) || 0), n.isFunction( b ) && (b = b.call( a, c, h )), null != b.top && (m.top = b.top - h.top + g), null != b.left && (m.left = b.left - h.left + e), "using" in b ? b.using.call( a, m ) : l.css( m )
				}
			}, n.fn.extend(
				{
					offset     :function ( a ) {
						if ( arguments.length )return void 0 === a ? this : this.each(
							function ( b ) {
								n.offset.setOffset( this, a, b )
							}
						);
						var b, c, d = this[0], e = { top:0, left:0 }, f = d && d.ownerDocument;
						if ( f )return b = f.documentElement, n.contains( b, d ) ? (typeof d.getBoundingClientRect !== U && (e = d.getBoundingClientRect()), c = Jb( f ), { top:e.top + c.pageYOffset - b.clientTop, left:e.left + c.pageXOffset - b.clientLeft }) : e
					}, position:function () {
					if ( this[0] ) {
						var a, b, c = this[0], d = { top:0, left:0 };
						return "fixed" === n.css( c, "position" ) ? b = c.getBoundingClientRect() : (a = this.offsetParent(), b = this.offset(), n.nodeName( a[0], "html" ) || (d = a.offset()), d.top += n.css( a[0], "borderTopWidth", !0 ), d.left += n.css( a[0], "borderLeftWidth", !0 )), { top:b.top - d.top - n.css( c, "marginTop", !0 ), left:b.left - d.left - n.css( c, "marginLeft", !0 ) }
					}
				}, offsetParent:function () {
					return this.map(
						function () {
							var a = this.offsetParent || Ib;
							while ( a && !n.nodeName( a, "html" ) && "static" === n.css( a, "position" ) )a = a.offsetParent;
							return a || Ib
						}
					)
				}
				}
			), n.each(
				{ scrollLeft:"pageXOffset", scrollTop:"pageYOffset" }, function ( b, c ) {
					var d   = "pageYOffset" === c;
					n.fn[b] = function ( e ) {
						return J(
							this, function ( b, e, f ) {
								var g = Jb( b );
								return void 0 === f ? g ? g[c] : b[e] : void(g ? g.scrollTo( d ? a.pageXOffset : f, d ? f : a.pageYOffset ) : b[e] = f)
							}, b, e, arguments.length, null
						)
					}
				}
			), n.each(
				["top", "left"], function ( a, b ) {
					n.cssHooks[b] = ya(
						k.pixelPosition, function ( a, c ) {
							return c ? (c = xa( a, b ), va.test( c ) ? n( a ).position()[b] + "px" : c) : void 0
						}
					)
				}
			), n.each(
				{ Height:"height", Width:"width" }, function ( a, b ) {
					n.each(
						{ padding:"inner" + a, content:b, "":"outer" + a }, function ( c, d ) {
							n.fn[d] = function ( d, e ) {
								var f = arguments.length && (c || "boolean" != typeof d), g = c || (d === !0 || e === !0 ? "margin" : "border");
								return J(
									this, function ( b, c, d ) {
										var e;
										return n.isWindow( b ) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, Math.max( b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a] )) : void 0 === d ? n.css( b, c, g ) : n.style( b, c, d, g )
									}, b, f ? d : void 0, f, null
								)
							}
						}
					)
				}
			), n.fn.size = function () {
				return this.length
			}, n.fn.andSelf = n.fn.addBack, "function" == typeof define && define.amd && define(
				"jquery", [], function () {
					return n
				}
			);
			var Kb = a.jQuery, Lb = a.$;
			return n.noConflict = function ( b ) {
				return a.$ === n && (a.$ = Lb), b && a.jQuery === n && (a.jQuery = Kb), n
			}, typeof b === U && (a.jQuery = a.$ = n), n
		}
	);

	var jQuery = (window.jQuery || window.$).noConflict( true );

	/* ASP.NET SignalR JavaScript Library v2.2.2*/
	(function ( n, t, i ) {
		function w( t, i ) {
			var u, f;
			if ( n.isArray( t ) ) {
				for ( u = t.length - 1 ; u >= 0 ; u-- )f = t[u], n.type( f ) === "string" && r.transports[f] || (i.log( "Invalid transport: " + f + ", removing it from the transports list." ), t.splice( u, 1 ));
				t.length === 0 && (i.log( "No transports remain within the specified transport array." ), t = null)
			}
			else if ( r.transports[t] || t === "auto" ) {
				if ( t === "auto" && r._.ieVersion <= 8 )return ["longPolling"]
			}
			else i.log( "Invalid transport: " + t.toString() + "." ), t = null;
			return t
		}

		function b( n ) {
			return n === "http:" ? 80 : n === "https:" ? 443 : void 0
		}

		function a( n, t ) {
			return t.match( /:\d+$/ ) ? t : t + ":" + b( n )
		}

		function k( t, i ) {
			var u       = this, r = [];
			u.tryBuffer = function ( i ) {
				return t.state === n.signalR.connectionState.connecting ? (r.push( i ), !0) : !1
			};
			u.drain     = function () {
				if ( t.state === n.signalR.connectionState.connected )while ( r.length > 0 )i( r.shift() )
			};
			u.clear     = function () {
				r = []
			}
		}

		var f = { nojQuery:"jQuery was not found. Please ensure jQuery is referenced before the SignalR client JavaScript file.", noTransportOnInit:"No transport could be initialized successfully. Try specifying a different transport or none at all for auto initialization.", errorOnNegotiate:"Error during negotiation request.", stoppedWhileLoading:"The connection was stopped during page load.", stoppedWhileNegotiating:"The connection was stopped during the negotiate request.", errorParsingNegotiateResponse:"Error parsing negotiate response.", errorDuringStartRequest:"Error during start request. Stopping the connection.", stoppedDuringStartRequest:"The connection was stopped during the start request.", errorParsingStartResponse:"Error parsing start response: '{0}'. Stopping the connection.", invalidStartResponse:"Invalid start response: '{0}'. Stopping the connection.", protocolIncompatible:"You are using a version of the client that isn't compatible with the server. Client version {0}, server version {1}.", sendFailed:"Send failed.", parseFailed:"Failed at parsing response: {0}", longPollFailed:"Long polling request failed.", eventSourceFailedToConnect:"EventSource failed to connect.", eventSourceError:"Error raised by EventSource", webSocketClosed:"WebSocket closed.", pingServerFailedInvalidResponse:"Invalid ping response when pinging server: '{0}'.", pingServerFailed:"Failed to ping server.", pingServerFailedStatusCode:"Failed to ping server.  Server responded with status code {0}, stopping the connection.", pingServerFailedParse:"Failed to parse ping server response, stopping the connection.", noConnectionTransport:"Connection is in an invalid state, there is no transport active.", webSocketsInvalidState:"The Web Socket transport is in an invalid state, transitioning into reconnecting.", reconnectTimeout:"Couldn't reconnect within the configured timeout of {0} ms, disconnecting.", reconnectWindowTimeout:"The client has been inactive since {0} and it has exceeded the inactivity timeout of {1} ms. Stopping the connection." };
		if ( typeof n != "function" )throw new Error( f.nojQuery );
		var r, h, o = t.document.readyState === "complete", e = n( t ), c = "__Negotiate Aborted__", u = { onStart:"onStart", onStarting:"onStarting", onReceived:"onReceived", onError:"onError", onConnectionSlow:"onConnectionSlow", onReconnecting:"onReconnecting", onReconnect:"onReconnect", onStateChanged:"onStateChanged", onDisconnect:"onDisconnect" }, v = function ( n, i ) {
			if ( i !== !1 ) {
				var r;
				typeof t.console != "undefined" && (r = "[" + (new Date).toTimeString() + "] SignalR: " + n, t.console.debug ? t.console.debug( r ) : t.console.log && t.console.log( r ))
			}
		}, s        = function ( t, i, r ) {
			return i === t.state ? (t.state = r, n( t ).triggerHandler( u.onStateChanged, [{ oldState:i, newState:r }] ), !0) : !1
		}, y        = function ( n ) {
			return n.state === r.connectionState.disconnected
		}, l        = function ( n ) {
			return n._.keepAliveData.activated && n.transport.supportsKeepAlive( n )
		}, p        = function ( i ) {
			var f, e;
			i._.configuredStopReconnectingTimeout || (e = function ( t ) {
				var i = r._.format( r.resources.reconnectTimeout, t.disconnectTimeout );
				t.log( i );
				n( t ).triggerHandler( u.onError, [r._.error( i, "TimeoutException" )] );
				t.stop( !1, !1 )
			}, i.reconnecting(
				function () {
					var n = this;
					n.state === r.connectionState.reconnecting && (f = t.setTimeout(
						function () {
							e( n )
						}, n.disconnectTimeout
					))
				}
			), i.stateChanged(
				function ( n ) {
					n.oldState === r.connectionState.reconnecting && t.clearTimeout( f )
				}
			), i._.configuredStopReconnectingTimeout = !0)
		};
		if ( r = function ( n, t, i ) {
				return new r.fn.init( n, t, i )
			}, r._ = {
				defaultContentType      :"application/x-www-form-urlencoded; charset=UTF-8", ieVersion:function () {
					var i, n;
					return t.navigator.appName === "Microsoft Internet Explorer" && (n = /MSIE ([0-9]+\.[0-9]+)/.exec( t.navigator.userAgent ), n && (i = t.parseFloat( n[1] ))), i
				}(), error              :function ( n, t, i ) {
					var r = new Error( n );
					return r.source = t, typeof i != "undefined" && (r.context = i), r
				}, transportError       :function ( n, t, r, u ) {
					var f = this.error( n, r, u );
					return f.transport = t ? t.name : i, f
				}, format               :function () {
					for ( var t = arguments[0], n = 0 ; n < arguments.length - 1 ; n++ )t = t.replace( "{" + n + "}", arguments[n + 1] );
					return t
				}, firefoxMajorVersion  :function ( n ) {
					var t = n.match( /Firefox\/(\d+)/ );
					return !t || !t.length || t.length < 2 ? 0 : parseInt( t[1], 10 )
				}, configurePingInterval:function ( i ) {
					var f = i._.config, e = function ( t ) {
						n( i ).triggerHandler( u.onError, [t] )
					};
					f && !i._.pingIntervalId && f.pingInterval && (i._.pingIntervalId = t.setInterval(
						function () {
							r.transports._logic.pingServer( i ).fail( e )
						}, f.pingInterval
					))
				}
			}, r.events = u, r.resources = f, r.ajaxDefaults = { processData:!0, timeout:null, async:!0, global:!1, cache:!1 }, r.changeState = s, r.isDisconnecting = y, r.connectionState = { connecting:0, connected:1, reconnecting:2, disconnected:4 }, r.hub = {
				start:function () {
					throw new Error( "SignalR: Error loading hubs. Ensure your hubs reference is correct, e.g. <script src='/signalr/js'><\/script>." );
				}
			}, typeof e.on == "function" )e.on(
			"load", function () {
				o = !0
			}
		);
		else e.load(
			function () {
				o = !0
			}
		);
		r.fn = r.prototype = {
			init             :function ( t, i, r ) {
				var f          = n( this );
				this.url       = t;
				this.qs        = i;
				this.lastError = null;
				this._         = {
					keepAliveData   :{}, connectingMessageBuffer:new k(
						this, function ( n ) {
							f.triggerHandler( u.onReceived, [n] )
						}
					), lastMessageAt:(new Date).getTime(), lastActiveAt:(new Date).getTime(), beatInterval:5e3, beatHandle:null, totalTransportConnectTimeout:0
				};
				typeof r == "boolean" && (this.logging = r)
			}, _parseResponse:function ( n ) {
				var t = this;
				return n ? typeof n == "string" ? t.json.parse( n ) : n : n
			}, _originalJson :t.JSON, json:t.JSON, isCrossDomain:function ( i, r ) {
				var u;
				return (i = n.trim( i ), r = r || t.location, i.indexOf( "http" ) !== 0) ? !1 : (u = t.document.createElement( "a" ), u.href = i, u.protocol + a( u.protocol, u.host ) !== r.protocol + a( r.protocol, r.host ))
			}, ajaxDataType  :"text", contentType:"application/json; charset=UTF-8", logging:!1, state:r.connectionState.disconnected, clientProtocol:"1.5", reconnectDelay:2e3, transportConnectTimeout:0, disconnectTimeout:3e4, reconnectWindow:3e4, keepAliveWarnAt:2 / 3, start:function ( i, h ) {
				var a = this, v = { pingInterval:3e5, waitForPageLoad:!0, transport:"auto", jsonp:!1 }, d, y = a._deferral || n.Deferred(), b = t.document.createElement( "a" ), k, g;
				if ( a.lastError = null, a._deferral = y, !a.json )throw new Error( "SignalR: No JSON parser found. Please ensure json2.js is referenced before the SignalR.js file if you need to support clients without native JSON parsing support, e.g. IE<8." );
				if ( n.type( i ) === "function" ? h = i : n.type( i ) === "object" && (n.extend( v, i ), n.type( v.callback ) === "function" && (h = v.callback)), v.transport = w( v.transport, a ), !v.transport )throw new Error( "SignalR: Invalid transport(s) specified, aborting start." );
				return (a._.config = v, !o && v.waitForPageLoad === !0) ? (a._.deferredStartHandler = function () {
					a.start( i, h )
				}, e.bind( "load", a._.deferredStartHandler ), y.promise()) : a.state === r.connectionState.connecting ? y.promise() : s( a, r.connectionState.disconnected, r.connectionState.connecting ) === !1 ? (y.resolve( a ), y.promise()) : (p( a ), b.href = a.url, b.protocol && b.protocol !== ":" ? (a.protocol = b.protocol, a.host = b.host) : (a.protocol = t.document.location.protocol, a.host = b.host || t.document.location.host), a.baseUrl = a.protocol + "//" + a.host, a.wsProtocol = a.protocol === "https:" ? "wss://" : "ws://", v.transport === "auto" && v.jsonp === !0 && (v.transport = "longPolling"), a.url.indexOf( "//" ) === 0 && (a.url = t.location.protocol + a.url, a.log( "Protocol relative URL detected, normalizing it to '" + a.url + "'." )), this.isCrossDomain( a.url ) && (a.log( "Auto detected cross domain url." ), v.transport === "auto" && (v.transport = [
					"webSockets",
					"serverSentEvents",
					"longPolling"
				]), typeof v.withCredentials == "undefined" && (v.withCredentials = !0), v.jsonp || (v.jsonp = !n.support.cors, v.jsonp && a.log( "Using jsonp because this browser doesn't support CORS." )), a.contentType = r._.defaultContentType), a.withCredentials = v.withCredentials, a.ajaxDataType = v.jsonp ? "jsonp" : "text", n( a ).bind(
					u.onStart, function () {
						n.type( h ) === "function" && h.call( a );
						y.resolve( a )
					}
				), a._.initHandler = r.transports._logic.initHandler( a ), d = function ( i, o ) {
					var c = r._.error( f.noTransportOnInit );
					if ( o = o || 0, o >= i.length ) {
						o === 0 ? a.log( "No transports supported by the server were selected." ) : o === 1 ? a.log( "No fallback transports were selected." ) : a.log( "Fallback transports exhausted." );
						n( a ).triggerHandler( u.onError, [c] );
						y.reject( c );
						a.stop();
						return
					}
					if ( a.state !== r.connectionState.disconnected ) {
						var p       = i[o], h = r.transports[p], v = function () {
							d( i, o + 1 )
						};
						a.transport = h;
						try {
							a._.initHandler.start(
								h, function () {
									var i = r._.firefoxMajorVersion( t.navigator.userAgent ) >= 11, f = !!a.withCredentials && i;
									a.log( "The start request succeeded. Transitioning to the connected state." );
									l( a ) && r.transports._logic.monitorKeepAlive( a );
									r.transports._logic.startHeartbeat( a );
									r._.configurePingInterval( a );
									s( a, r.connectionState.connecting, r.connectionState.connected ) || a.log( "WARNING! The connection was not in the connecting state." );
									a._.connectingMessageBuffer.drain();
									n( a ).triggerHandler( u.onStart );
									e.bind(
										"unload", function () {
											a.log( "Window unloading, stopping the connection." );
											a.stop( f )
										}
									);
									i && e.bind(
										"beforeunload", function () {
											t.setTimeout(
												function () {
													a.stop( f )
												}, 0
											)
										}
									)
								}, v
							)
						}
						catch ( w ) {
							a.log( h.name + " transport threw '" + w.message + "' when attempting to start." );
							v()
						}
					}
				}, k = a.url + "/negotiate", g = function ( t, i ) {
					var e = r._.error( f.errorOnNegotiate, t, i._.negotiateRequest );
					n( i ).triggerHandler( u.onError, e );
					y.reject( e );
					i.stop()
				}, n( a ).triggerHandler( u.onStarting ), k = r.transports._logic.prepareQueryString( a, k ), a.log( "Negotiating with '" + k + "'." ), a._.negotiateRequest = r.transports._logic.ajax(
					a, {
						url:k, error:function ( n, t ) {
							t !== c ? g( n, a ) : y.reject( r._.error( f.stoppedWhileNegotiating, null, a._.negotiateRequest ) )
						}, success  :function ( t ) {
							var i, e, h, o = [], s = [];
							try {
								i = a._parseResponse( t )
							}
							catch ( c ) {
								g( r._.error( f.errorParsingNegotiateResponse, c ), a );
								return
							}
							if ( e = a._.keepAliveData, a.appRelativeUrl = i.Url, a.id = i.ConnectionId, a.token = i.ConnectionToken, a.webSocketServerUrl = i.WebSocketServerUrl, a._.pollTimeout = i.ConnectionTimeout * 1e3 + 1e4, a.disconnectTimeout = i.DisconnectTimeout * 1e3, a._.totalTransportConnectTimeout = a.transportConnectTimeout + i.TransportConnectTimeout * 1e3, i.KeepAliveTimeout ? (e.activated = !0, e.timeout = i.KeepAliveTimeout * 1e3, e.timeoutWarning = e.timeout * a.keepAliveWarnAt, a._.beatInterval = (e.timeout - e.timeoutWarning) / 3) : e.activated = !1, a.reconnectWindow = a.disconnectTimeout + (e.timeout || 0), !i.ProtocolVersion || i.ProtocolVersion !== a.clientProtocol ) {
								h = r._.error( r._.format( f.protocolIncompatible, a.clientProtocol, i.ProtocolVersion ) );
								n( a ).triggerHandler( u.onError, [h] );
								y.reject( h );
								return
							}
							n.each(
								r.transports, function ( n ) {
									if ( n.indexOf( "_" ) === 0 || n === "webSockets" && !i.TryWebSockets )return !0;
									s.push( n )
								}
							);
							n.isArray( v.transport ) ? n.each(
								v.transport, function ( t, i ) {
									n.inArray( i, s ) >= 0 && o.push( i )
								}
							) : v.transport === "auto" ? o = s : n.inArray( v.transport, s ) >= 0 && o.push( v.transport );
							d( o )
						}
					}
				), y.promise())
			}, starting      :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onStarting, function () {
						t.call( i )
					}
				), i
			}, send          :function ( n ) {
				var t = this;
				if ( t.state === r.connectionState.disconnected )throw new Error( "SignalR: Connection must be started before data can be sent. Call .start() before .send()" );
				if ( t.state === r.connectionState.connecting )throw new Error( "SignalR: Connection has not been fully initialized. Use .start().done() or .start().fail() to run logic after the connection has started." );
				return t.transport.send( t, n ), t
			}, received      :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onReceived, function ( n, r ) {
						t.call( i, r )
					}
				), i
			}, stateChanged  :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onStateChanged, function ( n, r ) {
						t.call( i, r )
					}
				), i
			}, error         :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onError, function ( n, r, u ) {
						i.lastError = r;
						t.call( i, r, u )
					}
				), i
			}, disconnected  :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onDisconnect, function () {
						t.call( i )
					}
				), i
			}, connectionSlow:function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onConnectionSlow, function () {
						t.call( i )
					}
				), i
			}, reconnecting  :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onReconnecting, function () {
						t.call( i )
					}
				), i
			}, reconnected   :function ( t ) {
				var i = this;
				return n( i ).bind(
					u.onReconnect, function () {
						t.call( i )
					}
				), i
			}, stop          :function ( i, h ) {
				var a = this, v = a._deferral;
				if ( a._.deferredStartHandler && e.unbind( "load", a._.deferredStartHandler ), delete a._.config, delete a._.deferredStartHandler, !o && (!a._.config || a._.config.waitForPageLoad === !0) ) {
					a.log( "Stopping connection prior to negotiate." );
					v && v.reject( r._.error( f.stoppedWhileLoading ) );
					return
				}
				if ( a.state !== r.connectionState.disconnected )return a.log( "Stopping connection." ), t.clearTimeout( a._.beatHandle ), t.clearInterval( a._.pingIntervalId ), a.transport && (a.transport.stop( a ), h !== !1 && a.transport.abort( a, i ), l( a ) && r.transports._logic.stopMonitoringKeepAlive( a ), a.transport = null), a._.negotiateRequest && (a._.negotiateRequest.abort( c ), delete a._.negotiateRequest), a._.initHandler && a._.initHandler.stop(), delete a._deferral, delete a.messageId, delete a.groupsToken, delete a.id, delete a._.pingIntervalId, delete a._.lastMessageAt, delete a._.lastActiveAt, a._.connectingMessageBuffer.clear(), n( a )
					.unbind( u.onStart ), s( a, a.state, r.connectionState.disconnected ), n( a ).triggerHandler( u.onDisconnect ), a
			}, log           :function ( n ) {
				v( n, this.logging )
			}
		};
		r.fn.init.prototype = r.fn;
		r.noConflict        = function () {
			return n.connection === r && (n.connection = h), r
		};
		n.connection && (h = n.connection);
		n.connection = n.signalR = r
	})( jQuery, window ), function ( n, t, i ) {
		function s( n ) {
			n._.keepAliveData.monitoring && l( n );
			u.markActive( n ) && (n._.beatHandle = t.setTimeout(
				function () {
					s( n )
				}, n._.beatInterval
			))
		}

		function l( t ) {
			var i = t._.keepAliveData, u;
			t.state === r.connectionState.connected && (u = (new Date).getTime() - t._.lastMessageAt, u >= i.timeout ? (t.log( "Keep alive timed out.  Notifying transport that connection has been lost." ), t.transport.lostConnection( t )) : u >= i.timeoutWarning ? i.userNotified || (t.log( "Keep alive has been missed, connection may be dead/slow." ), n( t ).triggerHandler( f.onConnectionSlow ), i.userNotified = !0) : i.userNotified = !1)
		}

		function e( n, t ) {
			var i = n.url + t;
			return n.transport && (i += "?transport=" + n.transport.name), u.prepareQueryString( n, i )
		}

		function h( n ) {
			this.connection        = n;
			this.startRequested    = !1;
			this.startCompleted    = !1;
			this.connectionStopped = !1
		}

		var r        = n.signalR, f = n.signalR.events, c = n.signalR.changeState, o = "__Start Aborted__", u;
		r.transports = {};
		h.prototype  = {
			start             :function ( n, r, u ) {
				var f = this, e = f.connection, o = !1;
				if ( f.startRequested || f.connectionStopped ) {
					e.log( "WARNING! " + n.name + " transport cannot be started. Initialization ongoing or completed." );
					return
				}
				e.log( n.name + " transport starting." );
				n.start(
					e, function () {
						o || f.initReceived( n, r )
					}, function ( t ) {
						return o || (o = !0, f.transportFailed( n, t, u )), !f.startCompleted || f.connectionStopped
					}
				);
				f.transportTimeoutHandle = t.setTimeout(
					function () {
						o || (o = !0, e.log( n.name + " transport timed out when trying to connect." ), f.transportFailed( n, i, u ))
					}, e._.totalTransportConnectTimeout
				)
			}, stop           :function () {
				this.connectionStopped = !0;
				t.clearTimeout( this.transportTimeoutHandle );
				r.transports._logic.tryAbortStartRequest( this.connection )
			}, initReceived   :function ( n, i ) {
				var u = this, f = u.connection;
				if ( u.startRequested ) {
					f.log( "WARNING! The client received multiple init messages." );
					return
				}
				u.connectionStopped || (u.startRequested = !0, t.clearTimeout( u.transportTimeoutHandle ), f.log( n.name + " transport connected. Initiating start request." ), r.transports._logic.ajaxStart(
					f, function () {
						u.startCompleted = !0;
						i()
					}
				))
			}, transportFailed:function ( i, u, e ) {
				var o = this.connection, h = o._deferral, s;
				this.connectionStopped || (t.clearTimeout( this.transportTimeoutHandle ), this.startRequested ? this.startCompleted || (s = r._.error( r.resources.errorDuringStartRequest, u ), o.log( i.name + " transport failed during the start request. Stopping the connection." ), n( o ).triggerHandler( f.onError, [s] ), h && h.reject( s ), o.stop()) : (i.stop( o ), o.log( i.name + " transport failed to connect. Attempting to fall back." ), e()))
			}
		};
		u            = r.transports._logic = {
			ajax                         :function ( t, i ) {
				return n.ajax( n.extend( !0, {}, n.signalR.ajaxDefaults, { type:"GET", data:{}, xhrFields:{ withCredentials:t.withCredentials }, contentType:t.contentType, dataType:t.ajaxDataType }, i ) )
			}, pingServer                :function ( t ) {
				var e, f, i = n.Deferred();
				return t.transport ? (e = t.url + "/ping", e = u.addQs( e, t.qs ), f = u.ajax(
					t, {
						url:e, success:function ( n ) {
							var u;
							try {
								u = t._parseResponse( n )
							}
							catch ( e ) {
								i.reject( r._.transportError( r.resources.pingServerFailedParse, t.transport, e, f ) );
								t.stop();
								return
							}
							u.Response === "pong" ? i.resolve() : i.reject( r._.transportError( r._.format( r.resources.pingServerFailedInvalidResponse, n ), t.transport, null, f ) )
						}, error      :function ( n ) {
							n.status === 401 || n.status === 403 ? (i.reject( r._.transportError( r._.format( r.resources.pingServerFailedStatusCode, n.status ), t.transport, n, f ) ), t.stop()) : i.reject( r._.transportError( r.resources.pingServerFailed, t.transport, n, f ) )
						}
					}
				)) : i.reject( r._.transportError( r.resources.noConnectionTransport, t.transport ) ), i.promise()
			}, prepareQueryString        :function ( n, i ) {
				var r;
				return r = u.addQs( i, "clientProtocol=" + n.clientProtocol ), r = u.addQs( r, n.qs ), n.token && (r += "&connectionToken=" + t.encodeURIComponent( n.token )), n.data && (r += "&connectionData=" + t.encodeURIComponent( n.data )), r
			}, addQs                     :function ( t, i ) {
				var r = t.indexOf( "?" ) !== -1 ? "&" : "?", u;
				if ( !i )return t;
				if ( typeof i == "object" )return t + r + n.param( i );
				if ( typeof i == "string" )return u = i.charAt( 0 ), (u === "?" || u === "&") && (r = ""), t + r + i;
				throw new Error( "Query string property must be either a string or object." );
			}, getUrl                    :function ( n, i, r, f, e ) {
				var h = i === "webSockets" ? "" : n.baseUrl, o = h + n.appRelativeUrl, s = "transport=" + i;
				return !e && n.groupsToken && (s += "&groupsToken=" + t.encodeURIComponent( n.groupsToken )), r ? (o += f ? "/poll" : "/reconnect", !e && n.messageId && (s += "&messageId=" + t.encodeURIComponent( n.messageId ))) : o += "/connect", o += "?" + s, o = u.prepareQueryString( n, o ), e || (o += "&tid=" + Math.floor( Math.random() * 11 )), o
			}, maximizePersistentResponse:function ( n ) {
				return { MessageId:n.C, Messages:n.M, Initialized:typeof n.S != "undefined" ? !0 : !1, ShouldReconnect:typeof n.T != "undefined" ? !0 : !1, LongPollDelay:n.L, GroupsToken:n.G }
			}, updateGroups              :function ( n, t ) {
				t && (n.groupsToken = t)
			}, stringifySend             :function ( n, t ) {
				return typeof t == "string" || typeof t == "undefined" || t === null ? t : n.json.stringify( t )
			}, ajaxSend                  :function ( t, i ) {
				var h = u.stringifySend( t, i ), c = e( t, "/send" ), o, s = function ( t, u ) {
					n( u ).triggerHandler( f.onError, [r._.transportError( r.resources.sendFailed, u.transport, t, o ), i] )
				};
				return o = u.ajax(
					t, {
						url:c, type:t.ajaxDataType === "jsonp" ? "GET" : "POST", contentType:r._.defaultContentType, data:{ data:h }, success:function ( n ) {
							var i;
							if ( n ) {
								try {
									i = t._parseResponse( n )
								}
								catch ( r ) {
									s( r, t );
									t.stop();
									return
								}
								u.triggerReceived( t, i )
							}
						}, error                                                                                                             :function ( n, i ) {
							i !== "abort" && i !== "parsererror" && s( n, t )
						}
					}
				)
			}, ajaxAbort                 :function ( n, t ) {
				if ( typeof n.transport != "undefined" ) {
					t     = typeof t == "undefined" ? !0 : t;
					var i = e( n, "/abort" );
					u.ajax( n, { url:i, async:t, timeout:1e3, type:"POST" } );
					n.log( "Fired ajax abort async = " + t + "." )
				}
			}, ajaxStart                 :function ( t, i ) {
				var h            = function ( n ) {
					var i = t._deferral;
					i && i.reject( n )
				}, s             = function ( i ) {
					t.log( "The start request failed. Stopping the connection." );
					n( t ).triggerHandler( f.onError, [i] );
					h( i );
					t.stop()
				};
				t._.startRequest = u.ajax(
					t, {
						url:e( t, "/start" ), success:function ( n, u, f ) {
							var e;
							try {
								e = t._parseResponse( n )
							}
							catch ( o ) {
								s( r._.error( r._.format( r.resources.errorParsingStartResponse, n ), o, f ) );
								return
							}
							e.Response === "started" ? i() : s( r._.error( r._.format( r.resources.invalidStartResponse, n ), null, f ) )
						}, error                     :function ( n, i, u ) {
							i !== o ? s( r._.error( r.resources.errorDuringStartRequest, u, n ) ) : (t.log( "The start request aborted because connection.stop() was called." ), h( r._.error( r.resources.stoppedDuringStartRequest, null, n ) ))
						}
					}
				)
			}, tryAbortStartRequest      :function ( n ) {
				n._.startRequest && (n._.startRequest.abort( o ), delete n._.startRequest)
			}, tryInitialize             :function ( n, t, i ) {
				t.Initialized && i ? i() : t.Initialized && n.log( "WARNING! The client received an init message after reconnecting." )
			}, triggerReceived           :function ( t, i ) {
				t._.connectingMessageBuffer.tryBuffer( i ) || n( t ).triggerHandler( f.onReceived, [i] )
			}, processMessages           :function ( t, i, r ) {
				var f;
				u.markLastMessage( t );
				i && (f = u.maximizePersistentResponse( i ), u.updateGroups( t, f.GroupsToken ), f.MessageId && (t.messageId = f.MessageId), f.Messages && (n.each(
					f.Messages, function ( n, i ) {
						u.triggerReceived( t, i )
					}
				), u.tryInitialize( t, f, r )))
			}, monitorKeepAlive          :function ( t ) {
				var i = t._.keepAliveData;
				i.monitoring ? t.log( "Tried to monitor keep alive but it's already being monitored." ) : (i.monitoring = !0, u.markLastMessage( t ), t._.keepAliveData.reconnectKeepAliveUpdate = function () {
					u.markLastMessage( t )
				}, n( t ).bind( f.onReconnect, t._.keepAliveData.reconnectKeepAliveUpdate ), t.log( "Now monitoring keep alive with a warning timeout of " + i.timeoutWarning + ", keep alive timeout of " + i.timeout + " and disconnecting timeout of " + t.disconnectTimeout ))
			}, stopMonitoringKeepAlive   :function ( t ) {
				var i = t._.keepAliveData;
				i.monitoring && (i.monitoring = !1, n( t ).unbind( f.onReconnect, t._.keepAliveData.reconnectKeepAliveUpdate ), t._.keepAliveData = {}, t.log( "Stopping the monitoring of the keep alive." ))
			}, startHeartbeat            :function ( n ) {
				n._.lastActiveAt = (new Date).getTime();
				s( n )
			}, markLastMessage           :function ( n ) {
				n._.lastMessageAt = (new Date).getTime()
			}, markActive                :function ( n ) {
				return u.verifyLastActive( n ) ? (n._.lastActiveAt = (new Date).getTime(), !0) : !1
			}, isConnectedOrReconnecting :function ( n ) {
				return n.state === r.connectionState.connected || n.state === r.connectionState.reconnecting
			}, ensureReconnectingState   :function ( t ) {
				return c( t, r.connectionState.connected, r.connectionState.reconnecting ) === !0 && n( t ).triggerHandler( f.onReconnecting ), t.state === r.connectionState.reconnecting
			}, clearReconnectTimeout     :function ( n ) {
				n && n._.reconnectTimeout && (t.clearTimeout( n._.reconnectTimeout ), delete n._.reconnectTimeout)
			}, verifyLastActive          :function ( t ) {
				if ( (new Date).getTime() - t._.lastActiveAt >= t.reconnectWindow ) {
					var i = r._.format( r.resources.reconnectWindowTimeout, new Date( t._.lastActiveAt ), t.reconnectWindow );
					return t.log( i ), n( t ).triggerHandler( f.onError, [r._.error( i, "TimeoutException" )] ), t.stop( !1, !1 ), !1
				}
				return !0
			}, reconnect                 :function ( n, i ) {
				var f = r.transports[i];
				if ( u.isConnectedOrReconnecting( n ) && !n._.reconnectTimeout ) {
					if ( !u.verifyLastActive( n ) )return;
					n._.reconnectTimeout = t.setTimeout(
						function () {
							u.verifyLastActive( n ) && (f.stop( n ), u.ensureReconnectingState( n ) && (n.log( i + " reconnecting." ), f.start( n )))
						}, n.reconnectDelay
					)
				}
			}, handleParseFailure        :function ( t, i, u, e, o ) {
				var s = r._.transportError( r._.format( r.resources.parseFailed, i ), t.transport, u, o );
				e && e( s ) ? t.log( "Failed to parse server response while attempting to connect." ) : (n( t ).triggerHandler( f.onError, [s] ), t.stop())
			}, initHandler               :function ( n ) {
				return new h( n )
			}, foreverFrame              :{ count:0, connections:{} }
		}
	}( jQuery, window ), function ( n, t ) {
		var r                   = n.signalR, u = n.signalR.events, f = n.signalR.changeState, i = r.transports._logic;
		r.transports.webSockets = {
			name             :"webSockets", supportsKeepAlive:function () {
				return !0
			}, send          :function ( t, f ) {
				var e = i.stringifySend( t, f );
				try {
					t.socket.send( e )
				}
				catch ( o ) {
					n( t ).triggerHandler( u.onError, [r._.transportError( r.resources.webSocketsInvalidState, t.transport, o, t.socket ), f] )
				}
			}, start         :function ( e, o, s ) {
				var h, c = !1, l = this, a = !o, v = n( e );
				if ( !t.WebSocket ) {
					s();
					return
				}
				e.socket || (h = e.webSocketServerUrl ? e.webSocketServerUrl : e.wsProtocol + e.host, h += i.getUrl( e, this.name, a ), e.log( "Connecting to websocket endpoint '" + h + "'." ), e.socket = new t.WebSocket( h ), e.socket.onopen = function () {
					c = !0;
					e.log( "Websocket opened." );
					i.clearReconnectTimeout( e );
					f( e, r.connectionState.reconnecting, r.connectionState.connected ) === !0 && v.triggerHandler( u.onReconnect )
				}, e.socket.onclose = function ( t ) {
					var i;
					this === e.socket && (c && typeof t.wasClean != "undefined" && t.wasClean === !1 ? (i = r._.transportError( r.resources.webSocketClosed, e.transport, t ), e.log( "Unclean disconnect from websocket: " + (t.reason || "[no reason given].") )) : e.log( "Websocket closed." ), s && s( i ) || (i && n( e ).triggerHandler( u.onError, [i] ), l.reconnect( e )))
				}, e.socket.onmessage = function ( t ) {
					var r;
					try {
						r = e._parseResponse( t.data )
					}
					catch ( u ) {
						i.handleParseFailure( e, t.data, u, s, t );
						return
					}
					r && (n.isEmptyObject( r ) || r.M ? i.processMessages( e, r, o ) : i.triggerReceived( e, r ))
				})
			}, reconnect     :function ( n ) {
				i.reconnect( n, this.name )
			}, lostConnection:function ( n ) {
				this.reconnect( n )
			}, stop          :function ( n ) {
				i.clearReconnectTimeout( n );
				n.socket && (n.log( "Closing the Websocket." ), n.socket.close(), n.socket = null)
			}, abort         :function ( n, t ) {
				i.ajaxAbort( n, t )
			}
		}
	}( jQuery, window ), function ( n, t ) {
		var i                         = n.signalR, u = n.signalR.events, e = n.signalR.changeState, r = i.transports._logic, f = function ( n ) {
			t.clearTimeout( n._.reconnectAttemptTimeoutHandle );
			delete n._.reconnectAttemptTimeoutHandle
		};
		i.transports.serverSentEvents = {
			name             :"serverSentEvents", supportsKeepAlive:function () {
				return !0
			}, timeOut       :3e3, start:function ( o, s, h ) {
				var c = this, l = !1, a = n( o ), v = !s, y;
				if ( o.eventSource && (o.log( "The connection already has an event source. Stopping it." ), o.stop()), !t.EventSource ) {
					h && (o.log( "This browser doesn't support SSE." ), h());
					return
				}
				y = r.getUrl( o, this.name, v );
				try {
					o.log( "Attempting to connect to SSE endpoint '" + y + "'." );
					o.eventSource = new t.EventSource( y, { withCredentials:o.withCredentials } )
				}
				catch ( p ) {
					o.log( "EventSource failed trying to connect with error " + p.Message + "." );
					h ? h() : (a.triggerHandler( u.onError, [i._.transportError( i.resources.eventSourceFailedToConnect, o.transport, p )] ), v && c.reconnect( o ));
					return
				}
				v && (o._.reconnectAttemptTimeoutHandle = t.setTimeout(
					function () {
						l === !1 && o.eventSource.readyState !== t.EventSource.OPEN && c.reconnect( o )
					}, c.timeOut
				));
				o.eventSource.addEventListener(
					"open", function () {
						o.log( "EventSource connected." );
						f( o );
						r.clearReconnectTimeout( o );
						l === !1 && (l = !0, e( o, i.connectionState.reconnecting, i.connectionState.connected ) === !0 && a.triggerHandler( u.onReconnect ))
					}, !1
				);
				o.eventSource.addEventListener(
					"message", function ( n ) {
						var t;
						if ( n.data !== "initialized" ) {
							try {
								t = o._parseResponse( n.data )
							}
							catch ( i ) {
								r.handleParseFailure( o, n.data, i, h, n );
								return
							}
							r.processMessages( o, t, s )
						}
					}, !1
				);
				o.eventSource.addEventListener(
					"error", function ( n ) {
						var r = i._.transportError( i.resources.eventSourceError, o.transport, n );
						this === o.eventSource && (h && h( r ) || (o.log( "EventSource readyState: " + o.eventSource.readyState + "." ), n.eventPhase === t.EventSource.CLOSED ? (o.log( "EventSource reconnecting due to the server connection ending." ), c.reconnect( o )) : (o.log( "EventSource error." ), a.triggerHandler( u.onError, [r] ))))
					}, !1
				)
			}, reconnect     :function ( n ) {
				r.reconnect( n, this.name )
			}, lostConnection:function ( n ) {
				this.reconnect( n )
			}, send          :function ( n, t ) {
				r.ajaxSend( n, t )
			}, stop          :function ( n ) {
				f( n );
				r.clearReconnectTimeout( n );
				n && n.eventSource && (n.log( "EventSource calling close()." ), n.eventSource.close(), n.eventSource = null, delete n.eventSource)
			}, abort         :function ( n, t ) {
				r.ajaxAbort( n, t )
			}
		}
	}( jQuery, window ), function ( n, t ) {
		var r                     = n.signalR, e = n.signalR.events, o = n.signalR.changeState, i = r.transports._logic, u = function () {
			var n = t.document.createElement( "iframe" );
			return n.setAttribute( "style", "position:absolute;top:0;left:0;width:0;height:0;visibility:hidden;" ), n
		}, f                      = function () {
			var i = null, f = 1e3, n = 0;
			return {
				prevent  :function () {
					r._.ieVersion <= 8 && (n === 0 && (i = t.setInterval(
						function () {
							var n = u();
							t.document.body.appendChild( n );
							t.document.body.removeChild( n );
							n = null
						}, f
					)), n++)
				}, cancel:function () {
					n === 1 && t.clearInterval( i );
					n > 0 && n--
				}
			}
		}();
		r.transports.foreverFrame = {
			name                   :"foreverFrame", supportsKeepAlive:function () {
				return !0
			}, iframeClearThreshold:50, start:function ( n, r, e ) {
				var l = this, s = i.foreverFrame.count += 1, h, o = u(), c = function () {
					n.log( "Forever frame iframe finished loading and is no longer receiving messages." );
					e && e() || l.reconnect( n )
				};
				if ( t.EventSource ) {
					e && (n.log( "Forever Frame is not supported by SignalR on browsers with SSE support." ), e());
					return
				}
				o.setAttribute( "data-signalr-connection-id", n.id );
				f.prevent();
				h = i.getUrl( n, this.name );
				h += "&frameId=" + s;
				t.document.documentElement.appendChild( o );
				n.log( "Binding to iframe's load event." );
				o.addEventListener ? o.addEventListener( "load", c, !1 ) : o.attachEvent && o.attachEvent( "onload", c );
				o.src                         = h;
				i.foreverFrame.connections[s] = n;
				n.frame                       = o;
				n.frameId                     = s;
				r && (n.onSuccess = function () {
					n.log( "Iframe transport started." );
					r()
				})
			}, reconnect           :function ( n ) {
				var r = this;
				i.isConnectedOrReconnecting( n ) && i.verifyLastActive( n ) && t.setTimeout(
					function () {
						if ( i.verifyLastActive( n ) && n.frame && i.ensureReconnectingState( n ) ) {
							var u = n.frame, t = i.getUrl( n, r.name, !0 ) + "&frameId=" + n.frameId;
							n.log( "Updating iframe src to '" + t + "'." );
							u.src = t
						}
					}, n.reconnectDelay
				)
			}, lostConnection      :function ( n ) {
				this.reconnect( n )
			}, send                :function ( n, t ) {
				i.ajaxSend( n, t )
			}, receive             :function ( t, u ) {
				var f, e, o;
				if ( t.json !== t._originalJson && (u = t._originalJson.stringify( u )), o = t._parseResponse( u ), i.processMessages( t, o, t.onSuccess ), t.state === n.signalR.connectionState.connected && (t.frameMessageCount = (t.frameMessageCount || 0) + 1, t.frameMessageCount > r.transports.foreverFrame.iframeClearThreshold && (t.frameMessageCount = 0, f = t.frame.contentWindow || t.frame.contentDocument, f && f.document && f.document.body)) )for ( e = f.document.body ; e.firstChild ; )e.removeChild( e.firstChild )
			}, stop                :function ( n ) {
				var r = null;
				if ( f.cancel(), n.frame ) {
					if ( n.frame.stop )n.frame.stop();
					else try {
						r = n.frame.contentWindow || n.frame.contentDocument;
						r.document && r.document.execCommand && r.document.execCommand( "Stop" )
					}
					catch ( u ) {
						n.log( "Error occurred when stopping foreverFrame transport. Message = " + u.message + "." )
					}
					n.frame.parentNode === t.document.documentElement && t.document.documentElement.removeChild( n.frame );
					delete i.foreverFrame.connections[n.frameId];
					n.frame   = null;
					n.frameId = null;
					delete n.frame;
					delete n.frameId;
					delete n.onSuccess;
					delete n.frameMessageCount;
					n.log( "Stopping forever frame." )
				}
			}, abort               :function ( n, t ) {
				i.ajaxAbort( n, t )
			}, getConnection       :function ( n ) {
				return i.foreverFrame.connections[n]
			}, started             :function ( t ) {
				o( t, r.connectionState.reconnecting, r.connectionState.connected ) === !0 && n( t ).triggerHandler( e.onReconnect )
			}
		}
	}( jQuery, window ), function ( n, t ) {
		var r                    = n.signalR, u = n.signalR.events, e = n.signalR.changeState, f = n.signalR.isDisconnecting, i = r.transports._logic;
		r.transports.longPolling = {
			name             :"longPolling", supportsKeepAlive:function () {
				return !1
			}, reconnectDelay:3e3, start:function ( o, s, h ) {
				var a = this, v = function () {
					v = n.noop;
					o.log( "LongPolling connected." );
					s ? s() : o.log( "WARNING! The client received an init message after reconnecting." )
				}, y  = function ( n ) {
					return h( n ) ? (o.log( "LongPolling failed to connect." ), !0) : !1
				}, c  = o._, l = 0, p = function ( i ) {
					t.clearTimeout( c.reconnectTimeoutId );
					c.reconnectTimeoutId = null;
					e( i, r.connectionState.reconnecting, r.connectionState.connected ) === !0 && (i.log( "Raising the reconnect event" ), n( i ).triggerHandler( u.onReconnect ))
				}, w  = 36e5;
				o.pollXhr && (o.log( "Polling xhr requests already exists, aborting." ), o.stop());
				o.messageId          = null;
				c.reconnectTimeoutId = null;
				c.pollTimeoutId      = t.setTimeout(
					function () {
						(function e( s, h ) {
							var g = s.messageId, nt = g === null, k = !nt, tt = !h, d = i.getUrl( s, a.name, k, tt, !0 ), b = {};
							(s.messageId && (b.messageId = s.messageId), s.groupsToken && (b.groupsToken = s.groupsToken), f( s ) !== !0) && (o.log( "Opening long polling request to '" + d + "'." ), s.pollXhr = i.ajax(
								o, {
									xhrFields                                                                                          :{
										onprogress:function () {
											i.markLastMessage( o )
										}
									}, url:d, type:"POST", contentType:r._.defaultContentType, data:b, timeout:o._.pollTimeout, success:function ( r ) {
										var h, w = 0, u, a;
										o.log( "Long poll complete." );
										l = 0;
										try {
											h = o._parseResponse( r )
										}
										catch ( b ) {
											i.handleParseFailure( s, r, b, y, s.pollXhr );
											return
										}
										(c.reconnectTimeoutId !== null && p( s ), h && (u = i.maximizePersistentResponse( h )), i.processMessages( s, h, v ), u && n.type( u.LongPollDelay ) === "number" && (w = u.LongPollDelay), f( s ) !== !0) && (a = u && u.ShouldReconnect, !a || i.ensureReconnectingState( s )) && (w > 0 ? c.pollTimeoutId = t.setTimeout(
											function () {
												e( s, a )
											}, w
										) : e( s, a ))
									}, error                                                                                           :function ( f, h ) {
										var v = r._.transportError( r.resources.longPollFailed, o.transport, f, s.pollXhr );
										if ( t.clearTimeout( c.reconnectTimeoutId ), c.reconnectTimeoutId = null, h === "abort" ) {
											o.log( "Aborted xhr request." );
											return
										}
										if ( !y( v ) ) {
											if ( l++, o.state !== r.connectionState.reconnecting && (o.log( "An error occurred using longPolling. Status = " + h + ".  Response = " + f.responseText + "." ), n( s ).triggerHandler( u.onError, [v] )), (o.state === r.connectionState.connected || o.state === r.connectionState.reconnecting) && !i.verifyLastActive( o ) )return;
											if ( !i.ensureReconnectingState( s ) )return;
											c.pollTimeoutId = t.setTimeout(
												function () {
													e( s, !0 )
												}, a.reconnectDelay
											)
										}
									}
								}
							), k && h === !0 && (c.reconnectTimeoutId = t.setTimeout(
								function () {
									p( s )
								}, Math.min( 1e3 * (Math.pow( 2, l ) - 1), w )
							)))
						})( o )
					}, 250
				)
			}, lostConnection:function ( n ) {
				n.pollXhr && n.pollXhr.abort( "lostConnection" )
			}, send          :function ( n, t ) {
				i.ajaxSend( n, t )
			}, stop          :function ( n ) {
				t.clearTimeout( n._.pollTimeoutId );
				t.clearTimeout( n._.reconnectTimeoutId );
				delete n._.pollTimeoutId;
				delete n._.reconnectTimeoutId;
				n.pollXhr && (n.pollXhr.abort(), n.pollXhr = null, delete n.pollXhr)
			}, abort         :function ( n, t ) {
				i.ajaxAbort( n, t )
			}
		}
	}( jQuery, window ), function ( n ) {
		function r( n ) {
			return n + e
		}

		function s( n, t, i ) {
			for ( var f = n.length, u = [], r = 0 ; r < f ; r += 1 )n.hasOwnProperty( r ) && (u[r] = t.call( i, n[r], r, n ));
			return u
		}

		function h( t ) {
			return n.isFunction( t ) ? null : n.type( t ) === "undefined" ? null : t
		}

		function u( n ) {
			for ( var t in n )if ( n.hasOwnProperty( t ) )return !0;
			return !1
		}

		function f( n, t ) {
			var i = n._.invocationCallbacks, r, f;
			u( i ) && n.log( "Clearing hub invocation callbacks with error: " + t + "." );
			n._.invocationCallbackId = 0;
			delete n._.invocationCallbacks;
			n._.invocationCallbacks = {};
			for ( f in i )r = i[f], r.method.call( r.scope, { E:t } )
		}

		function i( n, t ) {
			return new i.fn.init( n, t )
		}

		function t( i, r ) {
			var u = { qs:null, logging:!1, useDefaultPath:!0 };
			return n.extend( u, r ), (!i || u.useDefaultPath) && (i = (i || "") + "/signalr"), new t.fn.init( i, u )
		}

		var e = ".hubProxy", o = n.signalR;
		i.fn  = i.prototype = {
			init                   :function ( n, t ) {
				this.state      = {};
				this.connection = n;
				this.hubName    = t;
				this._          = { callbackMap:{} }
			}, constructor         :i, hasSubscriptions:function () {
				return u( this._.callbackMap )
			}, on                  :function ( t, i ) {
				var u = this, f = u._.callbackMap;
				return t = t.toLowerCase(), f[t] || (f[t] = {}), f[t][i] = function ( n, t ) {
					i.apply( u, t )
				}, n( u ).bind( r( t ), f[t][i] ), u
			}, off                 :function ( t, i ) {
				var e = this, o = e._.callbackMap, f;
				return t = t.toLowerCase(), f = o[t], f && (f[i] ? (n( e ).unbind( r( t ), f[i] ), delete f[i], u( f ) || delete o[t]) : i || (n( e ).unbind( r( t ) ), delete o[t])), e
			}, invoke              :function ( t ) {
				var i = this, r = i.connection, e = n.makeArray( arguments ).slice( 1 ), c = s( e, h ), f = { H:i.hubName, M:t, A:c, I:r._.invocationCallbackId }, u = n.Deferred(), l = function ( f ) {
					var e = i._maximizeHubResponse( f ), h, s;
					n.extend( i.state, e.State );
					e.Progress ? u.notifyWith ? u.notifyWith( i, [e.Progress.Data] ) : r._.progressjQueryVersionLogged || (r.log( "A hub method invocation progress update was received but the version of jQuery in use (" + n.prototype.jquery + ") does not support progress updates. Upgrade to jQuery 1.7+ to receive progress notifications." ), r._.progressjQueryVersionLogged = !0) : e.Error ? (e.StackTrace && r.log( e.Error + "\n" + e.StackTrace + "." ), h = e.IsHubException ? "HubException" : "Exception", s = o._.error( e.Error, h ), s.data = e.ErrorData, r.log( i.hubName + "." + t + " failed to execute. Error: " + s.message ), u.rejectWith( i, [s] )) : (r.log( "Invoked " + i.hubName + "." + t ), u.resolveWith( i, [e.Result] ))
				};
				return r._.invocationCallbacks[r._.invocationCallbackId.toString()] = { scope:i, method:l }, r._.invocationCallbackId += 1, n.isEmptyObject( i.state ) || (f.S = i.state), r.log( "Invoking " + i.hubName + "." + t ), r.send( f ), u.promise()
			}, _maximizeHubResponse:function ( n ) {
				return { State:n.S, Result:n.R, Progress:n.P ? { Id:n.P.I, Data:n.P.D } : null, Id:n.I, IsHubException:n.H, Error:n.E, StackTrace:n.T, ErrorData:n.D }
			}
		};
		i.fn.init.prototype = i.fn;
		t.fn                = t.prototype = n.connection();
		t.fn.init                         = function ( t, i ) {
			var e = { qs:null, logging:!1, useDefaultPath:!0 }, u = this;
			n.extend( e, i );
			n.signalR.fn.init.call( u, t, e.qs, e.logging );
			u.proxies                = {};
			u._.invocationCallbackId = 0;
			u._.invocationCallbacks  = {};
			u.received(
				function ( t ) {
					var f, o, e, i, s, h;
					t && (typeof t.P != "undefined" ? (e = t.P.I.toString(), i = u._.invocationCallbacks[e], i && i.method.call( i.scope, t )) : typeof t.I != "undefined" ? (e = t.I.toString(), i = u._.invocationCallbacks[e], i && (u._.invocationCallbacks[e] = null, delete u._.invocationCallbacks[e], i.method.call( i.scope, t ))) : (f = this._maximizeClientHubInvocation( t ), u.log( "Triggering client hub event '" + f.Method + "' on hub '" + f.Hub + "'." ), s = f.Hub.toLowerCase(), h = f.Method.toLowerCase(), o = this.proxies[s], n.extend( o.state, f.State ), n( o )
						.triggerHandler( r( h ), [f.Args] )))
				}
			);
			u.error(
				function ( n, t ) {
					var i, r;
					t && (i = t.I, r = u._.invocationCallbacks[i], r && (u._.invocationCallbacks[i] = null, delete u._.invocationCallbacks[i], r.method.call( r.scope, { E:n } )))
				}
			);
			u.reconnecting(
				function () {
					u.transport && u.transport.name === "webSockets" && f( u, "Connection started reconnecting before invocation result was received." )
				}
			);
			u.disconnected(
				function () {
					f( u, "Connection was disconnected before invocation result was received." )
				}
			)
		};
		t.fn._maximizeClientHubInvocation = function ( n ) {
			return { Hub:n.H, Method:n.M, Args:n.A, State:n.S }
		};
		t.fn._registerSubscribedHubs      = function () {
			var t = this;
			t._subscribedToHubs || (t._subscribedToHubs = !0, t.starting(
				function () {
					var i = [];
					n.each(
						t.proxies, function ( n ) {
							this.hasSubscriptions() && (i.push( { name:n } ), t.log( "Client subscribed to hub '" + n + "'." ))
						}
					);
					i.length === 0 && t.log( "No hubs have been subscribed to.  The client will not receive data from hubs.  To fix, declare at least one client side function prior to connection start for each hub you wish to subscribe to." );
					t.data = t.json.stringify( i )
				}
			))
		};
		t.fn.createHubProxy               = function ( n ) {
			n     = n.toLowerCase();
			var t = this.proxies[n];
			return t || (t = i( this, n ), this.proxies[n] = t), this._registerSubscribedHubs(), t
		};
		t.fn.init.prototype               = t.fn;
		n.hubConnection                   = t
	}( jQuery, window ), function ( n ) {
		n.signalR.version = "2.2.2"
	}( jQuery );

	console.warn( 'jQuery', jQuery.fn.jquery );

	window.$ = oldJQuery;
	if ( oldJQuery ) {
		console.warn( 'oldJQuery', oldJQuery.fn.jquery );
	}

	/**
	 * Inicia plugin
	 */
	init();	//exporta metodos públicos
	return exports;

};