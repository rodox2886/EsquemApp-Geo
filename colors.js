CROMO_COLORS = {

	/*mapa tematico plugin electrico*/
	modo:{
		'default':'#333',
		'error':'#000',
		'nativo':{
			label:'Nativo'
		},
		'neutro':{
			label:'Neutro',
			color:'#333'
		},
		'electrico':{
			label:'Electrico',
			colors:{
				'energizado':{
					label:'Energizado',
					color:'#a00',
				},
				'desenergizado':{
					label:'Desenergizado',
					color:'#0a0',
				},
				'anillo':{
					label:'Anillo',
					color:'#00a'
				},
				'mallado_a':{
					label:'Mallado Anillo',
					color:'#a0a'
				},	
				'mallado':{
					label:'Mallado',
					color:'#a0a'
				},
				'zonaProtegida':{
					label:'Zona Protegida',
					color: 'rgb(178, 150, 0)'
				}
			}
		},
		'operacionIdms': {
			label: 'Operación Idms',
			colors: {
				'energizado':{
					label:'Energizado',
					color:'#333',
				},
				'desenergizado':{
					label:'Desenergizado',
					color:'#00a',
				},
				'anillo':{
					label:'Anillo',
					color:'#a00'
				},
				'mallado':{
					label:'Mallado',
					color:'#a00'
				},
				'zonaProtegida':{
					label:'Zona Protegida',
					color: 'rgb(178, 150, 0)'
				}
			}
		},
		'salida':{
			label:'Salida',
			colors:{

			}
		},
		'trafoBt':{
			label:'Trafo BT',
			colors:{

			}
		},
		'alimentador':{
			label:'Alimentador',
			colors:{

			}
		},
		'trafoMt':{
			label:'Trafo MT',
			colors:{

			}
		},
		'nivelTension':{
			label:'Nivel de Tensión',
			kv:{
				'0.4':"#3c61c1",
				21: "#00ffff",
				27: "#4CAF50",
				33: "#dd4be5",
				66: "#673ab7",
				132: "#ff5722",
				220: "#2196F3",
				500: "#f44336",
				'13.2': "#3f51b5",
			}
		},
		'tipoRed':{
			label:'Tipo de Red',
			color:false,
		}
	},

	/*Espaciales*/
	'espaciales':['#f44336','#673ab7','#ff9800','#4CAF50','#2196F3','#ffeb3b'],

	/* Rec tensión */
	'recorridos':[{clazz:'connection-rec-magenta', fill: 'connection-rec-magenta-fill'},{clazz: 'connection-rec-amarillo',fill: 'connection-rec-amarillo-fill'}, {clazz:'connection-rec-verde',fill: 'connection-rec-verde-fill'}, {clazz:'connection-rec-verde-fluor',fill: 'connection-rec-verde-fluor-fill'}, {clazz:'connection-rec-cyan',fill: 'connection-rec-cyan-fill'}, {clazz:'connection-rec-mostaza',fill: 'connection-rec-mostaza-fill'}],
	
	/* Conectado */
	'connected': '#3c00ac'

}