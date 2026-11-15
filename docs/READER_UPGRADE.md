# Estudio y adaptación del lector de aérea

Referencia: https://ficshelf.ficshelf-reader.workers.dev/#read=1
Revisión: 15 de noviembre de 2026. Base de aérea: commit 5459cef.

Se revisaron el HTML público, core.js, lib.js, app.js, style.css y el video aportado. La implementación es propia, adaptada a los componentes y datos de aérea; no es una copia completa del código de FicShelf.

## Hallazgos y cambios

| Aspecto | Referencia observada | Adaptación en aérea |
| --- | --- | --- |
| Interfaz | Barra pequeña y controles secundarios | Barra compacta, herramientas desplegables y lectura sin barras mediante toque central |
| Ajustes | Panel inferior por secciones | Panel Aa con Text, More y Scroll; preferencias persistentes |
| Tipografía | Fuentes, tamaño, espaciado y alineación | Cuatro familias, tamaño 12–40, interlineado, separación, ancho, alineación y tonos |
| Apariencia | Fondos de lectura independientes | Paper, Sepia, Night y Theme, limitados al lector |
| Navegación | Desplazamiento, páginas y zonas táctiles | Ambos modos, gestos, teclado, zonas configurables y animación respetando movimiento reducido |
| Lectura automática | Velocidad configurable | Desplazamiento automático con pausa al tocar; pantalla despierta cuando el sistema lo permite |
| EPUB | Contenido HTML con formato | Conservación de encabezados, énfasis, enlaces seguros e imágenes raster incrustadas; scripts y estilos externos excluidos |
| PDF | Page view y Text view | Página original con anotaciones y texto reajustable; conserva la página al alternar |
| Apertura PDF | Renderizado acotado e indexación | Se mantiene una página de canvas; límite de densidad/píxeles, cancelación del render anterior e indexación progresiva |
| Posición | Restauración tras ajustes | Posición persistente existente; ancla visible al cambiar tipografía en modo desplazamiento |

Se mantienen marcadores, notas, búsqueda, resaltados, índice y anotaciones existentes. No se modifica page.tsx, las fichas de la biblioteca, los filtros, la navegación general, la sincronización ni la base de datos. Los nuevos colores y reglas CSS están acotados al lector.

## Límites concretos

- No es una réplica exacta: EPUB sigue navegando por capítulos y PDF por páginas de origen. La animación de giro es una transición ligera, no una simulación física.
- Text view depende del texto extraíble del PDF: un escaneo sin capa de texto requiere Page view. No se ha añadido OCR. Tablas y documentos de varias columnas pueden perder su disposición en Text view.
- Se conserva formato semántico del EPUB, no todos sus estilos editoriales. SVG/MathML y fuentes incrustadas no se interpretan. Las imágenes independientes de los párrafos se muestran al principio del capítulo; el modo de texto simple y párrafos resaltados usan la representación de texto existente.
- Ajustes de tipografía y modo se guardan localmente para el lector; no se añade sincronización de estos ajustes entre dispositivos.
- No se promete apertura instantánea: aún se necesita obtener y analizar el archivo. Se evita parte del bloqueo de interfaz durante análisis/indexación.

## Validación

- npm ci: correcto.
- npm run check:repo: límites de arquitectura, TypeScript y ESLint sin errores; compilaciones web/nativa correctas; 296 pruebas aprobadas. Hay advertencias de lint.
- Prueba adicional con un EPUB sintético mediante el parser real: cursiva, negrita, imagen incrustada y eliminación de scripts/eventos, correcta.
- npx cap sync android: correcto.
- ./gradlew assembleDebug: bloqueado al descargar Gradle (Network is unreachable); no se generó APK.
- No se pudo realizar comprobación visual en un navegador ejecutable ni en un teléfono Android en este entorno.

Antes de publicar: abrir un EPUB y PDF reales en Android, cambiar fuente y orientación, alternar Pages/Scroll y Page/Text, reabrir posiciones guardadas y comprobar selección, notas y herramientas de tinta. Revisar especialmente EPUB con imágenes y PDF de varias columnas.
