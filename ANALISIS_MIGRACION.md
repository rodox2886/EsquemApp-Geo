# Análisis del programa y plan de migración (simbología + mapa)

## Resumen ejecutivo
El proyecto contiene **dos bases**:
1. Un visor nuevo en `index.html` (React + canvas, autocontenida) que ya renderiza entidades y trae diccionarios hardcodeados.
2. El programa original (arquitectura histórica) repartido en varios JS (`mapChannelServer.js`, `graphics.js`, `graphics1.js`, `colors.js`, `tools.js`, etc.).

Para “copiar fundamentalmente la simbología y el mapa del programa original”, lo más seguro es:
- **Fuente de verdad para simbología**: `graphics1.js` (catálogo grande de símbolos vectoriales), con fallback en `graphics.js`.
- **Fuente de verdad para estilo de red**: `colors.js` + `tools.js` (colores, tipos de línea, reglas).
- **Fuente de verdad para comportamiento de mapa**: `mapChannelServer.js` (zoom/fetch/refresh/protocolo de mensajes).

## Qué hace cada bloque

### 1) Visor nuevo (`index.html`)
- Implementa UI completa (panel, búsqueda, selección, edición manual, export).
- Tiene diccionarios embebidos:
  - `HARDCODED_GRAPHICS` (muy pequeño, solo algunos símbolos)
  - `HARDCODED_COLORS`, `HARDCODED_LINES`, clases y atributos.
- Conclusión: **hoy no usa todo el catálogo original**, solo un subconjunto.

### 2) Simbología original (`graphics1.js` y `graphics.js`)
- `graphics1.js` contiene un catálogo amplio de geometrías simbólicas (`gs`, `type`, `attr`) por id.
- `graphics.js` también define símbolos/estructuras, probablemente versión previa o parcial.
- Conclusión: para paridad visual, conviene mapear el renderer nuevo al formato de `graphics1.js`.

### 3) Motor/canal de mapa original (`mapChannelServer.js`)
- Define el protocolo de mensajes (`zoomXY`, `zoomRectangle`, `zoomArea`, `zoomObject`, `refreshScreen`, `search`, etc.).
- Orquesta fetch, redraw y sincronización entre vistas internas.
- Conclusión: aquí está la “lógica operacional del mapa” del legado.

## Brechas actuales para lograr paridad
1. **Catálogo incompleto en el visor nuevo**: solo hay simbología hardcodeada mínima.
2. **Posible diferencia de convenciones de ejes/orientación** entre renderer nuevo y símbolos legado.
3. **Diferencias de estilo de línea/color** si no se consumen los diccionarios del legado.
4. **Eventos de mapa**: el nuevo visor no replica todo el protocolo del `messageChannelMap` legado.

## Plan recomendado (incremental)

### Fase A — Paridad visual (simbología)
1. Extraer catálogo desde `graphics1.js` a un módulo consumible (JSON o JS exportable).
2. Adaptar parser para transformar `{type, gs, attr}` al renderer del canvas React.
3. Reemplazar `HARDCODED_GRAPHICS` por el catálogo importado.
4. Mantener fallback para símbolos faltantes.

### Fase B — Paridad cartográfica (líneas/colores/mapa)
1. Migrar diccionarios de colores y patrones (`colors.js` / `tools.js`) al nuevo flujo.
2. Homologar grosores, dash, opacidades y prioridades de dibujo por clase/tensión.
3. Validar capas de calles, veredas, manzanas y red eléctrica con mismo orden de pintado.

### Fase C — Comportamiento de mapa
1. Implementar adaptador de mensajes compatible con `mapChannelServer.js` para operaciones clave:
   - `zoomXY`, `zoomRectangle`, `zoomArea`, `zoomObject`, `refreshScreen`, `search`.
2. Añadir pruebas de regresión visual con casos reales (misma entrada, misma vista esperada).

## Recomendaciones prácticas inmediatas
- Empezar por un “subset crítico” de clases (postes, CT, líneas MT/BT, suministros) y validar paridad.
- Crear una tabla de trazabilidad: `classId -> símbolo legado -> símbolo nuevo -> estado`.
- Congelar un dataset de prueba y comparar capturas antes/después.

## Prioridad para tu objetivo
Si el objetivo es **copiar fundamentalmente simbología y mapa**, el orden correcto es:
1) `graphics1.js` (simbología),
2) `colors.js`/`tools.js` (estilo de red),
3) `mapChannelServer.js` (operación del mapa).
