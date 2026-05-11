
function messageChannelMap(channelName, port) {

	var channel = port;
	var chName = channelName;
    
	var post = function (msgObj) { 
		let jsonMsg =  JSON.stringify(msgObj);
		channel.postMessage (jsonMsg);
	};
    
	channel.onmessage = function (e) {
		var msgObj = JSON.parse(e.data);
		var promise, response_data, promesa;
    	switch(msgObj.type) {
    	  case "zoomXY":
  			  promise = zoomXY(msgObj.X, msgObj.Y, msgObj.height, msgObj.pin_information);
  			  break;
  		  case "zoomRectangle":
  			  promise = zoomRectangle(msgObj.X1, msgObj.Y1, msgObj.X2, msgObj.Y2);
  			  break;
    	  case "refreshScreen":
				promesa= fetch();
				if(promesa instanceof Object){
					promise = promesa.then(function(data){
						response_data = data;
						innerRefresh(get("inner_window"));
						for (var key in panZoomInnerWord_array ){
							innerRefresh(get("inner_window-"+key));
						}
						return response_data;
					});
				}
			break;
    	  case "fetch":
              promise= fetch(msgObj.areaId, msgObj.objId);
              break;
    	  case "reFetch":
    		  promise = re_fetch();
    		  innerRefresh(get("inner_window"));
    		  for (var key in panZoomInnerWord_array ){
    			  innerRefresh(get("inner_window-"+key));
    		  }
    		  break;
    	  case "zoomArea":
			  promise = fetch(msgObj.areaId, null, msgObj.height);
	  		  break;
    	  case "zoomObject":
			  promise = fetch(0,msgObj.elementId, msgObj.height, msgObj.coordinate, msgObj.idsToPaint);
	  		  break;
    	  case "zoom_street":
    		  zoom_a_calle(msgObj.data.street_id, msgObj.data.id_ver, msgObj.data.altura, msgObj.data.desc);
    		  break;
    	  case "onZoom":
    		  promise = on_zoom(msgObj.mode);
    		  break;
    	  case "recorrido":
    		  promise = recorrido(msgObj.mode);
    		  break;
    	  case "drawCaminos":
    	  	  promise = drawCaminos(msgObj.data, msgObj.selectedIndex, msgObj.visibleHashes, msgObj.ids);
    	  	  break;
    	  case "setShowClasses":
    		  setShowClasses(msgObj.data.id, msgObj.data.value);
    		  break;
    	  case "deleteShowClasses":
    		  deleteShowClasses(msgObj.data.id);
    		  break;
    	  case "back":
    		  promise = on_back();
    		  break;
    	  case "reset_colors":
    		  promise = reset_colors();
    		  break;
    	  case "exportarCromo":
    		 promise = exportar2();
    		 break;
    	  case "exportarCartoPantalla":
    		 tipo="pantalla"
     		 promise = exportar_cartografia(tipo);
     		 break;
    	  case "exportarCartoArea":
    		 tipo="area"
      		 promise = exportar_cartografia(tipo);
      		 break;
    	  case "exportarCartoElemento":
     		 tipo="elemento"
       		 promise = exportar_cartografia(tipo);
       		 break;
    	  case "exportarCartoRed":
      		 tipo="recorrido"
        		 promise = exportar_cartografia(tipo);
        		 break;
          case "importarNoved":
        		 promise = importar_novedades();
        		 break;
    	  case "carpetaArchivos":
      		 promise = on_folder_files_click();
      		 break;
    	  case "orden_de_trabajo":
       		 promise = on_orden_de_trabajo_click();
       		 break;
    	  case "orden_de_trabajo_lista":
    		 promise = on_orden_de_trabajo_lista_click();
        	 break;
    	  case "search":
    		  cromo_search(msgObj.data)
    		  .then(function(response){
    			  response_data = RET.arr;
    		  });
    		  break;
    	  case "cromo_search":
    		  promise = call_cromo_search(msgObj.data.name, msgObj.data.attr_id, msgObj.data.filter);
    		  promise.then(function(response){
    			  response_data = RET;
    		  });
    		  break;
    	  case "search_ll":
    	  	  search_lat_lon(msgObj.data.lat, msgObj.data.lon);
    		  response_data = "search_ll";
    		  promise = Promise.resolve();
    		  break;
    	  case "search_ll2":
    		  search_lat_lon(msgObj.data.lat1, msgObj.data.lon1, msgObj.data.lat2, msgObj.data.lon2, msgObj.data.geo, msgObj.data.geohash);
    		  response_data = "search_ll2";
    		  promise = Promise.resolve();
    		  break;
    	  case "search_xy":
    		  search_xy(msgObj.data.x, msgObj.data.y);
    		  response_data = "search_xy";
    		  promise = Promise.resolve();
    		  break;
    	  case "exclude":
    		  inc_class[parseInt(msgObj.data.id)] = false;
    		  ex_class[parseInt(msgObj.data.id)] = true;
    		  promise = (msgObj.data.doRender? render() : Promise.resolve());
    		  break;
    	  case "exclude_group":
    		  msgObj.data.ids.forEach(aNode => inc_class[parseInt(aNode.id)] = false);
    		  msgObj.data.ids.forEach(aNode => ex_class[parseInt(aNode.id)] = true);
    		  promise = (msgObj.data.doRender? render() : Promise.resolve());
    		  break;
    	  case "include":
    		  inc_class[parseInt(msgObj.data.id)] = true;
			  ex_class[parseInt(msgObj.data.id)] = false;
    		  promise = (msgObj.data.doRender? render() : Promise.resolve());
    		  break;
    	  case "include_group":
    		  msgObj.data.ids.forEach(aNode => ex_class[parseInt(aNode.id)] = false);
    		  msgObj.data.ids.forEach(aNode => inc_class[parseInt(aNode.id)] = true);
    		  promise = (msgObj.data.doRender? render() : Promise.resolve());
    		  break;
    	  case "default":
    		  ex_class[parseInt(msgObj.data.id)] = false;
    		  promise = (msgObj.data.doRender? render() : Promise.resolve());
    		  break;
    	  case "default_group":
    		  msgObj.data.ids.forEach(aNode => ex_class[parseInt(aNode.id)] = false);
    		  promise = (msgObj.data.doRender? render() : Promise.resolve());
    		  break;
		  case "toggle_filter":
			  plugin_execute_on_node(msgObj.data.node, 'toggle_filter');
			  break;
    	  case "plugin_layer":
    	  	  let plugin = PLUGINS[msgObj.data.plugin];
    	  	  if(plugin) {
			  	  let f = plugin.getFetcher();
	    	  	  if(f) {
					 enableFetch(f, msgObj.data.is_enabled, msgObj.data.plugin);
				  }
			  }

    		  plugin_execute_on_node(msgObj.data, 'toggle_filter');
    		  if (msgObj.data.doRender) {
	    		  promise = render()
	    		  .then(render_data => {
	    			  return render_data.business_result.then(function(oms_count){
	    				  render_data.plugin_response['oms_count'] = oms_count;
	        			  response_data = render_data.plugin_response;
	            		  return render_data.business_result;
	    			  });
	    		  });
              } else {
                  promise = Promise.resolve();
              }
    		  break;
    	  case "enableFetch":
    		  enableFetch(msgObj.data.fetcherName, msgObj.data.enabled, msgObj.data.voter);
    		  break;
    	  case "badge_element_select_event_fromdom":
    		  plugins_execute("badge_element_select_event_fromdom", msgObj.data.id);
    		  break;
    	  case "badge_element_select_event_fromdom_by_name":
    		  plugins_execute("badge_element_select_event_fromdom_by_name", msgObj.data.id);
    		  break;
    	  case "pluginContext":
    		  promise = new Promise(function(resolve){
        		  var _plugin = PLUGINS[msgObj.pluginId];
        		  _plugin.setContext(msgObj.context);
				  if (msgObj.context.elements?.length > 0) {
					lightenMap(msgObj.context.elements.map(e => { return e.id }));
				  } else {
					lightenMap([]);
				  }
        		  resolve();
    		  });
    		  break;
    	  case "filterclasses":
    		  filterclasses.push(parseInt(msgObj.data));
    		  promise = render();
    		  break;
    	  case "measuringTape":
    		  startMeasuring();
    		  break;
    	  case "agregarPaT":
    		  promise = agregar_pat(msgObj.id_con,msgObj.pi,msgObj.pc,msgObj.pv,msgObj.time,msgObj.fun).then(function(data){
    			  response_data = data;
    			  return response_data
    		  });
    		  break;
    	  case "quitarPaT":
    		  promise = quitar_pat(msgObj.id_con,msgObj.time,msgObj.fun).then(function(data){
        			  response_data = data;
        	    	  return response_data
        	      });
    		  break;
    	  case "agregarTCT":
    		  promise = agregar_tct(msgObj.id_obj,msgObj.time).then(function(data){
    			  response_data = data;
    			  return response_data
    		  });
    		  break;
    	  case "quitarTCT":
    		  promise = quitar_tct(msgObj.id_obj, msgObj.time).then(function(data){
    			  response_data = data;
    			  return response_data
    		  });
    		  break;
    	  case "operar":
    		  promise = operar(msgObj.id_obj, msgObj.cDate, msgObj.timeout).then(function(data){
    			  response_data = data;
    			  if(data && !data.st){
    				  response_data = eval("OPER="+data);
    			  }
    			  return response_data;
    		  });
    		  break;
    	  case "agregarGen":
				promise = handleGeneratorCreation(
					msgObj.id_elem,
					msgObj.time,
					msgObj.presetCoordinates
				).then(function(data) {
					response_data = data;
					return response_data;
				});
    		  break;
    	  case "agregarCC":
    		  promise = agregar_CC(msgObj.id_con, msgObj.pc, msgObj.time).then(function(data){
		    			  response_data = data;
		    			  return response_data;
		    		  });
    		  break;
    	  case "quitarCC":
    		  promise = quitar_CC(msgObj.id_con, msgObj.time).then(function(data){
    			  response_data = data;
    			  return response_data;
    		  });
    		  break;
    	  case "quitarGen":
    		  promise = quitar_gen(msgObj.data, msgObj.gen_req, msgObj.time).then(function(data){
    			  response_data = data;
    	    	  return response_data
    	      });;
    		  break;
    	  case "agregarPuenteAlVuelo":
    		  promise = agregar_ptevlo(msgObj.desde, msgObj.hasta, msgObj.time).then(function(data){
    			  response_data = JSON.parse(data);
    			  if(response_data.st){
    				  response_data.st=parseFloat(response_data.st); 
    			  }
    	    	  return response_data
    	      });
    		  break;
    	  case "quitarPuenteAlVuelo":
    		  promise = quitar_ptevlo(msgObj.id_temp, msgObj.time,  msgObj.drill).then(function(data){
    			  response_data = JSON.parse(data);
    			  if(response_data.st){
    				  response_data.st=parseFloat(response_data.st); 
    			  }
    	    	  return response_data
    	      });
    		  break;
     	  case "cambiarEstados":
    		  promise = cambiarEstados(msgObj.obj)
    		  break;
    	  case "setUserLogged":
    		  setUserLogged(msgObj.user);
    		  break;
    	  case "closeInnerPanels":
    		  closeInnerPanels();
    		  break;
    	  case "openInnerPanels":
    		  promise = openInnerPanels(msgObj.data).then(function(data){
    			  response_data = data;
    	    	  return response_data
    	      });
    		  break;
    	  case "highlights":
    		  if(msgObj.data.elem_type != 0){
    			  promise = extend_zoom_objs(msgObj.data.elem_type, msgObj.data.ids_list);
    		  } else {
    			  webSocketAdds.extend = true;
    			  webSocketAdds.highlighting = msgObj.data.highlight;
    			  webSocketAdds.request = {};
    			  webSocketAdds.request.elementIds = msgObj.data.ids_list;
    			  promise = fetch();
    		  }
        	  break;
		  case "lightenMap":
				promise = lightenMap(msgObj.data.ids_list);
				break;
		  case "setBadgesToShow":
				promise = setBadgesToShow(msgObj.data.ids_list);
				break;
    	  case "highlightNetElements":
    			  webSocketAdds.highlighting = true;
    			  webSocketAdds.request = {};
    			  webSocketAdds.request.elementIds = msgObj.data.ids_list;
    			  promise = fetch();
        	  break;
    	  case "unhighlight":
    		  webSocketAdds.extend = false;
    		  webSocketAdds.highlighting = false;
    		  webSocketAdds.request.elementIds = [];
    		  highLights = {};
    		  highlightingBssType =-1;
    		  highlightingBssSpatialIds = [];
    		  highlightingBssSpatialElems = [];
    		  break;
    	  case "ready":
    		  console.log("Termino de cargar mapa");
    		  break;
    	  case "setMapOptions":
    		  setMapOptions(msgObj.options);
    		  break;
    	  case "setHoverTime":
    		  setHoverTime(msgObj.data.time);
    		  break;
    	  case "resize":
    		  onResize();
    		  break;
    	  case "getCoordinates":
    		  response_data = { x1, y1, x2, y2};
    		  promise = Promise.resolve();
    		  break;
    	  case "getCoordinatesLL":
    		  response_data = {x1, y1, x2, y2,lat1,lat2,lon1,lon2}
    		  promise = Promise.resolve();
    		  break;
     	  case "getStats":
    		  promise = getStats();
    		  promise.then(function(response){
	    		  response_data = {stats:STATS};
    		  });
    		  break;
    	  case "close":
    		  window.close();
    		  break;
    	  case "click":
    		  clicked();
    		  break;
    	  case "mapMode":
    		  promise = change_map_mode(msgObj.data);
    		  break;
    	  case "findData":
    	      promise = new Promise(function(resolve,reject){
    	    	  
    	    	find_data_obj(msgObj.data).then( function(data){
    	    	
    		 		let EDIT = returnEdit()
    		 		
    		 	   var replace = Config.energize_replace_elements.find(item => item.from==data.class)
    	            if(replace){
    	                 data.class = replace.to;
    	                 data.gs = [get_gs(replace.to)]
    	            }
    	        

    	    	
   	    	    		EDIT.tmp.translate = null;
    	    			EDIT.mode = E_NNSS;
    	    			EDIT.drawing = false;
    	
    	    			data.obj = {}
    	    			data.Offset = 8
						data.Position= 1
						data.Rotatable= true
						data.Rotate= true
						data.Scalable = false
						data.Snap = 15
						data.snap = 5
						data.angle = 0
						data.offset = 8
    	    			
    	    			data.Clazz = data.class;
    	    			data.is_new = true;
    	    			data.delete_id = data.id
    	    			data.id = EDIT.next_id -1;
    	    			data.desc = CLASSES[data.Clazz].description
    	    			 		
    	    			
    	    			setTimeout(function(){
    	    				data.data = data
    	    				EDIT.objs.push(data.data)    
    	    				data.pos = canvas.inverse(data.x,data.y)
    	    				Object.assign(data, {x:data.x, y:data.y, id:data.id});},1000)
        
						var panel = getPanelVincular()
   	    	 // editVincular(data2)
   	    	
    	    			response_data = {
   	    			  
	   	    			  data : data,
	   	    			  canvasInverse:canvas.inverse(data.x, data.y),
	   	    			
	   	    			  open_trx : open_trx(),
	   	    			  panelVincular : panel,
   	    			  
   	    			  
    	    			}
    	    			
    	    			
	   	    	  $("#edt-nombre").html("vincular")
	   	    	  $("#nnssPotencial1").css("display","none") 
	   	    	  $("#nnssPotencial2").css("display","none")
   	    	 	       
   	    	 
	   	    	  resolve()
    	     
    	      }).catch(function(e) {
  	            console.error(JSON.stringify(e))
	            reject(function(error){alert(error)})
    	        });
    	  
    		
    		   
    	 
    	      })
    	       break;
    	  case "getObjectData":
	    	  getObjectbyId(msgObj.id)
	    	  break;
    	  case "geocoder":
    		  promise = callGeocoder(msgObj.data);
    		  break;
    	  case "initialChangeColor":
    		  set_current_color(msgObj.data/*, msgObj.mode*/);
    		  plugins_execute("on_initial_change_color");
    		  break;
    	  case "changeColor":
    		  set_current_color(msgObj.data.colorValue/*, msgObj.mode*/);
    		  plugins_execute("on_change_color");
    		  promise = render();
    		  innerRefresh(get("inner_window"));
    		  for (var key in panZoomInnerWord_array ){
    			  innerRefresh(get("inner_window-"+key));
    		    }
    		    
    		  if(msgObj.data.notify === true){
				post_event("color_changed", {table:'coloreo', selectedOption: msgObj.data.colorValue})
			  }
    		  break;
    	  case "getElecticChain":
    		  promise = new Promise(function(resolve){
     			 response_data = getElectricChain(msgObj.data);
     			 resolve();
     		  });
    		  break;
    	  case "edt_msg":
    		  promise = new Promise(function(resolve){
     			 response_data = edt_msg(msgObj.data);
     			 resolve();
     		  });
    		  break;
      	  case "renderMap":
    		  promise = new Promise(function(resolve){
     			 response_data = render();
     			 resolve();
     		  });
    		  break;
      	  case "editVincular":
    		  promise = new Promise(function(resolve){
     			 response_data = editVincular(msgObj.data);
     			 resolve();
     		  });
    		  break;
    	  case "editVincular2":
    		  promise = new Promise(function(resolve){
     			 response_data = editVincular2(msgObj.data);
     			 resolve();
     		  });
    		  break;
    	  case "setSuministroNNSS":
    		  promise = new Promise(function(resolve){
     			 response_data = setSuministroNNSS(msgObj.data);
     			 resolve();
     		  });
    		  break;
      	  case "pushEdit":
    		  promise = new Promise(function(resolve){
     			 response_data = pushEdit(msgObj.data);
     			 resolve();
     		  });
    		  break;
    	  case "opacity":
    		  curr_opacity = msgObj.data;
    		  get("map-overlay").style.opacity = curr_opacity;
    		  break;
    	  case "getOpacity":
    		  promise = new Promise(function(resolve){
    			 response_data = curr_opacity;
    			 resolve();
    		  });
    		  break;
    	  case "initialVisualizationMode":
    		  on_change_mode(msgObj.mode);
    		  break;
    	  case "visualizationMode":
    		  on_change_mode(msgObj.mode);
    		  promise = fetch();
    		  break;
    	  case "initialProyectMode":
    		  changeProjectModeVisualization(msgObj.mode);
    		  break;
    	  case "proyectMode":
    		  changeProjectModeVisualization(msgObj.mode);
    		  promise = render();
    		  break;
    	  case "visualizationSwitch":
    		  on_change_switch(msgObj.mode);
    		  promise = fetch();
    		  break;
    	  case "visualizationCheck":
    		  promise = new Promise(function(resolve,reject){
        		  let option = visualizationChecks.find(elem => elem.name == msgObj.name);
        		  if (option) {
        			  let p = option.mode();
        			  // si el cambio de modo devuelve una promesa, esperamos
        			  if (p && typeof(p) == "Promise") 
        				  p.then(function() {resolve()})
        			  else
        				  resolve();
        		  } else {
        			  reject({st: 1, msg:"modo de visualización desconocido: " + msgObj.name});
        		  }
    		  });
    		  break;
    	  case "streetView":
    		  promise = open_street_view(msgObj.data.lat, msgObj.data.lon);
    		  break;
    	  case "mapView":
    		  promise = open_map_view(msgObj.data.lat, msgObj.data.lon);
    		  break;
    	  case "changeProfile":
    		  promise = on_change_profile(msgObj.profile);
    		  break;
    	  case "changeTime":
    		  promise = fetch_time(msgObj.date);
    		  break;
    	  case "newTendidoProvisorio":
    		  promise = newTendidoProvisorio(msgObj.data);
    		  break;
    	  case "deleteTendidoProvisorio":
    		  promise = deleteTendidoProvisorio(msgObj.data);
			break;
		  case "editNNSS":
		  	  promise = editNNSSmap(msgObj.data);
		    break;
    	  case "edit":
    		  promise = start_edit_mode()
    		  .then(response => response_data = response);
    		  break;
    	  case "updateTendidoProvisorio":
    		  promise = updateTendidoProvisorio(msgObj.data);
    		  break;
    	  case "updateWS":
    		  updateByWS(msgObj.data);
    		  break;
    	  case "updateNoCom":
    		  updateNoCom(msgObj.data);
    		  break;
    	  case "loadPlugin":
    		  promise = loadPlugin(msgObj.plugin,msgObj.external);
    		  break;
    	  case "destroy":
    		  promise = new Promise(function(resolve){
      			 response_data = destroy();
      			 resolve();
      		  });
    		  break;
    	  case "pickPoint":
    		  changePickPoint();
    		  break;
    	  case "changeConfigFlag":
    		  if(Config[msgObj.data.name]!=undefined){
    			  Config[msgObj.data.name] = msgObj.data.value;
    			  promise = render();
    		  }
    		  break;
		  case "initCromoLayersMap":
			  if (typeof capasExternasMapaPlugin != 'undefined') {
			    capasExternasMapaPlugin.init(channel);
			  }
			  break;
		  case "initCromoLayersList":
			  if (typeof capasExternasMapaPlugin != 'undefined' &&
			  		msgObj.data.layers) {
			  	capasExternasMapaPlugin.setLayers(msgObj.data.layers);
			  }
			  break
		  case "selectLayer":
			  if (typeof capasExternasMapaPlugin != 'undefined') {
			  	capasExternasMapaPlugin.toggleLayer(msgObj.data.layer);
			  }
			  break;
		  case "deleteBookmarkPin":
  			  promise = deleteBookmarkPin(msgObj.X, msgObj.Y);
  			  break;
		  case "openCromoFoWithOE":
			  plugins_execute("openCromoFoWithOE", msgObj.data);
			  break;
    	  default:
    		  console.log("mapChannelServer: No se entendio el tipo de mensaje recibido");
    		  break;
    	}
    	if(promise){
    		promise
    		.then(function(result){
    			let response = {
            			type:"response",
            			id:msgObj.id
            	};
    			if (response_data != undefined) {
    				response["data"] = response_data;
    			} else if (result != undefined) {
    				response["data"] = result;
				}
        		post(response);
    		})
    		.catch(function(e){
    			let response = {
            			type:"response",
            			id:msgObj.id
            	};
    			if (e) {
    				response["error"] = e.stack? e.stack : e;
    			}
        		post(response);
    		});
    	}
    };

    var post_event = function(event_type, data){
    	post({
    		type:"event",
    		event:event_type,
    		mapId:chName,
    		data:data
    	});
    };

    // Close the channel when you're done.
    var close = function (){
    		channel.postMessage ('{"type":"close"}');
    		channel.close();
    	};
    
	return {
		close:close,
		post:post,
		post_event:post_event
	}

}