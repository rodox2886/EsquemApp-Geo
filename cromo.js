var WEB_VERSION = "Beta5";
window.mapasCromo=[];

var printNodesCount = {};

var CromoMap = function(idMap, options){
	if (!options){
		console.error( "No esta declarado option");
		return null;
	}else{
		if(!options.div){
			console.error( "No esta declarado div");
			return null;
		} else if(!(options.div instanceof HTMLElement) || options.div.tagName != "DIV"){
			console.error( "La propiedad div no es valida");
			return null;
		}else{
			if(!idMap){
				console.error( "El id no puede quedar nulo");
				return null;
			}else if(typeof idMap !== "string" ){
				console.error("El id es inválido");
				return null;
			}else{
				//	lo comento porque falla en idms
//				if(window.mapasCromo.includes(idMap)){
//					console.error("Ya existe un mapa con el mismo ID");
//					return null;
//				}
				window.mapasCromo.push(idMap);
				if(!options.dataDiv){
					console.warn("La propiedad dataDiv no está definida")
				}else if(!(options.dataDiv instanceof HTMLElement)){
					console.warn("La propiedad dataDiv no es valida")
				}
			}
		}
	}
	var id;
	var cromoClient;
	var cromoWebSocket;
	var initRenderData;
	var channel = new DefaultChannel(this);	//se define un canal default para llamados a zoom antes de init
	var layers_array = [];
	var editionTypes = [];
	var colors_array = [];
	var tools_array = [];
	var onAddTool = null;//en una ƒ
	var exportModes = [];
	var importModes = [];
	var visualizationChecks = [];
	var mapModes = [];
	var visualizationModes = [];
	var visualizationSwitch = [];
	var filterclasses  = [];
	var ex_class = {};
	var map_status = {map_initiliazed: false};
	var iframe;
	var recorridosExp = 0;
	let dataPanel, areasPanel, dataTable, layersPanel, externalLayersPanel, spacialPanel;
	let panels = [];
	var win;
	let _history = [];
	let _history_ext = [];
	let time = 'now';
	let userInfo = {};
	let mapOpacity = 0;	//	opacidad con respecto a google maps
	let busySign;
	var modified = 0;
	var restorePickedObjStatus = function(){
		cromoClient.pickObjects = [];
		cromoClient.pickedBssObjects = [];
		cromoClient.picking = false;
		cromoClient.pickingElemType = [];
		cromoClient.pickingClass = [];
		cromoClient.pickingNetType = [];
		cromoClient.ObjectsRequest = null;
	}
	
	let lastCData = {};
	let lastPluginInfo = {};
	
	let initialSettings = {}; // Seteos guardados en localStorage
	
	// Valores iniciales hasta que carga Bookmarks
	this.bookmarks = {
		bookmarksEnabled: false,
		addEnabled: false,
		tooltipText: 'Aún no cargó la función de Bookmarks.'
	}
	
	this.getMapContent = function(){
		return options.div;
	}
	this.getPickObjectsRequest = function(){
		return cromoClient.pickObjectsRequest;
	}
	this.getPickingElemType = function(){
		return cromoClient.pickingElemType;
	}
	
	this.getPickingClass = function(){
		return cromoClient.pickingClass;
	}
	
	this.getPickingNetType = function(){
		return cromoClient.pickingNetType;
	}
	
	this.getPickedObjs = function(){
		return cromoClient.pickObjects;
	}
	
	this.getExcludedId = function(){
//		if(pickObjectsRequest.excludedId){
			return cromoClient.pickObjectsRequest.excludedId
//		}
	}
	
	this.getPickedBssObjects = function(){
		return cromoClient.pickedBssObjects;
	}

	this.getGeographicData = function (obj) {
		return Config.get_data(obj, obj.clazz);
	}

	this.getAreaNames = function () {
		return AREANAMES;
	}

	this.getClasses = function () {
		return CLASSES;
	}
	
	this.getObjectData = function(id){
		
		return channel.request({
			type:"getObjectData",
			id: id
		});
	}
	
	this.pickPoint = function(msg){
		let promise = new Promise(function(resolve, reject){
			cromoClient.pickPointRequest = msg;
			channel.addListener("click_on_background", addPickPointEvent);
			channel.request({
				type: "pickPoint"
			});
			
			aviso(
					msg.title,
					msg.body,
					true,
					resolve,
					"Aceptar",
					reject,
					"Cancelar"
					);
		});
		return promise.then(() => {
			channel.removeListener("click_on_background", addPickPointEvent);
			channel.request({
				type: "pickPoint"
			});
			return cromoClient.getPickedPoint();
		})
		.catch(() => {
			channel.removeListener("click_on_background", addPickPointEvent);
			channel.request({
				type: "pickPoint"
			});
			return "operacion cancelada";
		});
	}
	this.pickObjects = function(msg){
		_self=this;
		var promise = new Promise(function(resolve, reject){
			let webSocket = _self.getWebSocket();
			webSocket.request = msg;
			cromoClient.pickObjectsRequest = msg;
			
			if(msg.elementType != undefined){
				cromoClient.pickingElemType = msg.elementType;
			}
			if(msg.classIds){
				cromoClient.pickingClass = msg.classIds;				
			}
			if(msg.netTypes){
				cromoClient.pickingNetType = msg.netTypes;
			}
			var elementType;
			if (!msg.elementType) {
				elementType = 0;
			}
			cromoClient.picking = true;
			aviso(
				msg.body,
				addPickedObjectsToMsg(null,webSocket),
				true,
				resolve,
				"Aceptar",
				reject,
				"Cancelar"
			);
			get('aviso_action').disabled = true;
		});
		
		return promise.then(() => {
			 cromoClient.pickedObjects;
			if(cromoClient.pickObjects.length > 0)
				cromoClient.pickedObjects = cromoClient.pickObjects;
			else
				cromoClient.pickedObjects = cromoClient.pickedBssObjects;
			cromoClient.pickObjects = [];
			cromoClient.pickedBssObjects = [];
			cromoClient.picking = false;
			cromoClient.pickingElemType = [];
			cromoClient.pickingClass = [];
			cromoClient.pickingNetType = [];
			cromoClient.ObjectsRequest = null;
			return cromoClient.pickedObjects;
			})
			.catch(e => {
				restorePickedObjStatus();
				if(form){
					
					$("#new_service_window").css("display","block")
				}
				return Promise.reject("operacion cancelada");
			});
	};
	
	this.highlightNetElements = function(elems_list){
		return channel.request({
			type:"highlightNetElements",
			data: {
				elems_list
			}
		});
	}

	this.openCromoFoWithOE = (payload) => {
		return channel.request({
			type:"openCromoFoWithOE",
			data: payload
		});
	}
	
	this.pickingOn = function(){
		return cromoClient.picking;
	}
	
	this.setPicking = function(value){
		cromoClient.picking = value;
	}
	
	//	estados de opciones
	let currentColor, currentVisualizationMode, currentVisualizationCheck = [], currentExternalCartography, currentPanel, projectModes = [];
	
	function addPickPointEvent(event_data){
		cromoClient.addPickedPoint(event_data);
	}
	
	function createLeftPanel(externalDiv, mapDiv, cromoClient){
		let externalDivElement = $(externalDiv);
		dataTable = document.createElement('table');
		dataTable.id = 'table-datos';
		dataTable.classList.value = "cromo";
		dataPanel = document.createElement('div');
		dataPanel.id = "panel-datos";
		dataPanel.classList.value = 'cromo panel';
		dataPanel.appendChild(dataTable);
		let position = externalDivElement.position()
		$(dataPanel).css({visibility: 'visible', overflow:'auto', left: position.left, top:position.top, height:$(externalDiv).height().toString(), width:externalDivElement.width() })
		areasPanel = createAreasPanel();
		currentPanel = areasPanel;
		panels.push(areasPanel);
		layersPanel = createLayersPanel.call(this, externalDivElement, mapDiv, cromoClient);
		panels.push(layersPanel);
		externalLayersPanel = createExternalLayersPanel.call(this, externalDivElement, mapDiv );
		panels.push(externalLayersPanel);
		spacialPanel = createSpatialPanel();
		panels.push(spacialPanel);
		editionPanel = createEditionPanel();
		panels.push(editionPanel);
		bookmarksPanel = Bookmarks.createBookmarksPanel(externalDivElement, this);
		panels.push(bookmarksPanel)
		
		externalDiv.appendChild(dataPanel);
		panels.push(dataPanel);
	}
	function findByValue(list, value){
		return list.find(elem => elem.value == value);
	}
	
	function getAuthInfo(options) {
		let u = '';
		let p = '';
		if (options.userId) {
			u = options.userId;
			p = options.password;
		} else {
			let aI = sessionStorage.getItem('aI');
			if (aI) {
				let ap = atob(aI);
				if (ap) {
					let s = ap.split(':');
					if (s.length) {
						u = s[0];
						p = s[1];
					}
				}
			}
		}
		let ai = {'user':u, 'password':p};
		let t = getToken();
		if(t){
			ai['accessToken'] = t;
		}	
		return ai;
	}
	
	function removeAuthInfo() {
		let aI = sessionStorage.getItem('aI');
		if (aI) {
			sessionStorage.removeItem('aI');
		}
	}

	function completePluginsInit(all_plugins_loaded, self) {
		all_plugins_loaded.then(promises => promises.forEach(promiseResult => {
			if (promiseResult.status == 'fulfilled') {
				let plugin = PLUGINS[promiseResult.value];
				if (plugin.hasOwnProperty("inited")) {
					try {
						plugin.inited(self, Config, cromoClient.config);
					} catch (e) {
						console.warn("plugin " + plugin.getId() + " - error en inited: ", e);
					}
				}
				if (plugin.hasOwnProperty("setAuthInfo")) {
					try {
						plugin.setAuthInfo(getAuthInfo(options));
					} catch (e) {
						console.warn("plugin " + plugin.getId() + " - error en setAuthInfo: ", e);
					}
				}
			}
		}));

	}
	function startMap(self, resolve){
		var end = (new Date()).getTime();

		var all_plugins_loaded = Promise.allSettled(plugins_loaded);
		completePluginsInit(all_plugins_loaded, self);
		removeAuthInfo();

		let initialSubscribers = channel.getSubscribers();
		channel = messageChannel(idMap);
		channel.setSubscribers(initialSubscribers);
		if(options.dataDiv){
			createLeftPanel.call(self, options.dataDiv, options.div, cromoClient);	//panel lateral para datos/capas/areas
		}
		setUp(all_plugins_loaded, self, cromoClient);

		createIframeMap(self, initRenderData);

		channel.addListener("load", 
			(event) => {
				console.log("cromo map loaded");
				colors_array = event.colores_array;
				visualizationSwitch = event.visualizationSwitch_array;

				initialSettings.lastPanel = read_setting("lastPanel");
				resolve();
			});

		// Actualiza estado de cromoClient con la nueva info en el mapa
		channel.addListener("mapMoved", (data) =>{
			map_status = Object.assign(map_status, data);
			map_status.map_initiliazed = true;
			NETTYPES = data.nettypes;
			filterclasses = data.filter;
			lastCData = data.cdata;
			lastPluginInfo = data.plugins_info;
			// actualiza estado default de cada capa por el nuevo zoom del mapa
			let cData = data.cdata || [];
			cromoClient.getLayersComponent().applyMapStatusToLayersModel(cData, data.plugins_info);
			// si el panel de capas está visible, actualiza totales
			if (self.getCurrentPanel() && self.getCurrentPanel().id == "panel-capas") {
				cromoClient.getLayersComponent().updateLayersPanel();
			}
		});
		channel.addListener("dblclick_on_object",objectDblClicked =>{
			//console.log(objectDblClicked,"dblclick_on_object");
		})
		channel.addListener("initialFetchRendered", () => {
			restoreTime(self)
			.then( () => {
				restoreCurrentPanel(self);
				restoreDataPanel(self);
				rememberDefaultSettings();
			} );
		});
	    channel.addListener("aviso",error =>{
	    	aviso("Atención",error)
		});


		channel.addListener("click_on_object", objectClicked => {
			map_status["object"] = objectClicked.object;
			map_status["lastClicked"] = "object";
			let notInitialFetch = !(objectClicked.type && objectClicked.type == "initialFetch"); 
			if (notInitialFetch) {
				let value = {clicked:"object", id: objectClicked.object.id, pointData: objectClicked.clickedPointData};
				remember_setting("lastClicked", JSON.stringify(value));
			}
			cromoClient.clickPicked(objectClicked.object,self.getWebSocket())
			if (options.dataDiv) {
				self.showData();
				update_data_panel(objectClicked.object, objectClicked.clazz, self);
			}

		});
		
		channel.addListener("unselect_on_object", () => {
			$('.fa-line-chart').click();
			if (
				typeof update_btn_recorridos === "function" &&
				typeof update_btn_operar === "function"
			) {
				update_btn_recorridos();
				update_btn_operar();
			}
			OBJECT = {};
			clear_data_panel(self);
			map_status["object"] = null;
			let value = {clicked:"none"};
			remember_setting("lastClicked", JSON.stringify(value));
		});
		
		channel.addListener("inner_window_closed", innerWindow => {
			//console.log(innerWindow.objectId);
		});
		channel.addListener("inner_window_pinned", innerWindow => {
			//console.log(innerWindow);
		});
		channel.addListener("inner_window_moved", innerWindow => {
			//console.log(innerWindow);
		});
		channel.addListener("domicilioTecnico", objectClicked => {	
			sessionStorage.setItem("domTecnico",objectClicked.domTec)

		});


		channel.addListener("click_nnss", objectClicked => {

			if(objectClicked.nnss == true){



				setTimeout(function(){$("#btn-operar").addClass("not-active-2");
				$("#table-datos").find("tbody").find("tr").find("a").addClass("not-active-2")
				$("#copiarPortapapeles").removeClass("not-active-2")
				$(".copiarPortapapeles").removeClass("not-active-2")

				},300)

			}

		});

		channel.addListener("EDIT", data => {	
			EDIT = data.edit
			proyId = data.id
			E_NNSS = data.nnss
		});

		channel.addListener("EDIT2", data => {	

			if(data.edit2){
				
				if(data.borrar == "obj"){
					
					EDIT.objs.splice( data.edit2, 1 )
					
				
				}else{
					
					EDIT.objs = data.edit2
				}

				

			}


			if(data.borrar == "si"){


				borrarCuentaNodo = $(sessionStorage.getItem("nodoVincular"))
				borrarCuentaPadre = $(sessionStorage.getItem("padreNodoVincular"))

				borrarCuentaNodo.text("0/1")
				borrarCuentaPadre.text("0/1")
			}


		});


		channel.addListener("printNodesCount", data => {	
			printNodesCount = data.printNodesCount;
		});

		channel.addListener("habilitarConectores", data => {	

			var nodes = {}
			cromoClient.habilitarConectores(nodes)
		});

		channel.addListener("deshabilitarConectores", data => {	

			var nodes = {}
			cromoClient.deshabilitarConectores(nodes)

			if(data.deshabilitarConectores == "cerrarPanel"){

				document.getElementById("showData").click()
				$("#btn-NNSS").hide();
			}

		});


		channel.addListener("close_nnss", objectClicked => {

			
			$('#mnu-clientes-option').removeClass('not-active-2');
			$('#show-map-option').removeClass('not-active-2');
			$('#eje-temporal-option').removeClass('not-active-2');
			$('#mnu-export-option').removeClass('not-active-2');
			
			if(objectClicked.disable == true){

				$("#new_service_window_container *").prop('disabled',true)
				$("#new-service-order-type-id").prop('disabled',false)
				$("#new-service-order-type-id option").prop('disabled',false)
				$("#new-service-fare-id").prop('disabled',false)
				$("#new-service-fare-id option").prop('disabled',false)
				
				$("#selVereda").css("display","none")
				$("#selVecino").css("display","none")
				$(".selVereda2").css("display","none")
				$("#btn-NNSS").hide();

			}

		});
		channel.addListener("areaSeleccionada", data => { 
			SELECTED_AREAS=data.SELECTED_AREAS;
			refresh_combo(data.SELECTED_AREAS);
		});
		channel.addListener("hover_on_object", objectClicked => {
		});
		channel.addListener("open_data_window", objectClicked => {
			self.open_data_window(objectClicked.id,this,true,true,true);
		});
		channel.addListener("send_object_request", response => {
			let webSocket;
			if(typeof this.getWebSocket === 'function'){
				webSocket = this.getWebSocket();
			}
			var clazz = CLASSES[response.class];
			if (webSocket && webSocket.request) {
				var picking_classIds = webSocket.request.classIds;
				if (!picking_classIds) {
					picking_classIds = [];
				}
				var picking_netTypes = webSocket.request.netTypes;
				if (!picking_netTypes) {
					picking_netTypes = [];
				}
				var skipMaxVal = false;
				if (webSocket.request.max === undefined || webSocket.request.max == 0){
					skipMaxVal = true;
				}
				if (self.pickingOn() &&
						webSocket.request.elementType == 0 && (skipMaxVal ||
								webSocket.pickedObjects.length < webSocket.request.max) &&
								(!picking_classIds.length ||
										picking_classIds.indexOf(response.class) != -1) &&
										(!picking_netTypes.length ||
												picking_netTypes.indexOf(clazz.net) != -1)
				) {
					addPickedObject(response,webSocket);
				}
			}
			update_data_panel(response, clazz, self);
		});
		channel.addListener("activeSimulation", data => {
			if(data.active){
				$("#g_tabla_modo_switch_0").removeClass("not-active-2");
			}else{
				$("#g_tabla_modo_switch_0").addClass("not-active-2");
			}
		});
		channel.addListener("change_mode_simulation", data => {
			simular_operaciones(self,data.simulacion,cromoClient);
			simulation_details=[];
			if(data.simulacion)
				minimizeGrid("sim_oper_window","sim_oper_window_toggle")
		});
		channel.addListener("change_theme", onThemeChange);
		channel.addListener("error", error_msg => aviso("Atención", error_msg));
		channel.addListener("click_on_background", function(data){
			handle_background_click(data, self);
			map_status["backgroundPoint"] = data.clickedPointData;
			map_status["lastClicked"] = "backgroundPoint";
		});
		channel.addListener("oms_click", object =>{
			select_elements_badge = object.badge;
			if(object.aviso){
				aviso(object.titulo,object.msg,object.notAnimate,null,null,object.cancelLabel)
			}else{
				self.showData();
				show_element_information(object.obj,object.elem_type,object.elem_types,self);
			}
		});
		channel.addListener("orden_de_Trabajo_click", object =>{
			select_elements_badge = object.badge;
			if(object.aviso){
				aviso(object.titulo,object.msg,object.notAnimate,null,null,object.cancelLabel)
			}else{
				self.showData();
				show_element_information_orden_de_Trabajo(object.obj,object.elem_type,object.elem_types,self);
			}
		});
		channel.addListener("gmaps_initialized", () => {
			map_status["gmaps_initialized"] = true;
		});
		channel.addListener("unblockMenu", () => {
			unblockMenuActions();
		})
		channel.addListener("modified_value_nnss", modified_value => {
			modified = modified_value.modified;
		})
		channel.addListener("recorrido", recorrido => {
			let verificado = false;
			if (recorrido.hasOwnProperty("verificado") &&
				 typeof recorrido.verificado == 'boolean') {
				verificado = recorrido.verificado;
			} 
			switch(recorrido.tipo) {
				case "upstream":
					self.upstream(verificado);
				break;
				case "downstream":
					self.downstream(verificado);
				break;
				case "connected":
					self.connected(verificado);
				break;
				case "goToSrc":
					self.goToSrc();
				break;
				case "feeders":
					self.feeders(verificado);
				break;
				default:
					console.log("Tipo de recorrido no definido");
				break;
			}
		});
		channel.addListener("clear_data_panel", () => {
			clear_data_panel(self);
		});
		channel.addListener("disableFailedExternalLayer", (layerId) => {
			capasExternasClientPlugin.selectLayer(layerId);
			let layerCheck = '#layer-'+layerId;
			$(layerCheck)[0].checked = false;
			$(layerCheck).attr('disabled', true);
			
		});
		channel.addListener("open_caminos", () => {
			if(self.isCromoRedFrontendEnabled)
				cromoClient.getCromoRedCaminosComponent().show(self);
		});
		if(userLogged)
			self.setUserLogged(userLogged);

		// Si está habilitado el plugin de capas externas se inicializa
		setTimeout( () => {
			if (typeof capasExternasClientPlugin !== "undefined") {
				capasExternasClientPlugin.init(channel);
			}
		}, 500);
		
	}
	
	// Funciones de re-carga de estado inicial de la página
	function restoreTime(self) {
		let savedTime = read_setting("time");
		if (savedTime) {
			return self.setTime(savedTime, true);
		} else {
			return Promise.resolve();
		}
	}
	function restoreCurrentPanel(self) {
		let lastPanelId = initialSettings.lastPanel;
		if (lastPanelId) {
			switch (lastPanelId) {
				case "panel-capas":
					self.showLayers();
					break;
				case "external-layer-panel":
					self.showExternalLayers();
					break;
				case "cromo-inbox-container":
					self.showCromoInbox();
					break;
				case "cromo-red-frontend-container":
					self.showCaminos({fromLoad:true});
					break;
				default: // los demás paneles ya están cargados
					let lastPanel = self.getPanels().find( p => p.id == lastPanelId);
					if (lastPanel) {
						self.changePanel(lastPanel);	
					} else {
						console.warn("No se encuentra el último panel recordado: ", lastPanelId);
					}
			}
		}
	}
	function restoreDataPanel(self) {
		let dwStr = read_setting("dw_opened");
		if (dwStr) {
			let dw = JSON.parse(dwStr);
			if (dw && dw.oid) {
				let tabNumber = read_setting("dw_opened_tab");
				self.open_data_window(dw.oid, tabNumber, dw.openWindow, dw.fromDW, dw.focus);
			}
		}
	}
	function rememberDefaultSettings() {
		// setea los estados default que no están recordados
		rememberDefaultSetting("attrGridsSelectType", "row");
		rememberDefaultSetting("capasStates", "[]");
		rememberDefaultSetting("checkVisualizacion");
		rememberDefaultSetting("lastClicked", "{\"clicked\":\"none\"}");
		rememberDefaultSetting("mapMode", "{\"name\":\"Cromo únicamente\",\"opacity\":\"V\"}");
		rememberDefaultSetting("modoVisualizacion", "Operacional");
		rememberDefaultSetting("recorridos", "[]");
		rememberDefaultSetting("spatialStates", "[]");
		rememberDefaultSetting("time", "now");
	}
	function rememberDefaultSetting(name, defaultValue="") {
		let options = {sessionOnly: true};
		let valueStr = read_setting(name, options);
		if (!valueStr) 
			remember_setting(name, defaultValue, options);
	}
	// fin de funciones estado inicial de la página
	
	function get_browser_info(){
	    var ua=navigator.userAgent,tem,
	        M=ua.match(/(opera|chrome|safari|firefox|msie|edge|trident(?=\/))\/?\s*(\d+)/i) || []; 
	    if(/trident/i.test(M[1])){
	        tem=/\brv[ :]+(\d+)/g.exec(ua) || []; 
	        return {name:'ie',version:(tem[1]||'')};
	    }   
	    if(M[1]==='Chrome'){
	        tem=ua.match(/\bOPR\/(\d+)/)
	        if(tem!=null)   {return {name:'opera', version:tem[1]};}
	        tem=ua.match(/\bEdge\/(\d+)/)
	        if(tem!=null)   {return {name:'edge', version:tem[1]};}
	    }
	    M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	    if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
	    return {
	      name: M[0].toLowerCase(),
	      version: M[1]
	    };
	}
	
	
	var supportBro = get_browser_info()
	
	function createIframeMap(self, coordinates){
		let div = options.div;
		iframe = document.createElement('iframe');
		let src = `${URLBASE1.origin}/mapa.html?mapa_id=${idMap}&meta_version=${_META_VERSION}`;
		console.log("Cargando mapa de: " + src);
		iframe.src = src;
		iframe.setAttribute("width", "100%");
		iframe.setAttribute("name", "mapa_iframe");

		if(supportBro.name === "firefox"){

		iframe.setAttribute("height", "580px")	
		}else{
			iframe.setAttribute("height", "100%")	
			
		}
		div.appendChild(iframe);
	    busySign = createBusySign(div);
		let msg = coordinates? coordinates:'init';
		iframe.addEventListener("load", () =>{
			setInitialMapOptions(self);
			var spatialStates = setInitialMapOptions_spacial();
			iframe.contentWindow.postMessage({msg,userLogged,userLoggedEnv,spatialStates,AREANAMES,STREETS}, '*', [channel.port2]);
		});
	}
	
	function onThemeChange(data){
	    for (var k=0;k<document.styleSheets.length;k++) {
	    	try{
	            var sheet= document.styleSheets[k];
	            var rules= 'cssRules' in sheet ? sheet.cssRules : sheet.rules; // IE compatibility
	            for (var i=0;rules && i<rules.length;i++) {
	                if (rules[i].selectorText=='.f5-color') {
	                    rules[i].style.backgroundColor=data.background_theme_color.bg;
	                    rules[i].style.color=data.background_theme_color.color;
	                }
	            }
	    	} catch(e){
	    		console.log("can't acces css rules");
	    	}
	    }
		
		let color = data.color;
		var arr = document.getElementsByClassName('fa-map-marker');
		for (var i=0;i<arr.length;i++) {
			arr[i].style.color=color;
		};
		var arr = document.getElementsByClassName('fa-street-view f5-color-bg');
		for (var i=0;i<arr.length;i++) {
			arr[i].style.color=color;
		};
	}
	
	this.getConfig = function(){
		return cromoClient.config;
	}
	this.getBusySign = function(){
		return busySign;
	}
	this.getUserInfo = function(){
		return userInfo;
	}
	this.setUserInfo = function(key, value){
		userInfo[key] = value;
	}
	this.getOpacity = function(){
		return channel.request({
			type:"getOpacity"
		});
	}
	this.getChannel = function(){
		return channel;
	}
	this.getTime = function(){
		return time;
	}
	this.getCurrentPanel = function(){
		return currentPanel;
	}
	this.getDataPanel = function(){
		return dataPanel;
	}
	this.addPanelEdicion = function(grupos_edicion){
		cromoClient.addPanelEdicion(grupos_edicion,this);
	}
	this.getLayersPanel = function(){
		return layersPanel;
	}
	this.getSpacialPanel = function(){
		return spacialPanel;
	}
	this.getBookmarksPanel = function(){
		return bookmarksPanel;
	}
	this.getEditionPanel = function(){
		return editionPanel;
	}
	this.getTramadoProvisorioPanel = function(){
		return tamadoProvisorioPanel;
	}
	this.getDataTable = function(){
		return dataTable;
	}
	this.getColors = function(){
		return colors_array;
	}
	this.getTools = function(){
		let tools = [];
		tools_array.forEach(data=>{tools.push(data.name)})
		return tools;
	}
	this.callTool = function(key){
		return tools_array.find(function(data){return data.name == key ||  data.key == key}).fun;
	}
	this.getCurrentColor = function(){
		return currentColor;
	}
	this.getElectricChain = function(id){
		return channel.request({
			type: "getElecticChain",
			data: id
		})
	}
	this.edt_msg = function(id){
		return channel.request({
			type: "edt_msg",
			data: id
		})
	}
	
	this.renderMap = function(id){
		return channel.request({
			type: "renderMap"
		})
	}
	
	this.editVincular = function(id){
		return channel.request({
			type: "editVincular",
			data:id
					
		})
	}
	
	this.editVincular2 = function(id){
		return channel.request({
			type: "editVincular2",
			data:id
					
		})
	}
	
	this.setSuministroNNSS = function(data){
		return channel.request({
			type: "setSuministroNNSS",
			data:data
		})
	}
	
	this.pushEdit = function(id){
		return channel.request({
			type: "pushEdit",
			data:id
					
		})
	}
	
	this.addEditionType = function(editionType){
		editionTypes.push(editionType);
	}
	this.getEditionTypes = function(){
		return editionTypes;
	}
	this.getEditionTypesArray = function(){
		var editionTypesArray = [];
		if(Config.nnssVersion == 1){
			editionTypesArray = [CURRENT_MAP.editNNSS, CURRENT_MAP.newServiceStartTypeOne];
		} else if (Config.nnssVersion == 2){
			editionTypesArray = [CURRENT_MAP.newServiceStartTypeOne, CURRENT_MAP.newTendidoProvisorio,CURRENT_MAP.cambioDomicilio];
		}
		return editionTypesArray;
	}
	this.addExportMode = function(exportMode){
		exportModes.push(exportMode);
	}
	this.getExportModes = function(){
		return exportModes;
	}
	this.addImportMode = function(importMode){
		importModes.push(importMode);
	}
	this.getImportModes = function(){
		return importModes;
	}
	this.exportar_cartografia = function(){
		exportar_cartografia()
	}
	this.exportar2 = function(){
		
		return channel.request({
			type: "exportarCromo",
		})
	}
	this.exportarCartografiaPantalla = function(){
		
		return channel.request({
			type: "exportarCartoPantalla",
		})
	}
	this.exportarCartografiaArea = function(){
		
		return channel.request({
			type: "exportarCartoArea",
		})
	}
	
	this.exportarCartografiaElemento = function(){
		
		return channel.request({
			type: "exportarCartoElemento",
		})
	}
	
	this.exportarCartografiaRed = function(){
		
		return channel.request({
			type: "exportarCartoRed",
		})
	}
	
	this.importarNovedades = function(){
		
		return channel.request({
			type: "importarNoved",
		})
	}
	
	this.setUserLogged = function(user){
		return channel.request({
			type: "setUserLogged",
			user : user
		})
	}
	
	this.carpetaArchivos = function(){
		
		return channel.request({
			type: "carpetaArchivos",	
		})
	}
	
	this.orden_de_trabajo = function(){
		
		return channel.request({
			type: "orden_de_trabajo",	
		})
	}
	this.orden_de_trabajo_lista = function(){
		
		return channel.request({
			type: "orden_de_trabajo_lista",	
		})
	}
	
	this.closeInnerPanels = function(){
		return channel.request({
			type: "closeInnerPanels",	
		})
	}
	this.openInnerPanels = function(objects){
		return channel.request({
			type: "openInnerPanels",
			data:objects
		})
	}
	this.agregarPaT = function(id,pi,pc,pv,time,fun){
		return callABMTemporales({
			type: "agregarPaT",
			id_con: id,
			pi:pi,
			pc:pc,
			pv:pv,
			time:time,
			fun:fun
		},this);
	}
	this.quitarPaT = function(id,time,fun){
		return callABMTemporales({
			type: "quitarPaT",
			id_con: id,
			time,
			fun:fun
		},this)
	}
	this.agregarTCT = function(id,time){
		return callABMTemporales({
			type: "agregarTCT",
			id_obj: id,
			time
		},this)
	}
	this.quitarTCT = function(id,time){
		return callABMTemporales({
			type: "quitarTCT",
			id_obj: id,
			time
		},this)
	}
	this.operar = function(id,cDate,timeout=0){
		return callABMTemporales({
			type:"operar",
			id_obj:id,
			cDate:cDate,
			timeout:timeout
		},this)
	}
	this.agregarGen = function(id, time, presetCoordinates){
		return callABMTemporales({
			type: "agregarGen",	
			id_elem :id,
			time,
			presetCoordinates
		},this)
	}
	this.quitarGen = function(temp_id,gen_req, time){
		return callABMTemporales({
			type: "quitarGen",	
			data: temp_id,
			gen_req:gen_req,
			time: time
		},this)
	}
	this.agregarPuenteAlVuelo = function( desde, hasta, time){
		return callABMTemporales({
			type: "agregarPuenteAlVuelo",
			desde,
			hasta,
			time
		},this)
	}
	this.quitarPuenteAlVuelo = function(id_temp, time,drill){
		return callABMTemporales({
			type: "quitarPuenteAlVuelo",
			id_temp,
			time,
			drill
		},this)
	}
	this.cambiarEstados = function(obj){
		return callABMTemporales({
			type: "cambiarEstados",
			obj
		},this)
	}
	this.agregarCC = function(id, pc, time){
		return callABMTemporales({
			type: "agregarCC",
			id_con:id,
			pc:pc,
			time:time
		},this);
	}
	this.quitarCC = function(id, time){
		return callABMTemporales({
			type: "quitarCC",
			id_con:id,
			time:time
		},this)
	}
	this.operarCromo = function(id){
	     confirmOperate(null,null,this,id)
	}
	this.addColor = function(colorObj){
		colors_array.push(colorObj);
	}
	this.addTool = function (toolObj){
		tools_array.push(toolObj);
		if(onAddTool)
			onAddTool(this);
	}
	this.setOnAddTool = function(fun){
		onAddTool = fun;
	}
	this.setColor = function(colorValue, doRender=true, notify=false){
		currentColor = colorValue;
		remember_setting("coloreo", colorValue);
		let type = doRender? "changeColor" : "initialChangeColor"
		return channel.request({
			type: type,
			data: {colorValue, notify}
		})
	}
	this.changeConfigFlag = function(name, value){
		return channel.request({
			type: "changeConfigFlag",
			data: {"name" : name, "value": value}
		})
	}
	this.getShowClasses=function(){
		return show_classes;
	}
	
	this.setShowClasses=function(class_id,value){
		return channel.request({
			type: "setShowClasses",
			data: {id:class_id,
			value: value}
		})
	}
	this.setHoverTime=function(time){
		remember_setting("hoverTime", time);
		return channel.request({
			type: "setHoverTime",
			data: {time:time}
		})
	}
	this.deleteShowClasses=function(class_id){
		return channel.request({
			type: "deleteShowClasses",
			data: {id:class_id}
		})
	}
	this.getAreasPanel = function(){
		return areasPanel;
	}
	this.getPanels = function(){
		return panels;
	}
	this.addPanel = function(panel){
		if (panel && panel.id) {
			panels.push(panel);
		} else {
			console.warn("addPanel: el panel no tiene id para guardarlo");
		};
	}
	this.changePanel = function(panel){
		if(options.dataDiv){
			$(options.dataDiv).empty();
			currentPanel = panel;
			cromoClient.on_change_panel(panel, this.getPanels(), options.dataDiv,options.div);
			remember_setting("lastPanel", panel.id);
		}
	}
	this.sendDisableEventStatus = function(){
		return cromoClient.sendDisableEventStatus();
	}
	this.sendEnableEventStatus = function(){
		return cromoClient.sendEnableEventStatus();
	}
	this.showLayers = function(){
		this.changePanel(this.getLayersPanel());
		plugins_execute("update_nodes", {layers_array, cdata:lastCData, plugins_info:lastPluginInfo}); // completa cantidades en capas de plugin
		cromoClient.getLayersComponent().updateLayersPanel();
	}
	this.showExternalLayers = function () {
		if (typeof capasExternasClientPlugin === "undefined") return
		capasExternasClientPlugin.getLayers();
		this.changePanel(capasExternasClientPlugin.render());
	}
	this.showExternalLayerElement = function () {
	    if (typeof capasExternasClientPlugin === "undefined") return
	    this.changePanel(capasExternasClientPlugin.render())
	}
    this.showCromoInbox = function () {
      let panel = plugin_execute('bandeja_entrada_client', 'show', {});
      if (panel) {
        this.changePanel(panel);
	  }
    };
	this.showData = function(){
		this.changePanel(this.getDataPanel());
	}
	this.showGeneralData = function(){
		this.changePanel(this.getAreasPanel());
		update_panel_areas(this);
	}
	this.showSpacial = function(){
		this.changePanel(this.getSpacialPanel());
	}
	this.showBookmarks = function(){
		this.changePanel(this.getBookmarksPanel());
	}
	this.showEdition = function(){
		this.changePanel(this.getEditionPanel());
	}
	this.showTramadoProvisorio = function(){
		this.changePanel(this.getTramadoProvisorioPanel());
	}
	this.showCaminos = function(options){
		let panel = cromoClient.getCromoRedCaminosComponent().show(this, options);
		if (panel) {
			this.changePanel(panel);
		}
	}
	this.open_data_window = function(oid, tabNumber,openWindow=false,fromDW = false,focus = false){
	  if(!openWindow && !fromDW){
		if (data_hist.length==0){
	      data_ant = _history[ _history.length -1 ];
	    }
		data_hist.push( oid );
	  }else{
	  	if (data_hist_ext.length==0){
	      data_ant = _history_ext[ _history_ext.length -1 ];
	    }
	    data_hist_ext.push( oid );		  
	  }  
		
	    get_window_data(oid,this)
	    .then(() => data_window_opened(OBJEC_WD,this,openWindow,fromDW,focus))
	    .then(() => {
			changeToTab(tabNumber);
			let value = {oid, openWindow, fromDW, focus};
			remember_setting("dw_opened", JSON.stringify(value), {sessionOnly:true});
			value = tabNumber? tabNumber : 0;
			remember_setting("dw_opened_tab", value, {sessionOnly:true});
		});
	}
	
	this.oms_click = function(object){
		select_elements_badge = object.badge;
			if(object.aviso){
				aviso(object.titulo,object.msg,object.notAnimate,null,null,object.cancelLabel)
			}else{
				object.cromo_obj.showData();
				show_element_information(object.obj,object.elem_type,object.elem_types,object.cromo_obj);
			}
	}
	
	this._getScriptURL = (function() {
	    var scripts = document.getElementsByTagName('script');
	    var index = scripts.length - 1;
	    var src = "";
	    // busca el dominio desde donde se importo este archivo
	    for(let i=0; i<scripts.length && src == ""; i++){
	    	if(scripts[i].src.includes("cromo.js")){
	    		src = scripts[i].src;
	    	}
	    }
	    return src;
	})();

	this._getScriptServer = (function(url) {
		var dir = new URL(url);
		return dir.origin;
	})(this._getScriptURL);

	var URLBASE1 = new URL(this._getScriptServer);
	var _CROMO_VERSION = "v1.2506.07";
	var _META_VERSION = "";
	
	this.init = function(){
		if(!id){
			id = idMap;
			var self = this;
			var checkPoint="";
			return new Promise((resolve, reject) => {
				var _self = self;
				let _cromo_version = _CROMO_VERSION;
				get_metaVersion(URLBASE1).then(_version=>{
					_META_VERSION = _version;
				}).then(()=>load_scripts(URLBASE1.origin, _cromo_version, _META_VERSION))
				.then(() => load_script(`${URLBASE1.origin}/js/commons.js?v=${_cromo_version}`))
				.then(() =>	load_script(`${URLBASE1.origin}/js/cromoClient.js?v=${_cromo_version}`))
				.then(() => load_script(`${URLBASE1.origin}/js/custom_client.js?v=${_cromo_version}`))
				.then(() => {
					cromoClient = new CromoClient();
					return getProfile()
						.then( () => startMap(_self, resolve));
				})
				.catch(function(error){
					if (options.userId) {
						const promises = [
							$.ajax({
								type: "GET",
								url: URLBASE1.protocol + "//" + URLBASE1.host + "/auth/",
								cache: false,
								dataType: 'json',
								data: { domain: options.domain },
								headers: {
									'Authorization':make_auth(options.userId, options.password, options.token)
								},
								xhrFields: {
								// The 'xhrFields' property sets additional fields on the XMLHttpRequest.
								// This can be used to set the 'withCredentials' property.
								// Set the value to 'true' if you'd like to pass cookies to the server.
								// If this is enabled, your server must respond with the header
								// 'Access-Control-Allow-Credentials: true'.
								withCredentials: true,
								},
								success: function (response) {
									if(typeof response.token != "undefined" && response.token) {
										localStorage.setItem("token_acces", response.token);
									}
								}
							})
							.then(function(){
								const setUserLoggedEnv = false; // fix temporario para iDMS, acá entra al instanciar el mapa desde iDMS
								getProfile(setUserLoggedEnv);
							})
							
						];
						checkPoint="Logueo";
						return Promise.all(promises)
						.then(function(result){
							console.log("logro loguear");
							checkPoint="Inicilización del Mapa";
							if(!userLogged){
								_self.setUserLogged(options.userId)
								userLogged = options.userId;							
							}
							startMap(_self, resolve);
						})
						.catch(function(error) {
							console.log("Error en "+checkPoint+": " + error.statusText);
							console.log(error.message);
							reject(error);
						})
					} else {
						console.log("no hay sesion iniciada y no se recibió userId");
						reject(error);
					}
				})
			});
		} else
			return Promise.reject("Cromo ya se ha iniciado");
	};
	this.isAuthenticated=function(){
		return $.ajax({
		    type: "GET",
		    url: URLBASE1.origin+"/server/status",
            contentType: 'application/javascript; charset=utf-8',
		    dataType: 'text',
		    cache: false
		})
	};
	this.addListener = function(e, callback){
		channel.addListener(e,callback);
	};
	this.detach = function(){
		return new Promise((resolve, reject) => {
			if(options.div.innerHTML){

				win = window.open("", "mapa-"+idMap);
				channel.request({type:"getCoordinates"})
				.then((coordinates) => {
					let onMessageFromDetachMap = function() {
						if(iframe.parentNode){
							let subscribers = channel.getSubscribers(); // recupero susbscribers antes de destruir el canal
							channel.close();
							channel = null;
							channel = messageChannel(idMap); // creamos nuevo messageChannel
							channel.setSubscribers(subscribers);
							let coordinatesParsed = JSON.parse(JSON.stringify(coordinates));
							win.postMessage(coordinatesParsed, '*', [channel.port2]);
							options.div.style.display = 'none';
							this.removeEventListener('message', onMessageFromDetachMap);
							iframe.parentNode.removeChild(iframe);
						}
						resolve();
					};
					window.addEventListener('message', onMessageFromDetachMap);
					win.location = `${this._getScriptServer}/mapa.html?mapa_id=${idMap}&meta_version=${_META_VERSION}`;
				});
			} else {
				console.log("detach error: no hay mapa attachado");
				reject({st:1, msg:"detach error: no hay mapa attachado"});
			}
		});
	};
	
	this.getLLXY = function(){
		return new Promise((resolve, reject) => {
		 channel.request({ type: "getCoordinatesLL" }).then((coordinates)=>{
			 
			 coorGeo = coordinates
		 }).then( resolve())
		
		})
	}
		
	this.attach = function(){
		return new Promise((resolve, reject) => {
			if(!options.div.innertHTML){
				channel.request({ type: "getCoordinates" })
				.then((coordinates) => {
					let subscribers = channel.getSubscribers(); // recupero susbscribers antes de destruir el canal
					channel.post({ type: "close"});
					channel = null;
					channel = messageChannel(idMap);
					channel.setSubscribers(subscribers);
					createIframeMap(coordinates);
					options.div.style.display = 'block';
					resolve();
				})
			} else {
				console.log("attach error: no hay mapa detachado");
				reject({st:1, msg:"attach error: no hay mapa detachado"});
			}
		});
	};
	
	this.getId = function() {
		return id;
	}
	
	this.getCromoVersion = function() {
		return _CROMO_VERSION;
	}
	this.getMetamodelVersion = function() {
		return _META_VERSION;
	}
	
	this.isDetached = function() {
		return win? true : false;
	}

	this.isMapInitialized = function() {
		return map_status.map_initiliazed;
	}
	
	this.zoomArea = function(id, height){
		return channel.request({
			type:"zoomArea",
			areaId: id,
			height});
	};
	this.zoomObj = function(id, height, idsToPaint = []) {
		return channel.request({
			type:"zoomObject",
			elementId: id,
			height,
			coordinate: null,
			idsToPaint
		});
	};
	this.zoomXY = function(x, y, zoom, pin_information){
		return channel.request({
				type:"zoomXY",
				X:x,
				Y:y,
				height:zoom,
				pin_information
			});
	};
	this.zoomRectangle = function(coordinates){
		return channel.request({
				type:"zoomRectangle",
				X1:coordinates.x1,
				Y1:coordinates.y1,
				X2:coordinates.x2,
				Y2:coordinates.y2
			});
	};
	this.getStats = function(){
		return channel.request({
				type:"getStats"
		});
	};
	this.zoomStreet = function(street_id, id_ver, altura, desc){
		this.resetColors();
		return channel.request({
			type: "zoom_street",
			data:{
				street_id,
				id_ver,
				altura,
				desc
			}
		});
	};
	this.zoomLatLon = function(lat, lon){
		return channel.request({
			type:"search_ll",
			data:{
				lat,
				lon
			}
		});
	}
	this.zoomLatLonArea = function(lat1, lon1, lat2, lon2, geo=false, geohash){
		this.resetColors();
		return channel.request({
			type:"search_ll2",
			data:{
				lat1,
				lon1,
				lat2,
				lon2,
				geo,
				geohash
			}
		});
	}
	this.onZoom = function(mode){
		if (mode == 0){
			cromoClient.getLayersComponent().resetToDefaultValues(this);
			SELECTED_AREAS={};
		}
		var msg = {type:"onZoom", mode:mode};
		return channel.request(msg)
		.then(result => {
			refresh_combo({});
		});
	};
	this.clients = function(tipoGrilla){
		//showGrillaClientes();
		//createGrillaClientes();
		switch (tipoGrilla){
		case 1:
			Clientes.gridUi(tipoGrilla, [],{});
		    break;
		case 2:
			Clientes.gridUi(tipoGrilla, [],this.getMapStatus().selected_areas);
		    break;
		case 3:
			Clientes.gridUi(tipoGrilla, [],this.getMapStatus().areas_on_screen);
		    break;
		}
		return;
	};
	this.upstream = function(verificado){
		if(verificado){
			if(recorridosExp < 6){
				recorridosExp += 1;
			}
	
			if (cromoClient.config.opt_export_circuits == 'enabled') {
				$("#g_tabla_exportar_3").removeClass("not-active-2")
				
				if(recorridosExp == 1){
					$("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorrido" )
					sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorrido")
				}else{			
					$("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorridos" )
					sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorridos")
				}
			}
		} else {
			return channel.request({type:"recorrido", mode:"upstream"})
			.catch(error_msg => aviso("Atención",error_msg));
		}
	};
	this.downstream = function(verificado){
		if(verificado){
			if(recorridosExp < 6){
				recorridosExp += 1;
			}
				
			if (cromoClient.config.opt_export_circuits == 'enabled') {
				$("#g_tabla_exportar_3").removeClass("not-active-2")
				if(recorridosExp == 1){
					$("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorrido" )
					sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorrido")
				}else{			
					$("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorridos" )
					sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorridos")
				}
			}
		} else {
			return channel.request({type:"recorrido", mode:"downstream"})
			.catch(error_msg => aviso("Atención",error_msg));
		}
	};
	this.connected = function(verificado){
		if(verificado){
			if(recorridosExp < 6){
				recorridosExp += 1;
			}
				
			if (cromoClient.config.opt_export_circuits == 'enabled') {
				$("#g_tabla_exportar_3").removeClass("not-active-2")
				if(recorridosExp == 1){
					 $("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorrido" )
					 sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorrido")
				}else{			
					$("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorridos" )
					sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorridos")
				}
			}
		} else {
			return channel.request({type:"recorrido", mode:"connected"})
			.catch(error_msg => aviso("Atención",error_msg));
		}
	};
	this.goToSrc = function(){
		return channel.request({type:"recorrido", mode:"goto"})
		.catch(error_msg => aviso("Atención", error_msg));
	};
	this.feeders = function(verificado){
		if(verificado){
			if(recorridosExp < 6){
				recorridosExp += 1;
			}
				
			if (cromoClient.config.opt_export_circuits == 'enabled') {
				$("#g_tabla_exportar_3").removeClass("not-active-2")
				if(recorridosExp == 1){
					 $("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorrido" )
					 sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorrido")
				}else{			
					$("#g_tabla_exportar_3").html("Red de " + recorridosExp + " recorridos" )
					sessionStorage.setItem("tituloRed", "Red de " + recorridosExp + " recorridos")
				}
			}
		} else {
			return channel.request({type:"recorrido", mode:"feeders"})
			.catch(error_msg => aviso("Atención",error_msg));
		}
	};
	this.back = function(){
		return channel.request({type:"back"});
	};
	this.resetColors = function(){
		if (cromoClient.config.opt_export_circuits == 'enabled') {
			$("#g_tabla_exportar_3").addClass("not-active-2")
			$("#g_tabla_exportar_3").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Red de recorridos")
			recorridosExp = 0;
		}
		return channel.request({type:"reset_colors"});
	};
	this.drawCaminos = function(caminosData, selectedIndex, visibleHashes, ids, coloreo){
		return channel.request({type:"drawCaminos", data: caminosData, selectedIndex, visibleHashes, ids })
			.then(() => {
				this.setColor(coloreo, true, true);
			})
			.catch(error_msg => aviso("Atención",error_msg));
	}
	this.getLayers = function(format){
		let layers = cromoClient.getLayersComponent().getLayersModel();
		return cromoClient.formatLayers(layers, format);
	};
	this.addLayer = function(aLayer){
		cromoClient.getLayersComponent().addLayer(aLayer);
	}
	this.measuringTape = function(){
		return channel.request({type:"measuringTape"});
	}
	
	this.findData = function(id){
		return channel.request({
			type:"findData",
			data: id
		});
	}

	
	//se usa id de layer. ej: "n_1"
	this.changeLayer = function(layerId){
		let layers = cromoClient.getLayersComponent();
		let node = layers.findLayerInWholeTree(layerId);
		return layers.changeLayerState(node, this);
	};
	this.changeLayers = function(nodes_ids){
		let layers = cromoClient.getLayersComponent();
		nodes_ids.forEach(anId => {
			let nodeToChange = layers.findLayerInWholeTree(anId);
			layers.changeLayerState(nodeToChange, this);
		});
	};
	this.changeOnlyLayerState = function(layerId) {
		const layersComponent = cromoClient.getLayersComponent();
		const node = layersComponent.findLayerInWholeTree(layerId);
		layersComponent.changeOnlyLayerState(node, this);
		layersComponent.saveLayersState(node);
	}
	this.findLayer = function(layerId){
		return cromoClient.getLayersComponent().findLayer(layerId);
	};
	
	this.layerOn = function(layerId){
		let node = cromoClient.getLayersComponent().findLayerInWholeTree(layerId);
		let doRender = this.isMapInitialized();
		let ret = cromoClient.getLayersComponent().layerOn(node, this, doRender);
		if (this.getCurrentPanel() && this.getCurrentPanel().id == "panel-capas") {
			cromoClient.getLayersComponent().updateLayersPanel();
		}
		return ret;
	};

	this.layerOff = function(layerId){
		let node = cromoClient.getLayersComponent().findLayerInWholeTree(layerId);
		let doRender = this.isMapInitialized();
		let ret = cromoClient.getLayersComponent().layerOff(node, this, doRender);
		if (this.getCurrentPanel() && this.getCurrentPanel().id == "panel-capas") {
			cromoClient.getLayersComponent().updateLayersPanel();
		}
		return ret;
	};
	
	// lista: ["313123",...]
	this.extentZoom = function(elem_type, elems_list, highlight = false){
		let ids_list;
		if(typeof elems_list[0] == 'string'){
			ids_list = elems_list.map(string_id => parseInt(string_id)); 
		} else {
			ids_list = elems_list;
		}
		return channel.request({
			type:"highlights",
			data: {
				elem_type,
				ids_list,
				highlight
			}
		});
	};
	this.unHighlight = function(){
		channel.request({
			type:"unhighlight"
		});
		return this.renderMap();
	}
	this.lightenMap = function(ids_list){
		channel.request({
			type:"lightenMap",
			data: {
				ids_list,
			}
		});
		return true;
	}

	this.setBadgesToShow = function(elems_list){
		ids_list = elems_list.map(string_id => parseInt(string_id)); 
		channel.request({
			type:"setBadgesToShow",
			data: {
				ids_list,
			}
		});
		return this.renderMap();
	}
	
	this.setRenderData = function(renderData){
		initRenderData = renderData;
	}
	
	// define contexto para plugin
	this.setPluginContext = function(pluginId, context){
		let _plugin = PLUGINS[pluginId];
		if(_plugin ){
			return _plugin.setContext(context);
		}
		return channel.request({type: "pluginContext", pluginId, context});
	}

	this.updateNodeCount = function (pluginIds) {
		pluginIds.forEach(pluginId => {
			if (PLUGINS[pluginId] && PLUGINS[pluginId].hasOwnProperty('update_nodes')) {
				PLUGINS[pluginId].update_nodes({
					layers_array,
					cdata: lastCData,
					plugins_info: lastPluginInfo,
				});
			}
		})
	}

	this.toggleFilter = function(sourceNode, node) {
		channel.request({
			type: "toggle_filter",
			data: { node }
		});
		cromoClient.getLayersComponent().saveLayersState(sourceNode);
	}
	
	this.refreshScreen = function(){
		return channel.request({
			type:"refreshScreen"});
	}

	this.fetch = function(areaId, objId){
		return channel.request({
			type:"fetch",
			areaId:areaId ,
			objId:objId});
	};
	this.reFetch = function(){
		return channel.request({
			type:"reFetch"
		});
	}
	
	// fetcherName: nombre del fetch a activar / desactivar
	//      por ahora sólo vale 'business', a futuro se podrán agregar nuevos 
	// enabled: true -> activa; false -> desactiva
	// voter: nombre del plugin que pide activar / desactivar
	this.enableFetch = function(fetcherName, enabled, voter) {
		let data = {
			fetcherName,
			enabled,
			voter
		}
		return channel.request({
			type:"enableFetch",
			data
		});
	};
	
	this.search = function(val, options={showErrorMsg:true}){
		let p = on_search(val, this, map_status);
		if (options && options.showErrorMsg) {
			p.catch(error => 
				aviso("Atención!", error)
				)
		}
		return p;
	};
	this.clicked = function(){
		return channel.post("click");
	};
	this.getVisualizationModes = function() {
		return visualizationModes;
	};
	this.getVisualizationSwitch = function() {
		return visualizationSwitch;
	};
	this.getVisualizationMode = function() {
		return currentVisualizationMode;
	};
	this.addVisualizationMode = function(newMode){
		visualizationModes.push(newMode);
	};
	this.addVisualizationSwitch = function(newMode){
		visualizationSwitch.push(newMode);
	};
	this.setVisualizationMode = function(mode, doFetch=true){
		currentVisualizationMode = mode
	    remember_setting("modoVisualizacion", mode);
		let type = doFetch? "visualizationMode" : "initialVisualizationMode";
		return channel.request({type: type, mode});
	};
	
	this.addProjectMode = function(option){
		projectModes.push(option);
	}
	this.getProjectModes = function(){
		return projectModes;
	}
	this.setProjectMode = function(mode, doRender=true){
		remember_setting("modoProyecto", mode);
		let type = doRender? 'proyectMode' : 'initialProyectMode'
		return channel.request({type:type, mode})
	}
	this.setVisualizationSwitch = function(mode, element){
		visualizationSwitch = mode
		remember_setting("switchVisualizacion", mode);
		return channel.request({type: 'visualizationSwitch', mode});
	};
	this.getCurrentVisualizationMode = function(){
		return currentVisualizationMode;
	}
	this.getVisualizationChecks = function(){
		return visualizationChecks;
	};
	this.addVisualizationCheck = function(checkOption){
		visualizationChecks.push(checkOption);
	};
	this.checkVisualization = function(value, doCheck=true){
		if(currentVisualizationCheck.includes(value)){
			currentVisualizationCheck = currentVisualizationCheck.filter(visualizationCheck => visualizationCheck != value);
			delete_setting("checkVisualizacion", value);
		} else {
			currentVisualizationCheck.push(value);
			add_remember_setting("checkVisualizacion", value);
		}
		return channel.request({type: "visualizationCheck", name:value});
	};
	this.changeVisualizationOption = function(value){
		if(visualizationChecks.includes(value)){
			this.checkVisualization(value);
		} else if(visualizationModes.includes(value)){
			this.setVisualizationMode(value);
		}else if(visualizationSwitch.includes(value)){
			this.setVisualizationSwitch(value);
		}
	}
	this.getCurrentVisualizationCheck = function(){
		return currentVisualizationCheck;
	}
	this.setTime = function(date, notify=false){
		let table_name = 'tabla_editar';
		let loop = true;
		let i = 0;
		time = date;
		while (loop) {
			let o = $("#g_" + table_name + "_" + i);
			if (o.length) {
				date != 'now'? o.addClass("not-active-2") : o.removeClass("not-active-2");
				i++;
			} else {
				loop = false;
			}
		}
		
		// cuando activo eje temporal, desactivo opcion de Caminos del menu recorridos
		if(date == 'now'){
			$("#btn-caminos").parent().removeClass("not-active-2");
		} else {
			$("#btn-caminos").parent().addClass("not-active-2");
		}
		let p;
		if (notify) {
			// el mapa ya está en fecha
			let d = {type:"event",event:"timeChanged", data:date};
			channel.fireEvent({data:JSON.stringify(d)});
			p = Promise.resolve();
		} else {
			p = channel.request({type:"changeTime", date});
		}
		return p;
	}
	this.getProfiles = function() {
		return cromoClient.profiles;
	};
    this.getProfile = function() {
		return cromoClient.currentProfile;
	};
	this.addProfile = function(profile){
		cromoClient.profiles.push(profile);
	}
	this.setProfile = function(profile){
		cromoClient.currentProfile = profile;
		let profileNumber = cromoClient.profiles.find(prof => prof.name == profile);
		return channel.request({type:"changeProfile", profile: profileNumber});
	}
	this.setMapOptions = function(options) {
		return channel.request({type:"setMapOptions", options:options});
	};
	this.resize = function() {
		return channel.request({type:"resize"});
	};
	this.getFilterClasses = function(){
		return filterclasses;
	};
	this.setFilterClasses = function(_filterclasses){
		filterclasses = _filterclasses;
	};
	this.addFilterClasses = function(id){
		filterclasses.push(id);
	};
	this.getExClasses = function(){
		return ex_class;
	};
	this.getExClass = function(clazz){
		return ex_class[clazz];
	};
	this.setExClasses = function(exClasses){
		ex_class = exClass;
	};
	this.setExClass = function(exClass, value){
		ex_class[exClass] = value;
	};
	this.getCDATA = function(){
		return CDATA;
	}
	this.getMapStatus = function(){
		return map_status;
	}
	this.getMapModes = function(){
		return mapModes;
	}
	this.addMapMode = function(mode){
		mapModes.push(mode);
	}
	this.setMapMode = function(name, opacity){
		currentExternalCartography = name;
		disableEditOption(name);
		let data = {name};
		if(opacity){
			data['opacity'] = opacity;
		}
		return channel.request({
			type:"mapMode",
			data
			})
		.then(result => {
			channel.post({type:"click"});
		})
	}
	this.callGoogleMapsGeocoder = function(busqueda){
		return channel.request({
			type:"geocoder",
			data:busqueda
		})
	}
	this.getCurrentExternalCartography = function(){
		return currentExternalCartography;
	}
	this.setOpacity = function(value){
		mapOpacity = value;
		return channel.request({
			type:"opacity",
			data: value
		})
	}
	this.openStreetView = function(lat,lon){
		return channel.request({
			type: "streetView",
			data:{lat,lon}
		});
	}
	this.openMapView = function(lat,lon){
		return channel.request({
			type: "mapView",
			data:{lat,lon}
		});
	}
	this.editNNSS = function(){
		if(modified){
			aviso('Atención','Existen elementos sin confirmar');
			return;	
		}
	    editNNSS(map_status, CURRENT_MAP);
	    let title = $('#span-edicion').text();
		return channel.request({
			type:"editNNSS",
			data: {title}
		});
	}
	this.newServiceStartTypeOne = function(){
		newServiceStartTypeOne(map_status);
	}
	this.newTendidoProvisorio = function(){
		blockMenuActions();
		return channel.request({
			type:"newTendidoProvisorio",
			data: {}
		});
	}
	this.deleteTendidoProvisorio = function(id){
		return channel.request({
			type:"deleteTendidoProvisorio",
			data: {id: id}
		});
	}
	this.updateTendidoProvisorio = function(id){
		return channel.request({
			type:"updateTendidoProvisorio",
			data: {id: id}
		});
	}

    this.cambioDomicilio = function(){
    	Contracts.call_pick_object_change_street(CURRENT_MAP)
	}
	this.newServiceStart = function(obj, isSum){
		newServiceStart(obj, isSum, map_status);
	}

	
	this.moveAddressStart = function(obj, isSum){
		moveAddressStart(obj, isSum, map_status);
	}
	
	this.getStatusMap = function(){
		
		return map_status
	}
	

	this.updateWS = function(data){
		return channel.request({
			type:"updateWS",
			data: data
		});
	}
	
	this.updateNoCom = function(data){
		return channel.request({
			type:"updateNoCom",
			data: data
		});
	}
	
	this.loadPlugin = function(plugin, external=true, token=null){
		let p=[];
		p.push(Promise.resolve(this))
		p.push(require_plugin(plugin+"_client",external,token))
		return Promise.all(p).then(values => {
				let _plugin = PLUGINS[values[1]];
				if(_plugin.hasOwnProperty("inited"))
					_plugin.inited(values[0], Config, cromoClient.config);
				if(_plugin.hasOwnProperty("setAuthInfo"))
					_plugin.setAuthInfo(getAuthInfo(options));
				return channel.request({
					type:"loadPlugin",
					plugin: plugin,
					external:external
				});
		})
	}

	this.startEdition = function(){
		return channel.request({
			type:"edit"
		});
	}
	
	this.mapEdit = function(lala){

		return mapBla(lala)
	}
	
	/**
	 * Deja disponible la Api del servidor Cromo en la variable global CROMO
	 */
	this.loadServerApi = function() {
		if (typeof CROMO != "undefined") {
			return new Promise(function(resolve,reject) {
				reject("ya está cargada")
				}
			);
		}
		let _cromo_version = _CROMO_VERSION;
		return load_script(`${URLBASE1.origin}/js/cromo-server-api.js?v=${_cromo_version}`);
	}
	this.getToken = function(){
		return localStorage.getItem("token_acces");
	}
	this.getWebSocket=function(){
		return cromoWebSocket;
	}
	this.setWebSocket = function(ws){
		cromoWebSocket = ws;
	}
	this.destroy = function(){
		channel.request({
			type:"destroy"
		})
		let webSocket = this.getWebSocket();
		this.getChannel().close();
		if (webSocket.keepAliveInterval){
			clearInterval(webSocket.keepAliveInterval);
		}
		webSocket.keepAliveInterval =null;
		webSocket.socket.close();
		window.mapasCromo.splice(window.mapasCromo.indexOf(this.getId()),1)
		this.getMapContent().innerHTML = "";
	}
	function callABMTemporales(objChannel,cromo_obj){
		let webSocket = cromo_obj.getWebSocket();
		webSocket.sendMessage(JSON.stringify({type:'disableReFetch',disable:true}));
		return channel.request(objChannel)
		.then(function(data){
			webSocket.sendMessage(JSON.stringify({type:'disableReFetch',disable:false}));
			return data;
		});
	}
	
	this.getNetTypes = function() {
		return NETTYPES || {};
	}
	
	//  filter es un objeto con propiedad netTypes que es un array
	//  { netTypes:[id,...] } 
	this.setSearchFilter = function(filter) {
		this.applyNetFilter = true;
		if (setSearchFilter(filter) ) {
			remember_setting("searchFilter", JSON.stringify(filter));
		}; // search_client
	}
	
	this.getSearchFilter = function() {
		return read_setting("searchFilter");
	}
	this.deleteBookmarkPin = function(x, y){
		return channel.request({
				type:"deleteBookmarkPin",
				X:x,
				Y:y
			});
	};
};

const load_script = function(src, async=false){
	return new Promise(function(resolve){
		console.log("LOAD_SCRIPT cargando: ", src);
		var script = document.createElement("script");
		script.src = src;
		script.async = async;
		script.onload = () => {
			console.log("LOAD_SCRIPT onload: ", src);
			resolve();			
		}
		document.head.appendChild(script);
	});
}

const load_style = function(src){
	return new Promise(function(resolve){
		var fileref = document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", src);
		fileref.onload = () => resolve();
		document.head.appendChild(fileref);
	});
}

function get_metaVersion(URLBASE1){
	return $.ajax({
		    type: "GET",
		    url: URLBASE1.origin+"/metamodel/version",
            contentType: 'application/json; charset=utf-8',
		    dataType: 'JSON',
		    cache: false
		}).then(response=>{
				if(response){
					eval("response = "+response.trim()+";");
					if(response.hasOwnProperty("env") && response.hasOwnProperty("fecha")){
						_version = response.env+"_"+response.fecha;
						return _version;
					}else if(response.hasOwnProperty("error")){
						console.error("Error al obtener la version de metamodel - "+response.error);
					}else{
						console.error("Error al obtener la version de metamodel");
					}
				}else{
					console.error("Error al obtener la version de metamodel");
				}
			
		})
}
function load_scripts(origin, _cromo_version, _cromo_meta_version){
	return Promise.all([
			// load_script(`${origin}/client/cromo-api.js?v=${_cromo_version}`),  // el archivo esta casi vacio
			load_script(`${origin}/js/tools.js?v=${_cromo_version}`),
			load_script(`${origin}/js/mapChannelClient.js?v=${_cromo_version}`),
			load_script(`${origin}/js/webSocket.js?v=${_cromo_version}`),
			load_script(`${origin}/js/colors.js?v=${_cromo_version}`),

			load_script(`${origin}/meta/classes.js?v=${_cromo_meta_version}`),
			load_script(`${origin}/meta/metamodel.js?v=${_cromo_meta_version}`),
			load_script(`${origin}/meta/areas.js?v=${_cromo_meta_version}`),
			load_script(`${origin}/meta/streets.js?v=${_cromo_meta_version}`),
			load_script(`${origin}/js/search_client.js?v=${_cromo_version}`),
			load_script(`${origin}/js/keys.js?v=${_cromo_version}`),
			load_script(`${origin}/js/dataPanel.js?v=${_cromo_version}`),
			load_script(`${origin}/js/clientes.js?v=${_cromo_version}`),
			load_script(`${origin}/js/medidores.js?v=${_cromo_version}`),
			load_script(`${origin}/js/contracts.js?v=${_cromo_version}`),
			load_script(`${origin}/js/crudAttributes.js?v=${_cromo_version}`),
			load_script(`${origin}/js/datos-ext.js?v=${_cromo_version}`),
			load_script(`${origin}/js/exportData.js?v=${_cromo_version}`),
			load_script(`${origin}/js/bookmarks.js?v=${_cromo_version}`),
			load_script(`${origin}/js/healthCheck.js?v=${_cromo_version}`),
			load_script(`${origin}/js/cromoRedFrontend.js?v=${_cromo_version}`),
			load_script(`${origin}/plugins/Plugin.js?v=${_cromo_version}`),
			load_script(`${origin}/external/w2ui/w2ui-1.5.rc1-prometium.js?v=${_cromo_version}`),
			load_style(`${origin}/font-awesome/css/font-awesome.min.css?v=${_cromo_version}`),
			load_style(`${origin}/font-awesome/css/solid.min.css?v=${_cromo_version}`),
			load_style(`${origin}/font-awesome/css/regular.min.css?v=${_cromo_version}`),
			load_style(`${origin}/external/w2ui/w2ui-1.5.rc1.min.css?v=${_cromo_version}`),
			load_style(`${origin}/external/jqwidgets/styles/jqx.base.css?v=${_cromo_version}`),
			load_style(`${origin}/external/jqwidgets/styles/jqx.metrodark.css?v=${_cromo_version}`),
			load_style(`${origin}/external/typeahead/jquery.typeahead.min.css?v=${_cromo_version}`),
			load_script(`${origin}/external/jquery.typeahead.min.js?v=${_cromo_version}`),
			load_script(`${origin}/external/typeahead.bundle.js?v=${_cromo_version}`),
			load_script(`${origin}/external/raphael.js`)
			.then(() =>	$.getScript(`${origin}/external/raphael.pan-zoom.js`)),
			load_style(`${origin}/css/cromo_client.css?v=${_cromo_version}`),
			load_style(`${origin}/external/w3/w3.css?v=${_cromo_version}`),
			load_style(`${origin}/css/custom.css?v=${_cromo_version}`),
			load_style(`${origin}/css/alpaca.css?v=${_cromo_version}`),
			load_script(`${origin}/js/layers.js?v=${_cromo_version}`),
			load_script(`${origin}/js/canvas.js?v=${_cromo_version}`),
			load_script(`${origin}/js/newService.js?v=${_cromo_version}`),
			load_script(`${origin}/js/keys.js?v=${_cromo_version}`),
			load_script(`${origin}/js/crudAlpacaForm.js?v=${_cromo_version}`),
			load_script(`${origin}/external/handlebars.min.js`)
			.then(() => load_script(`${origin}/external/alpaca.min.js`))
			.then(() => load_script(`${origin}/js/alpaca/customFields/geocoderField.js`)),
			load_script(`${origin}/meta/graphics.js?v=${_cromo_version}`),
	])
}

function make_auth(user, password, token = null) {
	var hash = "";
	// si hay user, se usa primero user:pwd
	if (user) {
		var tok = user + ":" + password;
		hash = "Basic " + btoa(unescape(encodeURIComponent(tok)));
	} else if (token) {
		hash = "Bearer " + token;
	}
	return hash;
}

var DefaultChannel = function(cromoObj){
	let subscribers = [];
	this.addListener = function(listener, callback){
    	let promise = subscribers.find(event => event.type == listener);
    	if(promise)
    		promise.handlers.push(callback);
    	else
    		subscribers.push({type:listener,
    				handlers:[callback]})
	}
	this.getSubscribers = function(){
		return subscribers;
	}
	this.fireEvent = function(event){
    	let msgObj = JSON.parse(event.data);
    	let event_type = subscribers.find(event => event.type == msgObj.event);
    	if (event_type && event_type.handlers)
    		event_type.handlers.forEach(handler => handler(msgObj.data, msgObj.mapId));
	}
	this.request = function(request){
		if(request.elementId){
			cromoObj.setRenderData({
				objId:request.elementId,
				height: 30
			});
		}else if(request.areaId){
			cromoObj.setRenderData({
				areaId:request.areaId
			});
		}else if(request.X == 0){
			cromoObj.setRenderData({
				x1:0
			})
		} else{
			let x = request.X;
			let y = request.Y;
			let zoom = request.height;
			let x1 = request.X - zoom;
			let x2 = x + zoom;
			let y1 = y - zoom;
			let y2 = y + zoom;
			cromoObj.setRenderData({
				x1,	y1, x2, y2
			});
		}
	}
}
