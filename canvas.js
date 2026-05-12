function Canvas(d,content) {
    var xlink = 'http://www.w3.org/1999/xlink';

    // Normalización visual de símbolos de centros (opción A)
    // Permite unificar tamaño sin tocar la geometría base de GRAPHICS.
    var UNIFORM_CENTER_TRIANGLE = {
        enabled: true,
        scale: 0.5,
        yOffset: 1.35,
        classScale: {},
        classYOffset: {},
        classes: new Set([
            1182,1183,1184,1185,1186,1187,1188,
            1254,1255,1256,1257,1258,1259,1260,1261,
            1271,1272,1273,1274,1275,1276,1277,1278,
            1279,1280,1281,1282,1283,1284,1285,1286
        ])
    };

    var getUniformSymbolTransform = function(classId, baseScale, baseY) {
        if (!UNIFORM_CENTER_TRIANGLE.enabled) return { scale: baseScale, y: baseY };
        var normalizedClassId = parseInt(classId, 10);
        if (!UNIFORM_CENTER_TRIANGLE.classes.has(normalizedClassId)) return { scale: baseScale, y: baseY };
        var classScale = UNIFORM_CENTER_TRIANGLE.classScale[normalizedClassId] || 1;
        var classYOffset = UNIFORM_CENTER_TRIANGLE.classYOffset[normalizedClassId] || 0;
        return {
            scale: baseScale * UNIFORM_CENTER_TRIANGLE.scale * classScale,
            y: baseY + UNIFORM_CENTER_TRIANGLE.yOffset + classYOffset
        };
    };

    if (typeof window !== 'undefined' && window.CROMO_UNIFORM_CENTER_TRIANGLE) {
        Object.assign(UNIFORM_CENTER_TRIANGLE, window.CROMO_UNIFORM_CENTER_TRIANGLE);
        if (Array.isArray(UNIFORM_CENTER_TRIANGLE.classes)) {
            UNIFORM_CENTER_TRIANGLE.classes = new Set(UNIFORM_CENTER_TRIANGLE.classes.map(function(v){return parseInt(v,10);}));
        }
    }

    this.parent = get(content); 
    this.width = 0;
    this.height = 0;
    this.left = 0;
    this.top = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttributeNS( xlink, 'xlink', xlink );
    this.svg.setAttribute('id',content+'_svg'); 
    this.parent.appendChild( this.svg );

    this.svgNS = this.svg.namespaceURI;
    this.paper = d.createElementNS(this.svgNS,'g');
    this.paper.setAttribute('id', content+'_svg_g');
    this.paper.setAttribute('fill','none');
    this.svg.appendChild(this.paper);

    this.empty = function() { 
        $("#"+content+"_svg_g").empty(); 
        get('tt_street').visibility('hidden');
    }   

    this.circle = function(cx,cy,r,attr) {
        var o = d.createElementNS(this.svgNS,'circle');
        o.setAttribute('cx',cx);
        o.setAttribute('cy',cy);
        o.setAttribute('r',r);
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        this.paper.appendChild(o);
        return o;
    }
    this.use = function(ref,attr) {
        var o = d.createElementNS(this.svgNS,'use');
        o.setAttributeNS( xlink, 'xlink:href', '#'+ref );
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        this.paper.appendChild(o);
        return o;
    }
    
    this.text = function(text, attr) {
        var o = d.createElementNS(this.svgNS,'text');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        var t = d.createTextNode(text);
        o.appendChild(t);
        this.paper.appendChild(o);
        return o;
    }
    
    this.line = function(from_x,from_y,to_x,to_y,attr) {
        var o = d.createElementNS(this.svgNS,'line');
        o.setAttribute( 'x1', from_x );
        o.setAttribute( 'y1', from_y );
        o.setAttribute( 'x2', to_x );
        o.setAttribute( 'y2', to_y );
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        this.paper.appendChild(o);
        return o;
    } 

    this.group = function(id,cid,x,y,color,rot,sc,sx,sy) {
        var g = d.createElementNS(this.svgNS,'g');
        if (rot!=undefined && sx!=undefined && sy!=undefined) {
            var normalized = getUniformSymbolTransform(cid, sc === undefined ? 1 : sc, y);
            sc = normalized.scale;
            y = normalized.y;
            if(sc != 0 ){
               sx = sc*sx;
               sy = sc*sy;
            }
	        var r = 'translate('+x+","+y+') rotate('+rot+',0,0) scale('+sx+','+sy+')' ;
	        g.setAttribute('transform',r);
        } else if (rot!=undefined) {
            var r = 'rotate('+rot+')';
            g.setAttribute('transform',r);
        }
        if (color) {
        	if(color.hasOwnProperty("clazz")){
        		g.classList.add(color.clazz)
        	} else {
                g.setAttribute('stroke',color);
        	}
        }
        if (id) g.setAttribute("id", id);
        if (cid) g.setAttribute("class",'c_'+cid );
        
        return g;
    }

    this.create_group = function(attr) {
        var g = d.createElementNS(this.svgNS,'g');
        if (attr) {
            for (var key in attr) {
                g.setAttribute( key, attr[key] );
            }
        }
        return g;
    }
    
    this.append = function(el) {
        this.paper.appendChild(el);
        return el;
    }
    this.appendBefore = function(el,node) {
        this.paper.insertBefore(el,node);
        return el;
    }

    this.create_circle = function(attr,color,lw) {
        var o = d.createElementNS(this.svgNS,'circle');
        if (attr) {
            for (var key in attr) {
            	if(key=='stroke'){
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.clazz);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
                            o.setAttribute(key, attr[key]);
            			}
            		}
            	} else if(key=='fill'){
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.fill);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
                            o.setAttribute(key, attr[key]);
            			}
            		}
            	}else {
            		o.setAttribute( key, attr[key] );
            	}
            }
        }
        if (lw && o.getAttribute('stroke-width') == undefined)
            o.setAttribute('stroke-width',lw);
        return o;   
    }

    this.make_point = function(x,y) {
        var point = this.svg.createSVGPoint();
        point.x = x;
        point.y = y;
        return point;
    }
    this.screen_point = function(x,y) {
        var matrix = this.svg.getScreenCTM().inverse(),
            p = this.make_point(x,y),
            ret = p.matrixTransform(matrix);
        return ret;    
    }
    this.event_point = function(evt) {
        var point = this.svg.createSVGPoint()
        point.x = evt.clientX
        point.y = evt.clientY
        return point
    }
    this.get_point = function(evt) {
        var matrix = this.svg.getScreenCTM().inverse(),
            p = this.event_point(evt),
            ret = p.matrixTransform(matrix);
        return ret;    
    }

    this.create_line = function(attr,color,lw) {
        var o = d.createElementNS(this.svgNS,'line');
        if (attr) {
            for (var key in attr) {
            	if(key=='stroke'){
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.clazz);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
                            o.setAttribute(key, attr[key]);
            			}
            		}
            	} else if(key=='fill'){
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.fill);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
                            o.setAttribute(key, attr[key]);
            			}
            		}
            	}else {
            		o.setAttribute( key, attr[key] );
            	}
            }
        }
        if (lw && o.getAttribute('stroke-width') == undefined)
            o.setAttribute('stroke-width',lw);
        return o;
    }

    this.create_text = function(text, attr) {
        var o = d.createElementNS(this.svgNS,'text');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        var t = d.createTextNode(text.slice(0, 3));
        o.appendChild(t);
        return o;
    }

    this.create_textPath = function(text, ref, attrtext, attrtextpath) {
        var o = d.createElementNS(this.svgNS,'text');
        o.setAttribute("id",'txt_'+ref);   
        if (attrtext) {
            for (var key in attrtext) {
            	o.setAttribute( key, attrtext[key] );
            }
        }
        
        var textpath = d.createElementNS(this.svgNS,"textPath");
        textpath.setAttribute('href', '#'+ref);   
        var textNode = d.createTextNode(text);
        textpath.appendChild(textNode); 
        textpath.setAttribute("startOffset","50%");
		textpath.setAttribute("text-anchor","middle");
        if (attrtextpath) {
            for (var key in attrtextpath) { 
            	textpath.setAttribute( key, attrtextpath[key] );
            }
        }
        o.appendChild(textpath);
        
        return o;
    }
    
    
    this.create_path = function(attr,color,lw) {
        var o = d.createElementNS(this.svgNS,'path');
        if (attr) {
            for (var key in attr) {
            	if(key=='stroke'){
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.clazz);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
            				o.setAttribute(key, attr[key] );
            			}
            		}
            	} else if(key=='fill'){
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.fill);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
                            o.setAttribute(key, attr[key]);
            			}
            		}
            	} else if(key=='class') {
                    if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.fill);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			} else {
                            o.setAttribute(key, attr[key]);
            			}
                    }
            	}else {
            		o.setAttribute( key, attr[key] );
            	}
            }
        }
        if (lw && o.getAttribute('stroke-width') == undefined)
            o.setAttribute('stroke-width',lw);
        return o;
    }
    this.create_use = function(ref,attr) {
        var o = d.createElementNS(this.svgNS,'use');
        if (ref) {
        	o.setAttributeNS( xlink, 'xlink:href', '#'+ref );
        }
        if (attr) {
            for (var key in attr) {
            		o.setAttribute( key, attr[key] );
            }
        }
        return o;
    }
    this.create_rect = function(attr) {
        var o = d.createElementNS(this.svgNS,'rect');
        if (attr) {
            for (var key in attr) {
                //if (key=='stroke-width') continue;
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    }   

    this.create_filter = function(attr) {
        var o = d.createElementNS(this.svgNS,'filter');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    }   
    this.create_blur = function(attr) {
        var o = d.createElementNS(this.svgNS,'feGaussianBlur');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    } 
    
    this.create_defs = function(attr) {
        var o = d.createElementNS(this.svgNS,'defs');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    } 
    
    this.create_custom_element = function(name, attr) {
        var o = d.createElementNS(this.svgNS, name);
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    } 

    this.create_marker = function(attr) {
        var o = d.createElementNS(this.svgNS,'marker');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    }   

    this.create_animate_transform = function(attr) {
        var o = d.createElementNS(this.svgNS,'animateTransform');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    }   

    this.create_animate = function(attr) {
        var o = d.createElementNS(this.svgNS,'animate');
        if (attr) {
            for (var key in attr) {
                o.setAttribute( key, attr[key] );
            }
        }
        return o;
    }   

    this.rect = function(attr) {
        var o = this.create_rect(attr);
        this.paper.appendChild( o );
    }

    this.text = function(text,attr,attrcus) {
        var o = d.createElementNS(this.svgNS,'text');
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if (attrcus)
            for (var key in attrcus) 
                o.setAttribute( key, attrcus[key] );
        var t = d.createTextNode(text);
        o.appendChild(t);
        this.paper.appendChild(o);
        return o;
    } 

    this.create_text = function(text,attr) {
        var o = d.createElementNS(this.svgNS,'text');
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if(text == undefined){
        	
        	text = "";
        }
        var t = d.createTextNode(text);
        o.appendChild(t);
        return o;
    } 

    this.create_polygon = function(da,attr,attrcus) {
        var o = d.createElementNS(this.svgNS,'polygon');
        o.setAttribute('points',da);
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if (attrcus)
            for (var key in attrcus) 
                o.setAttribute( key, attrcus[key] );
         
        return o;
    }   

    this.create_element = function (name) {
        var o = d.createElementNS(this.svgNS,name);
        return o;
    }

    this.polygon = function(da,attr,attrcus) {
        var o = d.createElementNS(this.svgNS,'polygon');
        o.setAttribute('points',da);
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if (attrcus)
            for (var key in attrcus) 
                o.setAttribute( key, attrcus[key] );
         
        this.paper.appendChild(o);
        return o;
    }   

    this.test = function() {
        var a = canvas.create_animate({
            attributeName:"opacity",
            attributeType:"XML",
            begin:"0s",
            dur:"3s",
            fill:"remove",
            from:"0",
            to:"1",
            repeatCount:"indefinite"});
        return a;
    }

    this.angle = function(ang,x,y) {
        var c = this.paper;
        var a = 0;
        var inter;
        var dur = 3000;
        var fr = 25;
        var count = dur/fr;
        var inc = (ang-a) / count;
        inter = setInterval( function() { 
            c.setAttribute("transform","rotate("+a+","+x+","+y+") translate(0,"+(canvas.height)+") scale(1,-1)");   
            a += inc;
            if (a>ang) {
                clearInterval(inter);
                c.setAttribute("transform","rotate("+a+","+x+","+y+") translate(0,"+(canvas.height)+") scale(1,-1)");   
            }
        }, fr );     
    }

    this.create_polyline = function(da,attr,attrcus, color) {
        var o = d.createElementNS(this.svgNS,'polyline');
        o.setAttribute('points',da);
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if (attrcus)
            for (var key in attrcus) 
                o.setAttribute( key, attrcus[key] );
        if(color){
        	if(color.hasOwnProperty("clazz")){
            	o.classList.add(color.clazz);
        	} else {
        		o.setAttribute('stroke', color);
        	}
        }
        return o;
    }

    this.polyline = function(da,attr,attrcus,skipAppend, color) {
        var o = d.createElementNS(this.svgNS,'polyline');
        o.setAttribute('points',da);
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if (attrcus)
            for (var key in attrcus) 
                o.setAttribute( key, attrcus[key] );
        if (!skipAppend)
        	this.paper.appendChild(o);
        if(color){
        	if(color.hasOwnProperty("clazz")){
            	o.classList.add(color.clazz);
        	} else {
        		o.setAttribute('stroke', color);
        	}
        }
        return o;
    }

    this.glow_polyline = function( da, id, lw, color, clazz, fun ) {
        var ret = [];
        var op = 1.0;
        for (var i =0;i<2;i++) {
            var o = document.createElementNS(this.svgNS,'polyline');
            lw *= 1.5;
            op -= 0.25;
            o.onclick = fun;
            o.setAttribute('id',id);
            o.setAttribute('points',da);
            o.setAttribute('stroke',color);
            o.setAttribute('stroke-width', lw );
            o.setAttribute('style','stroke-linejoin:round;stroke-linecap:round;stroke-opacity:'+op);
            this.paper.appendChild(o);
            ret.push(o)
        }
        return ret;
    }

    this.toFront = function(el) {
        this.paper.appendChild(el);
    }
    this.toBack = function(el) {
        this.paper.insertBefore( el, this.paper.firstChild );
    }
    this.cc = function(e) {
        return {
            x: e.clientX/scale + x1,
            y: (this.height-e.clientY)/scale + y1
        };
    }

    this.inverse = function(x,y) {
        return {
            x: x/scale + x1,
            y: (this.height-y)/scale + y1
        };
    }

    this.inverse_x = function(x) {
        return x/scale + x1;
    }

    this.inverse_y = function(y) {
        return (this.height-y)/scale + y1;
    }

    this.xy_to_svg = function(x,y) {
    	return {
    		x: this.x_to_svg(x),
    		y: this.y_to_svg(y)
    	};
    }
	
    this.point_to_xy = function(x,y) {
    	return {
    		x: x/scale + x1,
    		y: y/scale + y1
    	};
    }
    this.point_to_xy_by_new_flat = function(x,y,newScale, newX1,newY1) {
    	return {
    		x: x/newScale + newX1,
    		y: y/newScale + newY1
    	};
    }
    this.x_to_svg = function(x) {
        return (x - x1) * scale;
    	
    }
    
    this.y_to_svg = function(y) {
        return (y - y1) * scale;
    }
    
    this.offset = function(x,y) {
        this.offsetX = x;
        this.offsetY = y;
        this.svg.setAttribute( "viewBox", x + " " + y + " " + this.width + " " + this.height );
    }

    this.stop_anim = function(inter) {
        if (inter) 
            clearInterval(inter);  
        inter = null;  
    }

    this.anim_opacity = function(el,from,to,dur) {
        var fr = 25;
        var count = dur/fr;
        var inc = (to-from) / count;
        var v = from;
        var i = 0;

        var inter = setInterval( function() { 
            el.setAttribute("fill-opacity",v);   
            v += inc;
            i++;
            if (i>count) {
                clearInterval(inter);
                el.setAttribute("fill-opacity",to);   
            }
        }, fr );    
        return inter; 
    } 

    this.reset_transform = function() {
        this.paper.setAttribute("transform","translate(0,"+(this.height)+") scale(1,-1)");
    }

    this.svg.onmouseup = function(event) {
        if (EDIT.mode==E_BLOCK) {
            var x = event.layerX,
                y = canvas.height - event.layerY;
            console.log('click up');

            $(".selection").remove();

            var o = canvas.create_circle({class:'p-point',r:5,cx:x,cy:y});    
            canvas.append(o); 

            EDIT.points.push( {x:x,y:y} );
            
            if (EDIT.points.length>=3) 
                get('edt_manzana_ok').class_del('not-active-2');

            if (EDIT.points.length>1) {
                var p = EDIT.points[ EDIT.points.length-2 ];
                canvas.line( x, y, p.x, p.y, {'stroke-width':1,stroke:'#A00'} );
            }
        } else if (EDIT.tmp.obj)
            EDIT.tmp.obj.onmouseup( event );
    }

    this.svg.onclick = function(event) {
		if(Config.nnssVersion == 1){
			setNNSS(event);
    		return;	
		}
		
		if (canvas.ignore_onclick) {
			return;
		}
		
        var x = event.layerX,
            y = canvas.height - event.layerY;

        if (EDIT.mode==E_NNSS && EDIT.drawing) {
            //open_trx();

            if (canvas.svg.style.cursor == 'not-allowed')
                return;

            canvas.svg.style.cursor = 'default';

            for (var i=0;i<MANZANAS.length;i++) {
                var a = MANZANAS[i];
                if (a.is_over) {
                    a.is_over = false;
                    if (a.obj != null) {a.obj.classList.remove("p-hover-manzana");};    
                }
            } 
            
     
        	var element = EDIT.objs[EDIT.objs.length - 1];
        	element.Angle = element.Rotate ? EDIT.angle + element.Angle :  element.Angle
        	element.desc = CLASSES[element.Clazz].description
     
        	if(element.NodeId != undefined){
        		
            var corteType = element.NodeId.indexOf("_")
            var elementType = element.NodeId.substring(0,corteType)
        	
        	if(elementType == "pilar"){
        		
        		var id = EDIT.next_id -4;
        	}else{
        		
        		var id = EDIT.next_id -10;
        	}
        		
        		
        	}else{
        		
        		var id = EDIT.next_id--;
        	}
        	
      
        	
        	
        	var gkx = x/scale+x1;
        	var gky = y/scale+y1;		
        			
        	var data = {'x': x,'y':y,'class':element.Clazz,'id':id, 'type':SYMBOL,'gs':[get_gs(element.Clazz)],'ang':element.Angle,'sc':1,'is_new':true, 'pos':{x:gkx,y:gky}, rel_dist:EDIT.dist};
        	
	        var cl = CLASSES[ element.Clazz ];
	        if (cl && cl.ports)
	           data.nodes = clone( cl.ports );
	        
	        data.rel_ang =  (element.Angle - EDIT.angle);
	        
	    	DATA.push( data );
	    	element.data = data;
          
            EDIT.drawing = false;
	    	edt_msg();
	    	edt_changes();
	    	
	    	const allRules = Object.assign(element, {x:x, y:y, id:id});
            
            edt_update_count(lista_tipos_potenciales);

        	if	(EDIT.tendido_provisorio) {
	        	$('#on-edit-tp').find('.icon-undo').removeClass('icon-desable').addClass('icon-active');
	        	$('#on-edit-tp').find('.icon-next').removeClass('icon-desable').addClass('icon-active');
	        	
	        	if (!EDIT.tendido_provisorio.undo) {
	        		EDIT.tendido_provisorio.undo = [];
	        	}
	        	
	        	// EDIT.mode = 0;   // hace que no se pueda mover el Generador insertado
	        	
	        	var btnLockUnlock = $('#btn-lock-unlock');
	        	
	        	EDIT.tendido_provisorio.undo.push({
            		type: 'added',
            		tmp: {
            			id: EDIT.objs[EDIT.objs.length - 1].id,
            			index: EDIT.objs.length - 1,
            			draggable: btnLockUnlock.find('.icon').hasClass('icon-lock') ? true : false
            		}
            	});
	        	
	        	if(btnLockUnlock.css('display') === 'none') {
	        		btnLockUnlock.show();
	        	}
	        }
            
            render();
            select_potential_element(element.id)
            return;
        }

        if (EDIT.mode_conn == 3 && EDIT.type_conn==2){
            do_conectar( EDIT.tmp.ofrom, EDIT.tmp.connector.id, EDIT.inter, x, y, EDIT.tmp.nfrom , EDIT.tmp.xf, EDIT.tmp.yf);
        }
    

        //channel.post_event("elementoSeleccionado", {name: "Fdgdfgd"});
        if (index<=1)    
            return;

        var arr_inside = [],
            minsup = Number.MAX_SAFE_INTEGER;

        for (var i=0;i<CURR_AREAS.length;i++) {
            var a = CURR_AREAS[i];
            if (!a.clipped && is_inside(x,y,a.arr_x,a.arr_y)) {
                arr_inside.push(a);
                if (a.supk<minsup) {
                    minsup = a.supk;
                }
            }
        }
        
      
        for (var i=0;i<arr_inside.length;i++) {
            var a = arr_inside[i];
            if (a.supk==minsup) {
                SELECTED_AREAS = set_selected_areas_item(SELECTED_AREAS,a.class,a.id_area);
                fetch(a.id_area);
           
/* TODO - ver como se reemplaza CROMO_MAP
				if (!CROMO_MAP.pickingOn())
//					stopEventPropagation(event);*/
					canvas.ignore_onclick = true;

                break;    
            }else{
            	
            	sessionStorage.setItem("areaSeleccionada" , a.name)
            }
        }
    }

    this.onkeyup = function(event) {
        if (event) {
            if (event.keyCode===13) {
                if (EDIT.mode == E_BLOCK) 
                    edt_manzana_ok();
            } else if (event.keyCode===27) {
                if (EDIT.mode==E_BLOCK||EDIT.mode==E_NNSS) 
                    cancel_proj();
            } else if (event.keyCode===34) { // page down
                goto_version( -1 );
            } else if (event.keyCode===33) { // page up
                goto_version( 1 );
            }
        }
    }

    this.svg.onmousemove = function(event) {

        var x = event.layerX,
            y = (canvas.height-event.layerY),
            arr_inside = [],
            minsup = Number.MAX_SAFE_INTEGER,
            del = false;

        if (EDIT.mode==E_BLOCK && EDIT.points && EDIT.points.length>0) {    
            $(".selection").remove();
            var p = EDIT.points[ EDIT.points.length-1 ];
            canvas.line( x, y, p.x, p.y, {class:'selection','stroke-width':0.1,stroke:'#000'} );
        }

        else if (EDIT.mode==E_NNSS && EDIT.drawing) {
            // Borra cualquier seleccion previa
            $(".selection").remove();
            var a, i, pos = canvas.inverse(x,y);
            get('edt-pos-ins').value = pos.x.toFixed(4)+','+pos.y.toFixed(4);
            get('edt-ang-block').value = '';
            get('edt-dist').value = '';

            EDIT.point = null;
            EDIT.angle = 0;
            EDIT.ang_rad = 0;
            EDIT.dist = 0;
            EDIT.pos = pos;

            //var opt = EDIT.objs[EDIT.objs.length - 1];
            var opt = CLASSES[ EDIT.clazz ];
            if (opt) opt = opt.edit;
            if (!opt) opt = {position:0};
            if (opt.Offset) opt.offset = opt.Offset;
            if (!opt.offset) opt.offset = 0;
            if (!opt.snap) opt.snap = 5; // 5 metros por default
            if (!opt.angle) opt.angle = 0; 


            for (i=0;i<MANZANAS.length;i++) {
                a = MANZANAS[i];
                a.intersect = null;
                if (is_inside(x,y,a.arr_x,a.arr_y)) {
                    arr_inside.push(a);
                } 
                if (a.is_over) {
                    a.is_over = false;
                    if (a.obj != null) {a.obj.classList.remove("p-hover-manzana");};   
                }
            }

            if (opt.position==1) {
                if (arr_inside.length==0) {
                    canvas.svg.style.cursor = 'not-allowed';
                    return;
                }
            } else if (opt.position==2) {
                if (arr_inside.length>0) {
                    canvas.svg.style.cursor = 'not-allowed';
                    return;
                }
            }

            canvas.svg.style.cursor = 'crosshair';
            var p = {x:x,y:y};
            var gr = 3;
            var min_i = -1;
            var o,dist;
            var min_dist = 99999;

            if (opt.position==2) {
                // Lado de afuera de la vereda
                var min_j = -1;

                for (var j=0;j<MANZANAS.length;j++) {
                    a = MANZANAS[j];
                    for (var i=0;i<(a.arr_x.length-1);++i) {
                        var p1 = {x:a.arr_x[i],y:a.arr_y[i]};
                        var p2 = {x:a.arr_x[i+1],y:a.arr_y[i+1]};
                        var o = intersect( p1, p2, p );
                        if (o) {
                            var dist = distance( o, p );
                            if (dist<min_dist) {
                                min_dist = dist;
                                min_j = j;
                                min_i = i;
                            }
                        }
                    }
                }
                if (min_i>=0) {
                    a = MANZANAS[min_j];
                    var p1 = {x:a.arr_x[min_i],y:a.arr_y[min_i]};
                    var p2 = {x:a.arr_x[min_i+1],y:a.arr_y[min_i+1]};
                    o = intersect( p1, p2, p );
                    if (o) {
                        a = find_angle( p1, p2 );
                        EDIT.dist = opt.offset*scale;
                        EDIT.point = point_at_dist( o, p, EDIT.dist ); 
                        EDIT.ang_rad = a;
                        EDIT.angle = Math.degrees( EDIT.ang_rad );
                        // Calcula linea de fuga, 100m para cada lado
                        p1 = polar( EDIT.point, 100*scale, a );
                        p2 = polar( EDIT.point, 100*scale, a + Math.PI );
                        canvas.line( p1.x, p1.y, p2.x, p2.y, {class:'selection','stroke-width':0.1,stroke:'#000'} );
                        canvas.line( EDIT.point.x, EDIT.point.y, o.x, o.y, {class:'selection','stroke-width':0.1,stroke:'#000'} );
                        canvas.circle( o.x, o.y, gr, {class:'selection',fill:'#600',stroke:'#600'});
                        var tr = 'translate('+o.x+","+o.y+') scale(10,-10)'; 
                        var txt = opt.offset+'m';
                        canvas.text( txt, {transform:tr,'dy':2, class:'p-sumi-altura selection'} );

                        get('edt-ang-block').value = EDIT.angle.toFixed(2);
                        get('edt-dist').value = (opt.offset / scale).toFixed(2);
                    }
                }
                return;
            }

            for (i=0;i<arr_inside.length;i++) {
                a = arr_inside[i];
                if (!a.is_over) {
                	if (a.obj != null) {a.obj.classList.add("p-hover-manzana");}; 
                    a.is_over = true;
                    break;
                }   
            }
            if (a && a.is_over) {
                for (i=0;i<(a.arr_x.length-1);++i) {
                    o = intersect( {x:a.arr_x[i],y:a.arr_y[i]}, {x:a.arr_x[i+1],y:a.arr_y[i+1]}, p );                    
                    if (o) {
                        dist = distance( o, p );
                        if (dist<min_dist) {
                            min_dist = dist;
                            min_i = i;
                        }
                    }
                }
                if (min_i>=0) {
                    o = intersect( {x:a.arr_x[min_i],y:a.arr_y[min_i]}, {x:a.arr_x[min_i+1],y:a.arr_y[min_i+1]}, p );   
                    if (o) {
                        dist = distance( o, p );
                        EDIT.ang_rad = find_angle( p, o );
                        EDIT.angle = Math.degrees( EDIT.ang_rad );
                        get('edt-ang-block').value = EDIT.angle.toFixed(2);
                        get('edt-dist').value = (opt.offset / scale).toFixed(2);
                        EDIT.dist = opt.offset;
                        if (dist<=(opt.snap*scale)) {
                            EDIT.inter = o;
                            EDIT.point = point_at_dist( o, p, opt.offset*scale ); 
                            canvas.line( x, y, o.x, o.y, {class:'selection','stroke-width':0.1,stroke:'#000'} );
                            canvas.circle( o.x, o.y, gr, {class:'selection',fill:'#600',stroke:'#600'});
                            var tr = 'translate('+o.x+","+o.y+') scale(10,-10)'; 
                            var txt = opt.offset+'m';
                            canvas.text( txt, {transform:tr,'dy':2, class:'p-sumi-altura selection'} );
                            

                        }
                    }
                }                
            }
            return;
        } else if ((EDIT.mode_conn == 1 || EDIT.mode_conn == 3) && EDIT.type_conn==2){
            EDIT.mode_conn = 3;
//            EDIT.tmp.o.appendChild(canvas.create_circle({id:'node',class:'p-connecting-node'}));
            $(".selection").remove();
            get('edt-ang-block').value = '';
            get('edt-dist').value = '';

            EDIT.point = null;
            EDIT.angle = 0;
            EDIT.ang_rad = 0;
            EDIT.dist = 0;

            var connectorsTMP = DATA.filter(data => data.type == CONNECTOR);
            var connectors = [];
            
            for (var i=0;i<connectorsTMP.length;++i) {
            	data = connectorsTMP[i];

            	if ((ex_class[data.class]===true || filterclasses.length > 0 && filterclasses.indexOf(data.class) === -1) && !data.is_new)
            		continue;

            	if (data.proyId && data.proyId!=proyId)
            		continue;
            	connectors.push(data);
            }
           
        
            
            var o;
            var p1_max,p2_max;
            var gr = 3;
            var max_dist = 0;

            for (var i=0;i<connectors.length;i++) {
                var points = connectors[i].points.split(" ")
                for(var j=0; j<points.length;j++){
                    if(!points[j+1]){
                        continue
                    }
                    var p1 = {x:parseInt(points[j].split(",")[0]),y:parseInt(points[j].split(",")[1])};
                    var p2 = {x:parseInt(points[j+1].split(",")[0]),y:parseInt(points[j+1].split(",")[1])};
                    o = line_intersect(x, y, EDIT.tmp.xf, EDIT.tmp.yf, p1.x,p1.y, p2.x, p2.y)
                    if (o) {
                        var dist = distance( o, {x:EDIT.tmp.xf,y:EDIT.tmp.yf} );
                        if (dist>max_dist) {
                            max_dist = dist;
                            p1_max= p1;
                            p2_max= p2;
                            EDIT.tmp.connector = connectors[i];
                        }
                    }
                }
            }

            if (max_dist>0) {
                o = line_intersect(x, y, EDIT.tmp.xf, EDIT.tmp.yf, p1_max.x,p1_max.y, p2_max.x, p2_max.y)
                if (o) {
                    dist = distance( o, {x:EDIT.tmp.xf,y:EDIT.tmp.yf} );
                    EDIT.ang_rad = find_angle( {x:EDIT.tmp.xf,y:EDIT.tmp.yf}, o );
                    EDIT.angle = Math.degrees( EDIT.ang_rad );
                    get('edt-ang-block').value = EDIT.angle.toFixed(2);
                    get('edt-dist').value = (max_dist / scale).toFixed(2);
                    EDIT.dist = max_dist;
                    EDIT.inter = o;

                    EDIT.point = point_at_dist( o, {x:EDIT.tmp.xf,y:EDIT.tmp.yf}, max_dist*scale ); 
                    canvas.line( EDIT.tmp.xf, EDIT.tmp.yf, o.x, o.y, {class:'selection','stroke-width':0.1,stroke:'#000'} );
                    canvas.circle( o.x, o.y, gr, {class:'selection',fill:'#600',stroke:'#600'});

                }
            }            
        }

        if (EDIT.mode!=E_NO && EDIT.drawing) {
            return;
        }
        
		CURR_AREAS.forEach(item => {
			if(item.id && AREANAMES[item.id])
				item.name = AREANAMES[item.id].name;
		});
		
        for (var i=0;i<CURR_AREAS.length;i++) {
            var a = CURR_AREAS[i];
            if (is_inside(x,y,a.arr_x,a.arr_y)) {
                arr_inside.push(a);
                if (a.supk<minsup)
                    minsup = a.supk;
            } 
            if (a.is_over) {
                del = true;
                a.is_over = false;
            	var h = y2 - y1;
                if(h <= 4000){
                	if(h <= 2015){
                		a.obj.classList.remove("p-hover-area-no-opacity-pointer-none");
                	} else {
                		a.obj.classList.remove("p-hover-area-low-opacity");
                	}
                } else {
                	a.obj.classList.remove("p-hover-area");
                }
                a.obj.classList.add("p-area");   
                a.obj.classList.add("c_"+a.class);   
                if (a.obj.txt) {
                    if (!Config.show_area_text)
                        a.obj.txt.setAttribute('fill-opacity',0);
                }               
            }
        }
        for (var key in CURR_AREAS_CLASS) {
            var o = getn('sel_a_'+key);
            // TODO: jgm
            // channel.post_event("drag_out_area", key);
            if (o) o.innerHTML = '';
        }

        for (var i=0;i<arr_inside.length;i++) {
            var a = arr_inside[i];
            if (!a.is_over && !a.clipped && a.supk==minsup) {
                if (a.obj.txt) {
                    a.obj.txt.setAttribute('fill-opacity', 1);
                }
                a.obj.classList.remove("p-area");   
                a.obj.classList.remove("c_"+a.class);   
                var h = y2 - y1;
                if(h <= 4000){
                	if(h <= 2015){
                		a.obj.classList.add("p-hover-area-no-opacity-pointer-none");
                	} else {
                		a.obj.classList.add("p-hover-area-low-opacity");
                	}
                } else {
                	a.obj.classList.add("p-hover-area");
                }
                a.is_over = true;
                canvas.toFront( a.obj );    
            }   
            var o = getn('sel_a_'+a.class);
            // TODO: jgm
            channel.post_event("drag_over_area", {area_class:a.class, name:a.name});
            if (o) o.innerHTML = a.name;
        }
        if (del) {
            for (var i=0;i<CURR_AREAS_SEL.length;i++) {
                var o = CURR_AREAS_SEL[i]; 
                canvas.toFront( o );
            }
        }
        if (EDIT.tmp.translate && isLeft(event)) {
	        var dx = event.offsetX - EDIT.tmp.x;
	        var dy = event.offsetY - EDIT.tmp.y;
	        
	        EDIT.tmp.translate[0] += dx;
	        EDIT.tmp.translate[1] -= dy;
	        
	        var p = canvas.inverse(event.offsetX,event.offsetY);
	        get('edt-position').value = p.x.toFixed(4)+','+p.y.toFixed(4);
	
	        var ref = DATA.find(obj => obj.id == EDIT.selected_id)
	        
	        if (ref && ref.tp) {
	            for (var j=0;j<ref.tp.length;j++) {
	                var o = get( ref.tp[j].id_to );
	                if (o && o.points) {
	                    var str = o.getAttribute('points').split(' ');
	                    var p = str[ ref.tp[j].nto ];
	                    p = p.split(',');
	                    var x = parseFloat(p[0]) + dx;
	                    var y = parseFloat(p[1]) - dy;
	                    if (ref.tp[j].nto==0) {
	                        p = x+','+y+' '+str[1];
	                    } else {
	                        p = str[0] + ' ' + x+','+y;
	                    }
	                    o.setAttribute('points',p);
	                }
	            }
	        }
	        

	        for (i=0; i<EDIT.objs.length; i++){
	        	if (EDIT.objs[i].id == EDIT.selected_id){
	        		EDIT.objs[i].data.pos.x = p.x;
	        		EDIT.objs[i].data.pos.y = p.y;
	        		break;
	        	}
	        }
	        
	        if	(EDIT.selected_id) {
		        var str = document.getElementById(EDIT.selected_id).getAttribute("transform");
		        var transform = str.split(' ');                        
		        var newMatrix = "translate(" + EDIT.tmp.translate[0] + ',' + EDIT.tmp.translate[1] + ") " +transform[1] +" "+transform[2];
		        document.getElementById(EDIT.selected_id).setAttribute("transform", newMatrix);
	        }

	        EDIT.tmp.x = event.offsetX;
	        EDIT.tmp.y = event.offsetY;
	        EDIT.tmp.obj = document.getElementById(EDIT.selected_id);
	        for (i=0; i<EDIT.objs.length; i++){
	        	if (EDIT.objs[i].id == EDIT.selected_id){
	        		EDIT.objs[i].data.pos.x = p.x;
	        		EDIT.objs[i].data.pos.y = p.y;
	        		break;
	        	}
	        }
	        //mouse_move_to( e.layerX, canvas.height-e.layerY );
		}
    }
    

    this.resize = function() {
        var parent = $('#'+content); 
        var p = parent.offset();

        this.width = parent.width();
        this.height = parent.height();
        this.left = p.left;
        this.top = p.top;

        var svg = $('#'+content+'_svg'); 
        svg.offset( {left:this.left,top:this.top} );
        svg.width( this.width );
        svg.height( this.height );

        this.reset_transform();
    }      
    this.set_size = function(w,h) {
        var parent = $('#'+content); // TODO

        this.width = w;
        this.height = h;
        this.left = '0px';
        this.top = '0px';

        var svg = $('#'+content+'_svg'); // TODO 
        svg.offset( {left:'0px',top:'0px'} );
        svg.width( w );
        svg.height( h );

        this.reset_transform();
    }       
    this.text_at = function(x,y,text,clazz,attr,rot) {
        var o = d.createElementNS(this.svgNS,'text');
        for (var key in attr) {
            o.setAttribute( key, attr[key] );
        }
        if (rot)
            o.setAttribute('transform', 'translate('+x+','+y+') rotate('+rot+') scale(1,-1)' );
        else
            o.setAttribute('transform', 'translate('+x+','+y+') scale(1,-1)' );

        if (clazz) o.setAttribute( 'class', clazz );
        var t = d.createTextNode(text);
        o.appendChild(t);
        this.paper.appendChild( o );
        return o;
    } 
    // NEW DGR  
    this.path = function(def,attr,gr) {
        var o = d.createElementNS(this.svgNS,'path');
        o.setAttribute( 'd', def );
        if (attr) {
            for (var key in attr) {
				if (key == 'stroke') {
					let color = attr[key];
            		if(color && color.hasOwnProperty("clazz")){
                		o.classList.add(color.clazz);
            		} else {
            			if(color){
                            o.setAttribute(key, color );
            			}
            		} 
            	} else {
                	o.setAttribute( key, attr[key] );
				}
            }
        }
        if (gr) gr.appendChild( o )
        else this.paper.appendChild( o );
        return o;
    }
} // Canvas

var symbologyXML;
let symboogyUrl =  `${origin}/meta/symbology.xml`;
$.ajax(symboogyUrl)
.then(response => {
	symbologyXML = response;
})

function get_gs(clazz){
	var gs = "";
	if(symbologyXML.getElementById(clazz).getElementsByTagName("native").length){
		gs = symbologyXML.getElementById(clazz).getElementsByTagName("native")[0].getAttribute("style-id")
	}
	else if(symbologyXML.getElementById(clazz).getElementsByTagName("case").length){
		gs = symbologyXML.getElementById(clazz).getElementsByTagName("case")[1].getAttribute("normal-style-id");
		if(!gs) 
			gs = symbologyXML.getElementById(clazz).getElementsByTagName("case")[1].getAttribute("style-id");
	} else if (symbologyXML.getElementById(clazz).getElementsByTagName("link").length){
		gs = symbologyXML.getElementById(clazz).getElementsByTagName("link")[0].getAttribute("default-style-id")
	}
	return gs;
}

function get_graphic_in_span(idPanel, idNode, size) {
	try {
		var idGrafico = get_gs(idNode);
		var o = document.createElement('span')
		o.setAttribute('id', idPanel + '-ref-' + idNode );
		$("#" + idPanel)[0].innerHTML = "";
		$("#" + idPanel).append(o);

	    var canvasGr = new Canvas(document, idPanel + '-ref-' + idNode );
	    var color = '';
	    var lw = 0.2;
	
	 	$('#' + idPanel + '-ref-' + idNode + "_svg").attr("width", size)
		$('#' + idPanel + '-ref-' + idNode + "_svg").attr("height", size)
		
		var gr = $('#' +  idPanel + '-ref-' + idNode + "_svg_g")[0];
	 	
	 	var g = GRAPHICS[idGrafico];
	 	
	 	if(g.gs){
	 	 	
		 	for (var k=0;k<g.gs.length;k++) {
		 		
		    	let attr = g.gs[k].attr ? g.gs[k].attr : {};  
		        for (var key in attr) {
		            if ((key=='stroke' || key=='fill') && attr[key] == "#FFFFFF")
		            	attr[key] = "#000";
		        }
		        
		 		if (g.gs[k].type==5) {
		         	var o = canvasGr.create_path(g.gs[k].attr,color,lw);
		 			gr.appendChild(o);
		 		}
		 		else if (g.gs[k].type==1) {
		 			var o = canvasGr.create_line(g.gs[k].attr,color,lw);
		 			gr.appendChild(o);
		 		}
		 		else if (g.gs[k].type==2) {
					var o = canvasGr.create_circle(g.gs[k].attr,color,lw);
		 			gr.appendChild(o);
		 		}
		 		else if (g.gs[k].type==9) {
		 			var o = canvasGr.create_text(g.gs[k].text,g.gs[k].attr);
		 			gr.appendChild(o); 
		 		}
		 	}
			
	 	} else if(g['line-type']){
	 		var lineType = g['line-type'];
	 		if(lineType=="dot")
	 			lineType = "cable";
	 		if(lineType=="continuous"){
	 			var k = "______"
	 		} else {
	 			var k = CUSTOM_LINE[lineType].desc.slice(0,6)
	 		}
	 		var color = g['color']
	 		var o = canvas.create_text(text=k)
	 		gr.appendChild(o);
	 		$('#' + idPanel + '-ref-' + idNode + "_svg g").attr("fill", color)
	 	}
	 	
		var actualWidth = gr.getBoundingClientRect().width;
		var actualHeight = gr.getBoundingClientRect().height;
		if((size/actualWidth)*actualHeight < size){
			actualHeight = gr.getBoundingClientRect().width;
		} else {
			actualWidth = gr.getBoundingClientRect().height;
		}
	
		if(actualWidth && actualHeight){
			$('#' + idPanel + '-ref-' + idNode + "_svg g").attr("transform", "scale(" + ((size-2)/actualWidth) + " -" + ((size-2)/actualHeight) +")"); 
			
			var x = $('#' + idPanel + '-ref-' + idNode + "_svg")[0].getBoundingClientRect().x - gr.getBoundingClientRect().x;
			var y = $('#' + idPanel + '-ref-' + idNode + "_svg")[0].getBoundingClientRect().y - gr.getBoundingClientRect().y;
			
			$('#' + idPanel + '-ref-' + idNode + "_svg g").attr("transform", "translate("+ (x+1) +" "+ (y+1) +") scale(" + ((size-2)/actualWidth) + " -" + ((size-2)/actualHeight) +")");
		}
	} catch(e){
	}
}

function setNNSS(event){
	var x = event.layerX,
        y = canvas.height - event.layerY;

        if (EDIT.mode==E_NNSS && EDIT.drawing) {

            if (canvas.svg.style.cursor == 'not-allowed')
                return;

            canvas.svg.style.cursor = 'default';

            for (var i=0;i<MANZANAS.length;i++) {
                var a = MANZANAS[i];
                if (a.is_over) {
                    a.is_over = false;
                    if (a.obj != null) {a.obj.classList.remove("p-hover-manzana");}; 
                }
            }       
            
            edt_msg();

            console.log("create element at ", canvas.inverse_x(event.layerX), canvas.inverse_y(event.layerY),x,y, EDIT.angle );
            
            var element = CLASSES[ EDIT.clazz ];
        	element.Clazz = EDIT.clazz;
        	element.Angle = element.edit.rotate ? EDIT.angle + element.edit.angle :  element.Angle
        	element.desc = CLASSES[element.Clazz].description
     
        	var id = EDIT.next_id--;
        	
      
        	
        	
        	var gkx = x/scale+x1;
        	var gky = y/scale+y1;		
        			
        	var data = {'x': x,'y':y,'class':element.Clazz,'id':id, 'type':SYMBOL,'gs':[get_gs(element.Clazz)],'ang':element.Angle,'sc':1,'is_new':true, 'pos':{x:gkx,y:gky}, rel_dist:EDIT.dist};
        	
	        var cl = CLASSES[ element.Clazz ];
	        if (cl && cl.ports)
	           data.nodes = clone( cl.ports );
	        
	        data.rel_ang =  (element.Angle - EDIT.angle);
	        data.rel_dist = EDIT.dist;
	        
	        EDIT.objs[ data.id ] = data;
	    	DATA.push( data );
	        
            EDIT.drawing = false;
            edt_changes();
            clicked_new(null,data.id);
            render();
            return;
        }

        
        if (index<=1)    
            return;

        var arr_inside = [],
            minsup = Number.MAX_SAFE_INTEGER;

        for (var i=0;i<CURR_AREAS.length;i++) {
            var a = CURR_AREAS[i];
            if (!a.clipped && is_inside(x,y,a.arr_x,a.arr_y)) {
                arr_inside.push(a);
                if (a.supk<minsup) {
                    minsup = a.supk;
                }
            }
        }

        for (var i=0;i<arr_inside.length;i++) {
            var a = arr_inside[i];
            if (a.supk==minsup) {
                SELECTED_AREAS = set_selected_areas_item(SELECTED_AREAS,a.class,a.id);
                set_footer_area_link(SELECTED_AREAS,update_selected_areas);
                fetch(a.id);
                break;    
            }
        }
}

function clicked_new(ev,id) {
    var dis = false;
    var data = null;
    if (id!=0) {
        EDIT.selected_id = id;
        data = EDIT.objs[ id ];
    }
    if (data) {
        get('edt-class-nnss').value = nombre_clase( data.class );
        get('edt-id').value = '#'+(parseInt(id)*-1);
        get('edt-eliminar-nnss').class_del('not-active-2'); 


        if (data.type==SYMBOL) {        
            get('edt-ang').value = data.ang ? data.ang.toFixed(2) : '0';
            get('edt-scale').value = data.sc ? data.sc.toFixed(2) : '1';
            if (data.pos)
                get('edt-position').value = data.pos.x.toFixed(4)+','+data.pos.y.toFixed(4);
            else
                get('edt-position').value = '';       

            get('edt-rel-ang').value = data.rel_ang!=undefined ? data.rel_ang.toFixed(2) : '';
            get('edt-rel-dist').value = data.rel_dist!=undefined ? (data.rel_dist/scale).toFixed(2) : '';

            get('edt-ang').class_del('not-active-2');        
            get('edt-scale').class_del('not-active-2');        
            get('edt-position').class_del('not-active-2');        
        } else {
            dis = true;
        }
    } else {
        get('edt-id').value = '';
        get('edt-class-nnss').value = '';
        get('edt-eliminar-nnss').class_add('not-active-2'); 
        dis = true;
    }
    if (dis) {
        get('edt-position').value = '';
        get('edt-scale').value = '';
        get('edt-ang').value = '';
        get('edt-rel-ang').value = '';
        get('edt-rel-dist').value = '';
        get('edt-ang').class_add('not-active-2');        
        get('edt-scale').class_add('not-active-2');        
        get('edt-position').class_add('not-active-2');           
    }
}

function edt_conectar_2( cancel ) {
    if (cancel) {
        EDIT.mode_conn = 0;
        EDIT.conn_net = 0;
        color_mode = EDIT.last_color_mode;
        edt_msg();
    } else {
        var cl = CLASSES[ EDIT.clazz ];
        if (cl) {
            EDIT.tmp = {};
            EDIT.mode_conn = 2;
            EDIT.conn_net = cl.net;
            color_mode = 9;
            if (cl.nodes==1) {    
                 edt_msg('<span class="w3-panel">Elija el puerto del elemento a conectar o presione <a class="f5-color-bg" href="javascript:edt_conectar_2(true)">cancelar</a></span>');
            } else if (cl.nodes>1) {
                edt_msg('<span class="w3-panel">Primero elija el puerto de conexión desde o presione <a class="f5-color-bg" href="javascript:edt_conectar_2(true)">cancelar</a></span>');
            } else {
                edt_msg('<span class="w3-panel">El elemento no puede conectarse<a class="f5-color-bg" href="javascript:edt_conectar_2(true)">x</a></span>');
            }
        }
    }
    render();
}
