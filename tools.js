//function load(src, fun) {
//	return new Promise(function(resolve){
//	    var script = document.createElement('script');
//	    script.src = src;
//	    script.onload = () => resolve();
//	    document.head.appendChild(script); 		
//	});
//}


var PLUGINS = {};
var plugins_loaded = [];

function _require_plugin( name, external) {
	var URLBASE1 = new URL(getScriptServer);
	var _CROMO_VERSION = "v1.2506.07";
	var sp = name.split("/");
    var plugin_name = sp[sp.length-1];

//	PLUGINS[ plugin_name ] = new Plugin();
	return load(external?name+'.js':URLBASE1.origin+'/plugins/'+name+'.js?'+_CROMO_VERSION)
	.then(function(){
		let plugin_name_instance = plugin_name.charAt(0).toUpperCase() + plugin_name.slice(1);
		var MyClass = stringToFunction(plugin_name_instance);
		var instancePlugin = new MyClass();
		instancePlugin.init()
		let id = instancePlugin.getId();
		if (id)
			PLUGINS[id] = instancePlugin;
		else
			PLUGINS.push(instancePlugin);
		console.log( plugin_name + " Plugin loaded",PLUGINS[ plugin_name ]);
		instancePlugin.loadCompleted();
		return Promise.resolve(id);
    })
    .catch(function(error){
		console.error("Error al cargar plugin '" + plugin_name + "' error: " + error);
		return Promise.reject();
	})
    ;
}

function load(src, fun) {
	return new Promise(function(resolve, reject){
		var script = document.createElement('script');
		script.src = src;
		script.onload = () => resolve();
		script.onerror = () => reject();
		document.head.appendChild(script); 		
	});
}

function require_plugin(name, external = false, token = null){
	
	let p=[];
	
	if(!external){
		p.push( Promise.resolve('{"value":""}'));
	}else{
		let request_object = {
			type: "GET",
			url: URLBASEB + "/serverConfiguration/options/external_plugins",
			dataType: "text",
		};
		if (token) {
			request_object = Object.assign(
				{
					headers: { Authorization: `Bearer ${token}` },
					withCredentials: true,
				},
				request_object
      		);
		}
		p.push($.ajax(request_object));
	}
	return Promise.all(p).then(values => { 
		values[0] = JSON.parse(values[0]);
		if(external && values[0].value==""){
			console.warn("no se configuro la carpeta de plugins externos");
		}
		var plugin_promise = _require_plugin(values[0].value + name, external);
		plugins_loaded.push(plugin_promise);
		return plugin_promise;
	});
	
}

String.prototype.fmt = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
    })
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function log(msg) 
{console.log(msg);}

Math.degrees = function(rad)
{return (rad*180)/Math.PI;}
 
Math.radians = function(deg)
{return (deg * Math.PI)/180;}


/*
 * Itera el objeto "o" aplicandole la función "f" y acumula resultados
 *
 * o puede ser array, object, string. Es el objeto a iterar
 * f función que recibe cada elemento, su indice o key en o
 * acc estructura que almacena los resultados parciales.
*/
var iterate = function (o,f,acc) {
    if (o!=null) {
        if (o.getClass) {
            var c= new String(o.getClass());
            if (c.indexOf("Map")>-1) {
                var ks= toJs(o.keySet());
                for (var i in ks) { acc= f(o.get(ks[i]),ks[i],acc); }
            }
        }
        else if (Array.isArray(o)) {
            for (var i=0; i<o.length; i++) { acc= f(o[i],i,acc); }
        }
        else if (typeof(o)=="object") { 
            for (var k in o) { acc= f(o[k],k,acc); }
        }
    }
    return acc;
};


function selected_radio( name ) {
    var arr = document.getElementsByName(name);
    var ret = null;
    for (var i=0; ret==null && i<arr.length; i++){
        if (arr[i].checked) {
            ret = arr[i].value;
        }
    }
    return ret;
}

/*
 * Utiliza iterate para encontrar por clave
 *
 * list puede ser array, object, string. Es el objeto a iterar
 * key la clave por la cual busca
 * value el valor a buscar para dicha clave
 * list 
*/
findByProp = function(list,key,value,onlyKeys) {
  return iterate(list,function(data,index,acc){
    if (data.hasOwnProperty(key) && data[key] == value) {
    	if (onlyKeys && acc.indexOf(index) == -1) {
    		acc.push(index);
    	} else if (!onlyKeys) {
    		acc.push(data);
    	}
    }
    return acc;
  },[]);
};

/*
 * Utiliza iterate para encontrar por objecto
 *
 * list puede ser array, object, string. Es el objeto a iterar
 * obj json clave valor
 * list 
*/
findByObj = function(list,obj,onlyKeys) {
  return iterate(list,function(data,index,acc){
  	var add = iterate(obj,function(value,key,addAcc){
			if (!data.hasOwnProperty(key) || data.hasOwnProperty(key) && data[key] != value) {
				addAcc = false;
			}
			return addAcc;
  	},true);
    if (add) {
    	if (onlyKeys && acc.indexOf(index) == -1) {
    		acc.push(index);
    	} else if (!onlyKeys) {
    		acc.push(data);
    	}
    }
    return acc;
  },[]);
};

 /*
 * Calculates the angle ABC (in radians) 
 *
 * A first point, ex: {x: 0, y: 0}
 * B center point
 * C second point
 *
 * O el algulo entre dos puntos AB 
 */
function find_angle(A,B,C) {
	if (C) {
    	var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    	var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
   		var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    	return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
	} else {
 		return Math.atan2(B.y - A.y, B.x - A.x);		
	}
}

function polar(pt, len, ang) {
	return {
		x: pt.x + len * Math.cos(ang),
        y: pt.y + len * Math.sin(ang)
    };
}

/*
 * Calculates the distance 
 *
 * A first point, ex: {x: 0, y: 0}
 * B second point
 */
function distance( A, B ) {
	var xd = A.x - B.x;
	var yd = A.y - B.y;
	var dist = Math.sqrt( xd*xd + yd*yd );
	return dist;
}

/*	
 * a first point, ex: {x: 0, y: 0}
 * b second point
 * d > 0: -> distance from point a
 * d < 0: -> distance from point b
 */
function point_at_dist( a, b, d ){
	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var dist = Math.sqrt( dx*dx + dy*dy );
	if (d<0)
		dist = dist - d;
	var x = a.x + ((d * dx) / dist); 
	var y = a.y + ((d * dy) / dist); 
	return {x:x,y:y};
}

/*	
 * a first point, ex: {x: 0, y: 0}
 * b second point
 * p = porcentaje 0..1, 0=a, 1=b, 0,5=middle point
 */
function point_at_perc( a, b, p ){
	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var x = a.x + dx * p; 
	var y = a.y + dy * p; 
	return {x:x,y:y};
}

function centroid(pts) {
   var first = pts[0], last = pts[pts.length-1];
   if (first.x != last.x || first.y != last.y) pts.push(first);
   var twicearea=0,
   x=0, y=0,
   nPts = pts.length,
   p1, p2, f;
   for ( var i=0, j=nPts-1 ; i<nPts ; j=i++ ) {
      p1 = pts[i]; p2 = pts[j];
      f = p1.x*p2.y - p2.x*p1.y;
      twicearea += f;          
      x += ( p1.x + p2.x ) * f;
      y += ( p1.y + p2.y ) * f;
   }
   f = twicearea * 3;
   return { x:x/f, y:y/f };
}

function is_inside( x, y, vx, vy ) {
	var i, j, nvert = vx.length, c = false;
	for (i = 0, j = nvert - 1; i < nvert; j = i++) {
	if (((vy[i] >= y ) != (vy[j] >= y)) && (x <= (vx[j] - vx[i]) * (y - vy[i]) / (vy[j] - vy[i]) + vx[i]))
		c = !c;
	}
	return c;
}

function cross(o, a, b) {
   return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

/**
 * @param points An array of [X, Y] coordinates
 */
function convexHull(points) {
   points.sort(function(a, b) {
      return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
   });

   var lower = [];
   for (var i = 0; i < points.length; i++) {
      var c = 0;
      while (lower.length >= 2) {
         c = cross(lower[lower.length - 2], lower[lower.length - 1], points[i])
         if (c>0)
            break;
        //if (c!=0) {
        //   lower[lower.length - 1] = [lower[lower.length - 1], points[i][1]];
        //} else        
        lower.pop();
      }

      lower.push(points[i]);
   }

   var upper = [];
   for (var i = points.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
         upper.pop();
      }
      upper.push(points[i]);
   }

   upper.pop();
   lower.pop();
   return lower.concat(upper);
}

function intersect( from, to, p ) {
	
	var xd = to.x - from.x,
	    yd = to.y - from.y;

	if (xd == 0 && yd == 0) {
	    // p1 and p2 cannot be the same point
	    return null;
	}

	var u = ((p.x - from.x) * xd + (p.y - from.y) * yd) / (xd * xd + yd * yd);

	if (u < 0) {
	    return from;
	} else if (u > 1) {
	    return to;
	} else {
	    return {x:(from.x+u*xd),y:(from.y+u*yd)};
	}
} 

function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4)  {
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
		return false
	}

	denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    if (denominator === 0) {
		return false
	}

	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
		return false
	}

    let x = x1 + ua * (x2 - x1)
	let y = y1 + ua * (y2 - y1)

	return {x, y}
}


Clipboard = {
	copy: function(elem) {
	      // create hidden text element, if it doesn't already exist
	    var targetId = "_hiddenCopyText_";
	    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
	    var origSelectionStart, origSelectionEnd;
	    if (isInput) {
	        // can just use the original source element for the selection and copy
	        target = elem;
	        origSelectionStart = elem.selectionStart;
	        origSelectionEnd = elem.selectionEnd;
	    } else {
	        // must use a temporary form element for the selection and copy
	        target = document.getElementById(targetId);
	        if (!target) {
	            var target = document.createElement("textarea");
	            target.style.position = "absolute";
	            target.style.left = "-9999px";
	            target.style.top = "0";
	            target.style.width = "400px";
	            target.id = targetId;
	            document.body.appendChild(target);
	        }
	        target.textContent = elem;
	    }
	    // select the content
	    var currentFocus = document.activeElement;
	    target.focus();
	    target.setSelectionRange(0, target.value.length);
	    
	    // copy the selection
	    var succeed;
	    try {
	          succeed = document.execCommand("copy");
	    } catch(e) {
	        log("No se puedo ejecutar copy");
	        succeed = false;
	    }
	    // restore original focus
	    if (currentFocus && typeof currentFocus.focus === "function") {
	        currentFocus.focus();
	    }
	    
	    if (isInput) {
	        // restore prior selection
	        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
	    } else {
	        // clear temporary content
	        target.textContent = "";
	    }
	    return succeed;
	}
}

COOKIE = {
	set: function (name, value) {
		var expires = new Date(),
			cookie =
				encodeURIComponent(name) + '=' +
				encodeURIComponent(value);

		expires.setFullYear(expires.getFullYear() + 1);
		expires = expires.toGMTString();
		cookie += '; expires=' + expires + '; path=/'+'; SameSite=none; Secure=true';

		document.cookie = cookie;

		return cookie;
	},
	get: function (name) {
		var cookie,
			cookies = document.cookie.split(/;\s*/),
			x = cookies.length;
		while (x--) {
			cookie = cookies[x];
			if (cookie.indexOf(name) === 0) {
				// +1 is for the equal sign
				return cookie.substring(name.length + 1);
			}
		}
		return null;
	},
	del: function (name) {
		var expires = new Date(),
			cookie = encodeURIComponent(name) + '=';

		expires.setDate(expires.getDate() - 1);
		expires = expires.toGMTString();

		cookie += '; expires=' + expires + '; path=/'+'; SameSite=none; Secure=true';
		document.cookie = cookie;
		return cookie;
	}
};

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


// GEOMETRIC function to get the intersections
// from https://bl.ocks.org/milkbread/11000965
//Line segment --> a & b = [x, y]
//Circle --> c = [x, y, radius]
function getIntersections(a, b, c) {
	// Calculate the euclidean distance between a & b
	eDistAtoB = Math.sqrt( Math.pow(b[0]-a[0], 2) + Math.pow(b[1]-a[1], 2) );

	// compute the direction vector d from a to b
	d = [ (b[0]-a[0])/eDistAtoB, (b[1]-a[1])/eDistAtoB ];

	// Now the line equation is x = dx*t + ax, y = dy*t + ay with 0 <= t <= 1.

	// compute the value t of the closest point to the circle center (cx, cy)
	t = (d[0] * (c[0]-a[0])) + (d[1] * (c[1]-a[1]));

	// compute the coordinates of the point e on line and closest to c
    var e = {coords:[], onLine:false};
	e.coords[0] = (t * d[0]) + a[0];
	e.coords[1] = (t * d[1]) + a[1];

	// Calculate the euclidean distance between c & e
	eDistCtoE = Math.sqrt( Math.pow(e.coords[0]-c[0], 2) + Math.pow(e.coords[1]-c[1], 2) );

	// test if the line intersects the circle
	if( eDistCtoE < c[2] ) {
		// compute distance from t to circle intersection point
	    dt = Math.sqrt( Math.pow(c[2], 2) - Math.pow(eDistCtoE, 2));

	    // compute first intersection point
	    var f = {coords:[], onLine:false};
	    f.coords[0] = ((t-dt) * d[0]) + a[0];
	    f.coords[1] = ((t-dt) * d[1]) + a[1];
	    // check if f lies on the line
	    f.onLine = is_on(a,b,f.coords);

	    // compute second intersection point
	    var g = {coords:[], onLine:false};
	    g.coords[0] = ((t+dt) * d[0]) + a[0];
	    g.coords[1] = ((t+dt) * d[1]) + a[1];
	    // check if g lies on the line
	    g.onLine = is_on(a,b,g.coords);

		return {points: {intersection1:f, intersection2:g}, pointOnLine: e};

	} else if (parseInt(eDistCtoE) === parseInt(c[2])) {
		return {points: false, pointOnLine: e};
	} else {
		return {points: false, pointOnLine: e};
	}
}

// BASIC GEOMETRIC functions
function x_distance(a,b) {
	return Math.sqrt( Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) )
}
function is_on(a, b, c) {
	return x_distance(a,c) + x_distance(c,b) == x_distance(a,b);
}

function getAngles(a, b, c) {
	// calculate the angle between ab and ac
	angleAB = Math.atan2( b[1] - a[1], b[0] - a[0] );
	angleAC = Math.atan2( c[1] - a[1], c[0] - a[0] );
	angleBC = Math.atan2( b[1] - c[1], b[0] - c[0] );
	angleA = Math.abs((angleAB - angleAC) * (180/Math.PI));
	angleB = Math.abs((angleAB - angleBC) * (180/Math.PI));
	return [angleA, angleB];
}

// QUEUE Object Definition

var Queue = function() {
  this.first = null;
  this.last = null;
  this.size = 0;
};

var QueueNode = function(data) {
  this.data = data;
  this.next = null;
};

Queue.prototype.enqueue = function(data) {
  var node = new QueueNode(data);

  if (!this.first){ // for empty list first and last are the same
    this.first = node;
    this.last = node;
  } else { // otherwise we stick it on the end
    this.last.next=node;
    this.last=node;
  }

  this.size += 1;
  return node;
};

Queue.prototype.dequeue = function() {
  if (!this.first) //check for empty list
    return null;

  let temp = this.first; // grab top of list
  if (this.first==this.last) {
    this.last=null;  // when we need to pop the last one
  }
  this.first = this.first.next; // move top of list down
  this.size -= 1;
  return temp.data;
};

Math.pretty_print_parameter = function(value, exponent, unit, get_module) {
	var negative = false;
	if (value < 0) {
		value *= -1;
		negative = true;
	}
	var new_value = value * Math.pow(10, exponent);
	var norm_value = new_value;
	var new_exponent = 0;
	while (new_value < 1 && new_exponent < 9) {
		new_exponent += 3;
		new_value = norm_value * Math.pow(10, new_exponent); 
	}
	if (new_exponent == 0 && new_exponent > -9) {
		while (new_value > 1000) {
			new_exponent -= 3;
			new_value = norm_value * Math.pow(10, new_exponent); 
		}
	}
	var printed_exponent = '';
	if (new_exponent == 9) {
		printed_exponent = "n";
	} else if (new_exponent == 6) {
		printed_exponent = "u";
	} else if (new_exponent == 3) {
		printed_exponent = "m";
	} else if (new_exponent == -9) {
		printed_exponent = "G";
	} else if (new_exponent == -6) {
		printed_exponent = "M";
	} else if (new_exponent == -3) {
		printed_exponent = "K";
	}
	if (negative && !get_module) {
		new_value *= -1;
	}
	return "" + new_value.toFixed(2) + " " + printed_exponent + unit;
}

// Obtener id manzada filtrando por customer id
var get_manzana_id = function (DATA, customer_id) {
    var filtered_data = DATA.filter(function (a) {
        return a.cust && a.cust.indexOf(customer_id) > -1;
    });
	return filtered_data.length > 0 ? filtered_data[0].id: 0;
};

// obtener info de la manzana
var get_ajax_info_element = function (id, params, async, callback) {
	var varObjectName = params.var? params.var : "object_info";
	$.ajax({
		url: URLBASE+'/db/objects/'+id,
		async: async,
		dataType: 'jsonp',
		data: params,
		success: function() {
			callback(window[varObjectName].response);
		}
	});
};

// Cáculo para saber cual vereda corresponde al customer (Acometida)
var calc_vereda_cercana = function (STREETS, custom_points, veredas) {
	var veredas_tmp = veredas;
	var PI = 3.14159265358979323846;

	veredas_tmp.map(function(vereda, index) {
		var dx1 = vereda.x1 - custom_points.x;
		var dy1 = vereda.y1 - custom_points.y;
		var a = Math.sqrt(dx1*dx1 + dy1*dy1);

		var dx2 = vereda.x1 - vereda.x2;
		var dy2 = vereda.y1 - vereda.y2;
		var b = Math.sqrt(dx2*dx2 + dy2*dy2);

		var dx3 = vereda.x2 - custom_points.x;
		var dy3 = vereda.y2 - custom_points.y;
		var c = Math.sqrt(dx3*dx3 + dy3*dy3);

		var calc_for_acos = (b*b + c*c - a*a)/(2*b*c);
		var calc_for_asen = (a*a + c*c - b*b)/(2*a*c);
		var angle1 = (Math.acos(Math.abs(calc_for_acos) >= 1 ? 1 : calc_for_acos))*(180/3.1415926536);
		var angle2 = (Math.acos(Math.abs(calc_for_asen) >= 1 ? 1 : calc_for_asen))*(180/3.1415926536);
		var angle3 = 180 - angle1 - angle2;

		veredas[index].angles = {a: angle1, b: angle2, c: angle3};
		veredas[index].sides = {a: a, b: b, c: c};
	});

	var filtro1= veredas.filter(function(a) {
		return a.angles.c == 180 || (a.angles.a <= 90 && a.angles.c <= 90 && (a.angles.a < 10 || a.angles.c < 10));
	});
	
	var filtro_veredas = [];
	
	if (filtro1.length > 0) {
		filtro_veredas = filtro1;
	} else {
		veredas.sort(function(a, b) {
			return a.sides.a - b.sides.a;
		});
		
		var sort1 = veredas[0];

		veredas.sort(function(a, b) {
			return a.sides.c - b.sides.c;
		});
		
		filtro_veredas = sort1.sides.a < veredas[0].sides.c ? [sort1] : [veredas[0]];
	}

	var vereda = [];
	if (filtro_veredas.length > 1) {
		filtro_veredas.sort(function (a, b) {
			return a.angles.a - b.angles.a; 
		});

		vereda = filtro_veredas[0];

		filtro_veredas.sort(function (a, b) {
			return a.angles.c - b.angles.c;
		});

		if (
			(vereda.angles.a >= filtro_veredas[0].angles.c && vereda.angles.c > filtro_veredas[0].angles.c) || 
			(vereda.angles.a > filtro_veredas[0].angles.a && vereda.angles.b > filtro_veredas[0].angles.b)
		) {
			vereda = filtro_veredas[0];
		}
	} else {
		vereda = filtro_veredas[0];
	}
	var from = vereda.nfrom !== undefined ? vereda.nfrom : vereda.from && vereda.from.num? vereda.from.num : 0;
	var to = vereda.nto !== undefined ? vereda.nto : vereda.to && vereda.to.num? vereda.to.num : 0;
	var count = 0;
	var index = 0;
	var streets_numbers = [];

	if (from < to) {
		for (var i = to; i >= from; i--) {
			if (from%2 === 1 && i%2 === 1) {
				streets_numbers.push(i);
				count++;
				index++;
			} else if (from%2 === 0 && i%2 === 0) {
				streets_numbers.push(i);
				count++;
				index++;
			}
		}
	} else {
		for (var i = to; i <= from; i++) {
			if (from%2 === 1 && i%2 === 1) {
				streets_numbers.push(i);
				count++;
				index++;
			} else if (from%2 === 0 && i%2 === 0) {
				streets_numbers.push(i);
				count++;
				index++;
			}
		}
	}

	var radianes = vereda.angles.a * PI / 180;
	var calc_numero_calle = Math.abs(Math.trunc((vereda.sides.c*Math.cos(radianes))/(vereda.sides.b / count)));
	
	if	(calc_numero_calle < 2) {
		index_street = 0;
	} else if (count < calc_numero_calle) {
		index_street = count - 1;
	} else {
		index_street = calc_numero_calle;
	}
		
	var num_casa_edificio = streets_numbers[index_street];

	if(vereda.street == "0" || STREETS[vereda.street] == undefined ){
		return  "<SIN NOMBRE> " + num_casa_edificio;
	}else{

		return STREETS[vereda.street].name + ' ' + num_casa_edificio;
	}

}

function filtrar_veredas(data, abs_real_points, id) {
	var veredas_filtradas = data.filter(function(a) {
		return a.type === 5;
	});

	veredas_filtradas = veredas_filtradas.filter(function(a) {
		return verifivar_puntos_interseccion_veredas(a, abs_real_points);
	});

	var veredas_yx_absolute = calc_absolute_xy_to_veredas(veredas_filtradas, abs_real_points);

	return veredas_yx_absolute;
}

function calc_absolute_xy_to_veredas(veredas, canvas_points) {
	var tmp_veredas = veredas;
	var xA1 = canvas_points.x1;
	var yA1 = canvas_points.y1;
	var xA2 = canvas_points.x2;
	var yA2 = canvas_points.y2;
	var width = canvas_points.width;
	var height = canvas_points.height;
	var dxA = xA2 - xA1;
	var dyA = yA2 - yA1;
	var pixel_in_meter_x = dxA / width;
	var pixel_in_meter_y = dyA / height;

	tmp_veredas.forEach(function(vereda, index) {
		var diff_abs_from_x = vereda.from.x * pixel_in_meter_x;
		var diff_abs_from_y = vereda.from.y * pixel_in_meter_y;
		var diff_abs_to_x = vereda.to.x * pixel_in_meter_x;
		var diff_abs_to_y = vereda.to.y * pixel_in_meter_y;

		veredas[index].x1 = xA1 + diff_abs_from_x;
		veredas[index].y1 = yA1 + diff_abs_from_y;
		veredas[index].x2 = xA1 + diff_abs_to_x;
		veredas[index].y2 = yA1 + diff_abs_to_y;
	});

	return veredas;
}

function isrectaEnPlano(x1,y1,x2,y2,xmax,ymax){
	// dado dos puntos (x1,y1),(x2,y2) crea una recta y
	//verifica si algun punto de ella se encuentra en un plano desde el (0,0) hasta (xmax,ymax) 
	
	//esta funcion tiene un margen de error de 1px en el eje x
	if(Math.abs(x1-x2)<=1)
		x2 = x1;
	
	var aux;
	if(x1!=x2){
		//Evalua si no es una recta paralela al eje Y
		if(x1>x2){
			aux =x1;
			x1=x2
			x2=aux;
			aux =y1;
			y1=y2
			y2=aux;
		}
		aux=false;
		for (var px=x1;px<x2;px++)  {
			//funcion lineal entre los dos puntos para recorrer todos los puntos de la recta
			var pto=(((y2-y1)/(x2-x1))*(px-x1))+y1; //Esta cuenta solo sirve si x1!=x2
			if ((px>0 && px<xmax) && (pto>0 && pto<ymax)){
				//Si algun punto de la recta está entre el 0 y los maximos del plano devuelve true
				aux=true;
				break;
			}
		}
	}else{
		//Si es paralela, evalua los puntos sobre la recta en Y
		if(y1>y2){
			aux =y1;
			y1=y2
			y2=aux;
		}
		aux=false;
		for (var py=y1;py<y2;py++){
			if ((x1>0 && x1<xmax) && (py>0 && py<ymax)){
				//Si algun punto de la recta está entre el 0 y los maximos del plano devuelve true
				aux=true;
				break;
			}
		}
	}
    return aux;
}
function getPointTorectaEnPlano(x1,y1,x2,y2,xmax,ymax){
	// dado dos puntos (x1,y1),(x2,y2) crea una recta y
	//verifica si algun punto de ella se encuentra en un plano desde el (0,0) hasta (xmax,ymax) 
	
	//esta funcion tiene un margen de error de 1px en el eje x
	if(Math.abs(x1-x2)<=1)
		x2 = x1;
	
	var aux;
	if(x1!=x2){
		//Evalua si no es una recta paralela al eje Y
		if(x1>x2){
			aux =x1;
			x1=x2
			x2=aux;
			aux =y1;
			y1=y2
			y2=aux;
		}
		aux=false;
		for (var px=x1;px<x2;px++)  {
			//funcion lineal entre los dos puntos para recorrer todos los puntos de la recta
			var pto=(((y2-y1)/(x2-x1))*(px-x1))+y1; //Esta cuenta solo sirve si x1!=x2
			if ((px>0 && px<xmax) && (pto>0 && pto<ymax)){
				//Si algun punto de la recta está entre el 0 y los maximos del plano devuelve true
				aux=true;
				return [px, pto];
				break;
			}
		}
	}else{
		//Si es paralela, evalua los puntos sobre la recta en Y
		if(y1>y2){
			aux =y1;
			y1=y2
			y2=aux;
		}
		aux=false;
		for (var py=y1;py<y2;py++){
			if ((x1>0 && x1<xmax) && (py>0 && py<ymax)){
				//Si algun punto de la recta está entre el 0 y los maximos del plano devuelve true
				aux=true;
				return [x1, py];
				break;
			}
		}
	}
	return null;
}
function verifivar_puntos_interseccion_veredas(vereda, canvas_points) {
	var vereda_valida = false;
	var x1, y1, x2, y2;

	// Si no tiene to y from completos, no es válida
	if (!(vereda.to && vereda.from && vereda.to.x && vereda.to.y && vereda.from.x && vereda.from.y))
		return;
	
	//Calculo de la pendiente
	var m = (vereda.to.y - vereda.from.y)/(vereda.to.x - vereda.from.x);

	// De la ecuación y = mx + b donde se despeja b
	// que es el punto de intersección, quedando b = y - mx
	var b = vereda.to.y - (m * vereda.to.x);

	// Evaluo con las coordenadas del canvas.
	// Cuando el y del canvas es 0
	x1 = ((-1) * b) / m;

	// Cuando el x del canvas es 0
	y1 = b;

	// Cuando el y del canvas es el height del canvas
	x2 = (canvas_points.height - b) / m;

	// Cuando el x del canvas es el width del canvas
	y2 = (m * canvas_points.width) + b;

	// Se filtra en base a los puntos de intersección de las veredas con respecto al canvas
	// en conjunto con la posición de los puntos en relación a los cuadrantes (-x a x, -y a y)
	if (
		(
			(
				vereda.from.x >= 0 && vereda.from.y >= 0 &&
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x < canvas_points.width &&
				vereda.from.y < canvas_points.height
			) || (
				vereda.to.x >= 0 && vereda.to.y >= 0 &&
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x < canvas_points.width &&
				vereda.to.y < canvas_points.height
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x >= 0 && vereda.to.y <= 0 &&
				vereda.from.x < canvas_points.width &&
				vereda.from.y < canvas_points.height
			) || (
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x >= 0 && vereda.from.y <= 0 &&
				vereda.to.x < canvas_points.width &&
				vereda.to.y < canvas_points.height
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x < canvas_points.width &&
				vereda.from.y > canvas_points.height &&
				vereda.to.x > canvas_points.width &&
				vereda.to.y < canvas_points.height
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.to.x < canvas_points.width &&
				vereda.to.y > canvas_points.height &&
				vereda.from.x > canvas_points.width &&
				vereda.from.y < canvas_points.height
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x <= 0 && vereda.to.y >= 0 &&
				vereda.to.y < canvas_points.height
			) || (
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x <= 0 && vereda.from.y >= 0 &&
				vereda.from.y < canvas_points.height
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x <= 0 && vereda.to.y <= 0
			) || (
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x <= 0 && vereda.from.y <= 0
			) || (
				vereda.from.x < 0 && vereda.from.y > 0 &&
				vereda.to.x > 0 && vereda.to.y < 0
			) || (
				vereda.to.x < 0 && vereda.to.y > 0 &&
				vereda.from.x > 0 && vereda.from.y < 0
			) || (
				vereda.from.x < 0 && vereda.from.y > 0 &&
				vereda.to.x > 0 && vereda.to.y < 0
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x >= 0 && vereda.to.y <= 0 &&
				vereda.from.x < canvas_points.width &&
				vereda.from.y > canvas_points.height
			) || (
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x >= 0 && vereda.from.y <= 0 &&
				vereda.to.x < canvas_points.width &&
				vereda.to.y > canvas_points.height
			) || (
				vereda.from.x <= 0 && vereda.from.y > 0 &&
				vereda.to.x >= 0 && vereda.to.y <= 0 &&
				vereda.from.y > canvas_points.height
			) || (
				vereda.to.x <= 0 && vereda.to.y > 0 &&
				vereda.from.x >= 0 && vereda.from.y <= 0 &&
				vereda.to.y > canvas_points.height
			) || (
				vereda.from.x > 0 && vereda.from.y > 0 &&
				vereda.to.x < 0 && vereda.to.y > 0 &&
				vereda.from.x < canvas_points.width &&
				vereda.from.y < canvas_points.height &&
				vereda.to.y > canvas_points.height
			) || (
				vereda.to.x > 0 && vereda.to.y > 0 &&
				vereda.from.x < 0 && vereda.from.y > 0 &&
				vereda.to.x < canvas_points.width &&
				vereda.to.y < canvas_points.height &&
				vereda.from.y > canvas_points.height
			)
		) && (
			(x1 > 0 && x1 <= canvas_points.width && y1 > 0 && y1 <= canvas_points.height) ||
			(x1 > 0 && x1 <= canvas_points.width && y2 > 0 && y2 <= canvas_points.height) ||
			(x2 > 0 && x2 <= canvas_points.width && y1 > 0 && y1 <= canvas_points.height) ||
			(x2 > 0 && x2 <= canvas_points.width && y2 > 0 && y2 <= canvas_points.height) ||
			(x1 > 0 && x1 <= canvas_points.width && x2 > 0 && x2 <= canvas_points.width) ||
			(y2 > 0 && y2 <= canvas_points.height && y2 > 0 && y2 <= canvas_points.height)
		)
	) {
		vereda_valida = true;
	}

	return vereda_valida;
}

var stringToFunction = function(str) {
	  var arr = str.split(".");

	  var fn = (window || this);
	  for (var i = 0, len = arr.length; i < len; i++) {
	    fn = fn[arr[i]];
	  }

	  if (typeof fn !== "function") {
	    throw new Error("function not found");
	  }

	  return  fn;
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.validExpReg = function(expReg) {
	var exr = new RegExp(expReg);
	return exr.test(this);
}
//BEGIN
//Adaptado de: http://www.kevlindev.com/gui/math/intersection/Intersection.js
function intersectLineLine(a1, a2, b1, b2) {
 var result = null;
 var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
 var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
 var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
 if ( u_b != 0 ) {
     var ua = ua_t / u_b;
     var ub = ub_t / u_b;
     if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
         result = {
             x: a1.x + ua * (a2.x - a1.x),
             y: a1.y + ua * (a2.y - a1.y)
         }
     } else {
         // No Intersection
     }
 } else {
     if ( ua_t == 0 || ub_t == 0 ) {
         // Coincident
     } else {
         // Parallel
     }
 }
 return result;
}
function intersectLinePolygon( a1, a2, points ) {
 var result = null;
 var length = points.length;
 for (var i=0; i<length; i++) {
     var b1 = points[i];
     var b2 = points[(i+1) % length];
     result = intersectLineLine(a1, a2, b1, b2);
     if (result) break;
 }
 return result;
}

// Chequeo si un plano se superpone con el plano actual.	
function overlayCheck (nx1,ny1,nx2,ny2) {
	let top = y2, botton = y1, left = x1, right = x2; 
	let topN = ny2, bottonN = ny1, leftN = nx1, rightN = nx2; 
    
    return !((botton > topN) ||
             (top < bottonN) ||
             (right < leftN) ||
             (left > rightN))
};
//---

function puntoMasCercano (puntos, punto){
	
	var distancia = null;
	var puntoMasCercano = null;
	var pointsArr = [];
	puntos = puntos.split(' ');
	
	var distanciaTotal= 0;
	for (index=0;index<puntos.length;index++){
		var point = puntos[index].split(",");
		var pointObj = {'x':0,'y':0, distance:0};
		pointObj.x =  parseInt(point[0]);
		pointObj.y =  parseInt(point[1]);
		pointsArr.push(pointObj);
		pointObj.distance = getDistanceBetweenPoints(punto, pointsArr[index]);
		if(index != (puntos.length - 1)){
			
			var pointNext = puntos[index+1].split(",");
			var pointObjNext = {'x':0,'y':0};
			pointObjNext.x =  parseInt(pointNext[0]);
			pointObjNext.y =  parseInt(pointNext[1]);
			
			distanciaTotal = distanciaTotal + getDistanceBetweenPoints(pointObj, pointObjNext);
		}
		if(distancia == null){
			distancia = pointObj.distance;
			puntoMasCercano = pointsArr[index];
		}else if(distancia > pointObj.distance){
			distancia = pointObj.distance;
			puntoMasCercano = pointsArr[index];
		}
	}
	return puntoMasCercano
}

// probando solucion a la ubicacion de los numeros en las calles - Leo
function getPoints (puntos, dist){
	var points = {
			first:{'x':0,'y':0}, last:{'x':0,'y':0}
	}
	
	var pointsArr = [];
	puntos = puntos.split(' ');
	var distanciaTotal= 0;
	
	for (index=0;index<puntos.length;index++){
		
		var point = puntos[index].split(",");
		var pointObj = {'x':0,'y':0};
		pointObj.x =  parseInt(point[0]);
		pointObj.y =  parseInt(point[1]);
		
		if(index != (puntos.length - 1)){
			
			var pointNext = puntos[index+1].split(",");
			var pointObjNext = {'x':0,'y':0};
			pointObjNext.x =  parseInt(pointNext[0]);
			pointObjNext.y =  parseInt(pointNext[1]);
			
			distanciaTotal = distanciaTotal + getDistanceBetweenPoints(pointObj, pointObjNext);
		}
		
	}
	var distanciaTotalMetros = distanciaTotal / scale;
	var min = (distanciaTotalMetros * dist) / 100; 
	var max = distanciaTotalMetros - min;
	
	var recorrido = 0;
	var recorridoMetros = 0;
	for (index=0;index<puntos.length;index++){
		
		var point = puntos[index].split(",");
		var pointObj = {'x':0,'y':0};
		pointObj.x =  parseInt(point[0]);
		pointObj.y =  parseInt(point[1]);
		
		if(index != (puntos.length - 1)){
			
			var pointNext = puntos[index+1].split(",");
			var pointObjNext = {'x':0,'y':0};
			pointObjNext.x =  parseInt(pointNext[0]);
			pointObjNext.y =  parseInt(pointNext[1]);
			
			let distance = getDistanceBetweenPoints(pointObj, pointObjNext);
			let distanceM = distance / scale;
			
			recorrido = recorrido + distance;
			recorridoMetros = recorrido / scale;
			
			if (index == 0){
				points.first = pointObj;
			}
			if (min >= recorridoMetros){
				points.first = pointObjNext;
			}
					
			if (max <= recorridoMetros){
				if( distanceM <= min){
					points.last = pointObj;
				} else {
					points.last = pointObjNext;
				}
			} 
			
		}
		
	}
	return points;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isString(n){
	return typeof n == "string";
}

function replaceAll(value, replace, rTo){
	return value.split(replace).join(rTo);
}

function getPointsIntersectPoint(points, point){
	// dado un punto y una lista de puntos verifica entre que puntos esta 
	var aux,r_points= null;
	for (let i = 0 ; i< points.length-1; i++){
		v_point1 = clone(points[i]);
		v_point2 = clone(points[i+1]);
		//esta funcion tiene un margen de error de 1px en el eje x
		if(Math.abs(v_point1.x-v_point2.x)<=1)
			v_point2.x = v_point1.x;
		
		if(v_point1.x!=v_point2.x){
			//Evalua si no es una recta paralela al eje Y
			if(v_point1.x>v_point2.x){
				aux =v_point1.x;
				v_point1.x=v_point2.x
				v_point2.x=aux;
				aux =v_point1.y;
				v_point1.y=v_point2.y
				v_point2.y=aux;
			}
			for (var px=v_point1.x;px<v_point2.x;px++)  {
				//funcion lineal entre los dos puntos para recorrer todos los puntos de la recta
				var pto_y=(((v_point2.y-v_point1.y)/(v_point2.x-v_point1.x))*(px-v_point1.x))+v_point1.y; //Esta cuenta solo sirve si v_point1.x!=v_point2.x
				if(Math.abs(px-point.x)<1 && Math.abs(pto_y-point.y)<1){
					//Si algun punto de la recta coninside con el punto dado(verificar margen de error) guarda true
					r_points = [points[i],points[i+1]];
					break;
				}
			}
		}else{
			//Si es paralela al eje Y, evalua los puntos sobre la recta en Y
			if(v_point1.y>v_point2.y){
				aux =v_point1.y;
				v_point1.y=v_point2.y
				v_point2.y=aux;
			}
			for (var py=v_point1.y;py<v_point2.y;py++){
				if(Math.abs(v_point1.x-point.x)<1 && Math.abs(py-point.y)<1){
					//Si algun punto de la recta coninside con el punto dado(verificar margen de error) guarda true
					r_points = [points[i],points[i+1]];
					break;
				}
			}
		}
		if(!isEmpty(r_points))break;
	}
	
    return r_points;
}
function getToken(){
	return localStorage.getItem("token_acces");
}
