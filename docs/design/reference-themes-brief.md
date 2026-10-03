# Little day aérea — inventario minucioso y cuatro temas nuevos

Solicitud: cuatro temas nuevos, en el orden de las imágenes, sin editar los diseños anteriores.

Estado: implementación local preparada; revisión visual exhaustiva y APK pendientes. No se ha publicado ni se ha cambiado la app instalada.

## Referencias y tratamiento

| Imagen | Tema | Composición y detalles |
|---|---|---|
| 1 | Astral Night | Noche violeta, estrellas, luna inferior, paneles morados, controles orbitales e iconos finos. |
| 2 | Blush Cards | Fondos blancos, tarjetas rosa superpuestas, lavanda suave, contornos finos, botones en cápsula. |
| 3 | Pastel Layers | Paneles amplios rosa/lila, capas y accesos circulares. La inclinación de los teléfonos en la foto es parte del montaje, no de la interfaz. |
| 4 | Pastel Journey | Paisajes ilustrados, títulos serif, tarjetas de gran radio, curvas y controles circulares pastel. |

Las imágenes 2 y 3 comparten familia de diseño, pero tienen temas y composiciones independientes. Las ilustraciones fueron recreadas en SVG para la app; no son capturas recortadas. Colores aproximados a las referencias. Las capturas no especifican todas las pantallas, por lo que los controles adicionales siguen el mismo sistema visual.

## Reglas de protección

- Los estilos de temas anteriores permanecen intactos en globals.css. Los nuevos estilos se activan exclusivamente con los cuatro IDs nuevos.
- No se cambian las funciones, datos guardados ni el identificador de Android.
- Se conservan semana SUN–SAT, horas AM/PM, selección del día, vínculos de archivos y gestos.
- Las portadas, archivos, fotografías, páginas PDF/EPUB y dibujos conservan su contenido. Sus controles de interfaz sí reciben el nuevo tema.
- Los selectores de color de tinta y papel conservan sus muestras reales, aunque cambia el diseño del control.
- Los avisos y diálogos de permisos de Android dependen del sistema y no pueden rediseñarse completamente desde un tema de la app.
- No se añadió contenido de prueba ni se reintrodujeron controles retirados. Safe Place no aparece en el código de esta rama y no se marca como rediseñado.

## Lista por parte

Cada elemento es una unidad de revisión para los cuatro temas. Esta lista distingue el alcance visual del código de la verificación final en dispositivo; no marca controles no visitados como comprobados.

### 01 · Sistema visual y arranque

- V-0001: Fondo exterior de la aplicación.
- V-0002: Superficie interior de teléfono y tableta.
- V-0003: Color de la primera pantalla al abrir.
- V-0004: Restauración del tema guardado.
- V-0005: Color de la barra de estado.
- V-0006: Color y contraste de la barra del sistema.
- V-0007: Modo claro.
- V-0008: Modo oscuro.
- V-0009: Tipografía de títulos.
- V-0010: Tipografía de contenido.
- V-0011: Tipografía de botones y campos.
- V-0012: Jerarquía de tamaños y pesos.
- V-0013: Márgenes y separación de secciones.
- V-0014: Radios de las superficies.
- V-0015: Bordes y divisores.
- V-0016: Sombras y elevación.
- V-0017: Ilustraciones decorativas.
- V-0018: Iconos de interfaz.
- V-0019: Emojis elegidos por la usuaria.
- V-0020: Pantalla completa y áreas seguras.
- V-0021: Preferencia de movimiento reducido.

### 02 · Cabecera y navegación

- V-0022: Marca MY LITTLE DAY aérea.
- V-0023: Fotografía de perfil.
- V-0024: Marca sin fotografía.
- V-0025: Acceso desde la marca a los espacios.
- V-0026: Botón de post-it nuevo.
- V-0027: Botón Calendar.
- V-0028: Botón de ajustes.
- V-0029: Pestaña Today.
- V-0030: Pestaña Habits.
- V-0031: Botón central Add / Quick Capture.
- V-0032: Pestaña Journal.
- V-0033: Pestaña Spaces.
- V-0034: Pestaña seleccionada.
- V-0035: Pestaña inactiva.
- V-0036: Iconos de navegación.
- V-0037: Textos de navegación.
- V-0038: Fondo y borde de botonera.
- V-0039: Gestos entre pestañas.
- V-0040: Botón de regreso de pantallas interiores.
- V-0041: Historial de navegación.
- V-0042: Confirmación de salida con doble Back.

### 03 · Inicio / Today

- V-0043: Tarjeta de bienvenida.
- V-0044: Good morning / Good evening.
- V-0045: Nombre y texto de bienvenida.
- V-0046: Fecha del día elegido.
- V-0047: Ilustración del encabezado.
- V-0048: Acceso al horario por pulsación prolongada.
- V-0049: Franja de siete días.
- V-0050: Nombre de cada día.
- V-0051: Número de cada día.
- V-0052: Día seleccionado.
- V-0053: Marca del día actual.
- V-0054: Domingo y sábado.
- V-0055: Lunes a viernes.
- V-0056: Coming up next.
- V-0057: Etiqueta del siguiente evento.
- V-0058: Ficha del siguiente evento.
- V-0059: Título Today’s schedule.
- V-0060: Acceso See calendar.
- V-0061: Mensaje de agenda vacía.
- V-0062: Fichas del día elegido.
- V-0063: Columna de hora inicial y final.
- V-0064: AM / PM.
- V-0065: Nombre de evento.
- V-0066: Categoría de evento.
- V-0067: Ubicación y nota breve.
- V-0068: Marcadores decorativos.
- V-0069: Controles de detalle y edición.

### 04 · Fichas de eventos y deportes

- V-0070: Evento normal.
- V-0071: Clase vinculada al horario.
- V-0072: Evento sin hora definida.
- V-0073: Evento de todo el día.
- V-0074: Evento recurrente.
- V-0075: Tarea vinculada al evento.
- V-0076: Evento de rutina o salud.
- V-0077: Evento deportivo.
- V-0078: Ficha especial de Boca.
- V-0079: Escudo e identidad del equipo.
- V-0080: Equipo rival.
- V-0081: Hora y cuenta regresiva.
- V-0082: Resultado y estado de partido.
- V-0083: Detalle deportivo de solo lectura.
- V-0084: Panel de hechos del partido.
- V-0085: Fondo y contorno de cada ficha.
- V-0086: Separadores y etiquetas de cada ficha.
- V-0087: Estado de tarea completada o pendiente.

### 05 · Calendario habitual

- V-0088: Fondo de la ventana del calendario.
- V-0089: Cabecera del mes.
- V-0090: Controles de mes anterior y siguiente.
- V-0091: Selector de fecha.
- V-0092: Lista de meses.
- V-0093: Lista de años.
- V-0094: Botón Done del selector.
- V-0095: Go to today / Today.
- V-0096: Botón de búsqueda.
- V-0097: Campo de búsqueda.
- V-0098: Botón de regreso de búsqueda.
- V-0099: Resultados agrupados.
- V-0100: Ficha de cada resultado.
- V-0101: Estado sin resultados.
- V-0102: Filtros por calendario.
- V-0103: Calendario oculto o visible.
- V-0104: Celdas de día.
- V-0105: Número de día.
- V-0106: Día de otro mes.
- V-0107: Día elegido.
- V-0108: Día actual.
- V-0109: Eventos dentro de celda.
- V-0110: Más eventos de un día.
- V-0111: Puntos de eventos.
- V-0112: Marca de día completado.
- V-0113: Marca de día pendiente.
- V-0114: Resumen del día elegido.
- V-0115: Crear en el día seleccionado.

### 06 · Just a calendar / mensual

- V-0116: Pantalla mensual independiente.
- V-0117: Nombre del mes y del año.
- V-0118: Selector mensual y anual.
- V-0119: Cuadrícula mensual.
- V-0120: Semana SUN–SAT.
- V-0121: Número de cada fecha.
- V-0122: Eventos compactos.
- V-0123: Límite de tres eventos por celda.
- V-0124: Botón de eventos adicionales.
- V-0125: Filtros del mes.
- V-0126: Cabecera de filtros.
- V-0127: Acceso a ajustes.
- V-0128: Acción Today.
- V-0129: Navegación inferior de calendario.
- V-0130: Acceso a agenda del día.
- V-0131: Acceso a agenda de hoy.
- V-0132: Acción añadir cuando esté presente en esta versión.
- V-0133: Modo Full aérea / Just calendar.
- V-0134: Estados de selección mensual.

### 07 · Agenda y cronograma

- V-0135: Cabecera de cronograma.
- V-0136: Nombre y rango de la semana.
- V-0137: Semana anterior y siguiente.
- V-0138: Return to today.
- V-0139: Vista semanal.
- V-0140: Vista en lista.
- V-0141: Eje de horas.
- V-0142: Filas de tiempo.
- V-0143: Horas ocultas o visibles según contenido.
- V-0144: Columnas de días.
- V-0145: Eventos de todo el día.
- V-0146: Bloque de evento con hora.
- V-0147: Nombre y categoría.
- V-0148: Icono de evento.
- V-0149: Ubicación y datos breves.
- V-0150: Recordatorio de evento.
- V-0151: Eventos superpuestos.
- V-0152: Indicador de hora actual.
- V-0153: Vista de arrastre.
- V-0154: Hora de destino durante arrastre.
- V-0155: Acción rápida para añadir.
- V-0156: Franja de navegación.
- V-0157: Estado vacío.
- V-0158: Separadores verticales y horizontales.

### 08 · Moods y stickers

- V-0159: Panel de moods.
- V-0160: Panel de stickers.
- V-0161: Deslizamiento entre paneles.
- V-0162: Círculo de cada mood.
- V-0163: Emoji de cada mood.
- V-0164: Círculo de cada sticker.
- V-0165: Sticker seleccionado.
- V-0166: Mood seleccionado.
- V-0167: Marca dentro de la celda.
- V-0168: Marca en resumen del día.
- V-0169: Altura de los paneles.
- V-0170: Esquinas de los paneles.
- V-0171: Colores de los grupos.
- V-0172: Estado de día sin marca.
- V-0173: Reemplazo mutuo entre mood y sticker.

### 09 · Editor de eventos

- V-0174: Fondo del editor.
- V-0175: Botón de regreso.
- V-0176: Título de creación o edición.
- V-0177: Campo de título.
- V-0178: Sugerencias de título.
- V-0179: Historial de plantillas.
- V-0180: Fecha inicial.
- V-0181: Fecha final.
- V-0182: Hora inicial.
- V-0183: Hora final.
- V-0184: Todo el día.
- V-0185: Hora por definir.
- V-0186: Error de rango de fechas.
- V-0187: Selector de categoría.
- V-0188: Acceso a administrar categorías.
- V-0189: Paleta de color.
- V-0190: Ubicación.
- V-0191: Notas.
- V-0192: Recurrencia.
- V-0193: Recordatorio y opciones.
- V-0194: Adjuntos nuevos.
- V-0195: Adjuntos ya guardados.
- V-0196: Campo de archivo.
- V-0197: Lista de tareas internas.
- V-0198: Campo de nueva tarea.
- V-0199: Estado de cada tarea.
- V-0200: Eliminar una tarea.
- V-0201: Guardar.
- V-0202: Cancelar / cerrar.
- V-0203: Eliminar.
- V-0204: Acciones de edición en teléfono.
- V-0205: Estado de guardado o error.

### 10 · Detalle y borrado de evento

- V-0206: Cabecera del detalle.
- V-0207: Regreso al calendario o al día.
- V-0208: Fecha del evento.
- V-0209: Etiqueta de categoría.
- V-0210: Título del evento.
- V-0211: Hora inicial y final.
- V-0212: Icono de hora.
- V-0213: Recordatorio.
- V-0214: Icono de recordatorio.
- V-0215: Ubicación y hechos.
- V-0216: Nota completa.
- V-0217: Adjuntos.
- V-0218: Lista de tareas.
- V-0219: Acciones sobre tareas.
- V-0220: Marcar rutina realizada.
- V-0221: Añadir contenido.
- V-0222: Botón de editar.
- V-0223: Confirmación de eliminar.
- V-0224: Eliminar una ocurrencia.
- V-0225: Eliminar una serie.
- V-0226: Cancelar la eliminación.

### 11 · Categorías y filtros

- V-0227: Ventana de administración.
- V-0228: Lista de categorías.
- V-0229: Nombre de cada categoría.
- V-0230: Color identificador.
- V-0231: Formulario de categoría.
- V-0232: Nombre nuevo.
- V-0233: Color nuevo.
- V-0234: Editar categoría.
- V-0235: Guardar categoría.
- V-0236: Eliminar categoría.
- V-0237: Mensajes de error.
- V-0238: Estado de filtro activo.
- V-0239: Estado de filtro oculto.
- V-0240: Mostrar todos.
- V-0241: Menú de filtros.

### 12 · Little reminders

- V-0242: Panel de recordatorios.
- V-0243: Encabezado del panel.
- V-0244: Acción añadir.
- V-0245: Fila de cada recordatorio.
- V-0246: Emoji del recordatorio.
- V-0247: Título del recordatorio.
- V-0248: Detalle breve.
- V-0249: Estado pendiente.
- V-0250: Estado completado.
- V-0251: Acción completar.
- V-0252: Acción restaurar.
- V-0253: Historial de completados.
- V-0254: Resumen del día anterior.
- V-0255: Estado vacío.
- V-0256: Editor de recordatorio.
- V-0257: Nombre editable.
- V-0258: Detalle editable.
- V-0259: Emoji editable.
- V-0260: Color editable.
- V-0261: Opciones de aviso que existen en el editor.
- V-0262: Guardar cambios.
- V-0263: Eliminar recordatorio.
- V-0264: Cancelar / cerrar.
- V-0265: Vista previa.

### 13 · Hábitos y rutina diaria

- V-0266: Cabecera Habits.
- V-0267: Acceso a My daily rhythm.
- V-0268: Resumen de hábitos.
- V-0269: Fila de hábito.
- V-0270: Nombre y emoji.
- V-0271: Color del hábito.
- V-0272: Días del hábito.
- V-0273: Puntos de cumplimiento.
- V-0274: Anillo o resumen de progreso.
- V-0275: Edición de hábito.
- V-0276: Creación de hábito.
- V-0277: Nombre.
- V-0278: Emoji.
- V-0279: Paleta.
- V-0280: Guardar hábito.
- V-0281: Eliminar hábito.
- V-0282: Cancelar hábito.
- V-0283: Panel de rutina diaria.
- V-0284: Ficha de rutina.
- V-0285: Cadencia.
- V-0286: Días de la semana.
- V-0287: Botón de cumplimiento.
- V-0288: Estado de rutina vacía.
- V-0289: Añadir rutina.
- V-0290: Editar rutina.
- V-0291: Eliminar rutina.
- V-0292: Acciones del formulario.

### 14 · Journal y notas

- V-0293: Cabecera Journal.
- V-0294: Lista de notas.
- V-0295: Ficha de nota.
- V-0296: Fecha de creación.
- V-0297: Vista de primera frase.
- V-0298: Hora AM / PM.
- V-0299: Emoji o cara de nota.
- V-0300: Composición de nota.
- V-0301: Campo de texto.
- V-0302: Opciones de nota.
- V-0303: Guardar nota.
- V-0304: Nota secreta y vista previa.
- V-0305: Apertura de nota.
- V-0306: Detalle de nota.
- V-0307: Texto de lectura.
- V-0308: Editor de nota.
- V-0309: Usada en / vínculos.
- V-0310: Editar.
- V-0311: Eliminar.
- V-0312: Cancelar / cerrar.
- V-0313: Fondo de papel.
- V-0314: Estado sin notas.

### 15 · Post-its

- V-0315: Acción crear post-it.
- V-0316: Post-it sobre la pantalla.
- V-0317: Texto del post-it.
- V-0318: Fondo de post-it.
- V-0319: Borde y sombra.
- V-0320: Centro para arrastrar.
- V-0321: Rotación.
- V-0322: Ancho y alto.
- V-0323: Control de tamaño.
- V-0324: Pulsación para editar.
- V-0325: Selección múltiple.
- V-0326: Barra de selección múltiple.
- V-0327: Group with others.
- V-0328: Grupo de post-its.
- V-0329: Archivo de post-its.
- V-0330: Ficha en archivo.
- V-0331: Vista previa del editor.
- V-0332: Campo de texto.
- V-0333: Opciones del editor.
- V-0334: Paleta actual.
- V-0335: Muestras de la paleta.
- V-0336: Deslizamiento de paletas.
- V-0337: Paleta anterior y siguiente.
- V-0338: Contador de paletas.
- V-0339: Guardar.
- V-0340: Cancelar.
- V-0341: Eliminar.

### 16 · Spaces / hub

- V-0342: Cabecera Spaces.
- V-0343: Tarjeta de cada espacio.
- V-0344: Icono de cada espacio.
- V-0345: Nombre de cada espacio.
- V-0346: Descripción de cada espacio.
- V-0347: Flecha de acceso.
- V-0348: Ventana del hub aérea.
- V-0349: Enlaces del hub.
- V-0350: Acceso a Inbox.
- V-0351: Acceso a clases.
- V-0352: Acceso a Library.
- V-0353: Acceso a post-its.
- V-0354: Acceso a Sketchbook.
- V-0355: Acceso a Trash.
- V-0356: Pantalla vacía de espacio.

### 17 · Quick Capture, Inbox y tareas

- V-0357: Ventana Quick Capture.
- V-0358: Selector de tipo de captura.
- V-0359: Campo de texto.
- V-0360: Adjunto de captura.
- V-0361: Guardar captura.
- V-0362: Estado guardando.
- V-0363: Cancelar captura.
- V-0364: Lista de Inbox.
- V-0365: Ficha de captura.
- V-0366: Icono y tipo.
- V-0367: Título y vista previa.
- V-0368: Convertir en evento.
- V-0369: Convertir en nota.
- V-0370: Convertir en tarea.
- V-0371: Descartar captura.
- V-0372: Editor de tarea.
- V-0373: Campos básicos de tarea.
- V-0374: Notas de tarea.
- V-0375: Acciones de tarea.
- V-0376: Ventana para vincular tareas.
- V-0377: Columnas de vínculos.
- V-0378: Crear vínculo.
- V-0379: Quitar vínculo.
- V-0380: Lista de elementos vinculados.

### 18 · Clases y horario académico

- V-0381: Lista de clases.
- V-0382: Ficha de clase.
- V-0383: Icono editable.
- V-0384: Nombre de materia.
- V-0385: Materiales adjuntos.
- V-0386: Grabaciones adjuntas.
- V-0387: Añadir clase.
- V-0388: Editar clase.
- V-0389: Eliminar clase.
- V-0390: Formulario de clase.
- V-0391: Nombre de clase.
- V-0392: Emoji de clase.
- V-0393: Color de clase.
- V-0394: Selector de materiales.
- V-0395: Guardar / cancelar.
- V-0396: Panel del horario.
- V-0397: Nombre del cuatrimestre.
- V-0398: Fecha inicial del cuatrimestre.
- V-0399: Fecha final del cuatrimestre.
- V-0400: Cabecera de Week Map.
- V-0401: Franja de días.
- V-0402: Bloques de materias del día.
- V-0403: Acceso al plan de carrera.
- V-0404: Acción primera materia.
- V-0405: Lista editable de materias.
- V-0406: Formulario de materia del horario.
- V-0407: Nombre.
- V-0408: Reuniones de la materia.
- V-0409: Día de reunión.
- V-0410: Hora inicial.
- V-0411: Hora final.
- V-0412: Añadir reunión.
- V-0413: Eliminar reunión.
- V-0414: Color de materia.
- V-0415: Guardar materia.
- V-0416: Eliminar materia.
- V-0417: Guardar cuatrimestre.
- V-0418: Estado sin materias.

### 19 · My degree y profesores

- V-0419: Pantalla del plan de carrera.
- V-0420: Cabecera y botón Back.
- V-0421: Resumen de carrera.
- V-0422: Progreso de créditos o materias.
- V-0423: Tarjetas de estadísticas.
- V-0424: Pestaña Summary.
- V-0425: Pestaña Plan.
- V-0426: Pestaña Available.
- V-0427: Lista de materias.
- V-0428: Estados Completed / In progress / Pending / Withdrawn.
- V-0429: Estado seleccionado.
- V-0430: Leyenda de estados.
- V-0431: Detalle de materia.
- V-0432: Ficha de código y nombre.
- V-0433: Datos y prerrequisitos.
- V-0434: Ruta de prerrequisitos.
- V-0435: Opciones para editar estado.
- V-0436: Selector del estado.
- V-0437: Panel de profesores.
- V-0438: Introducción de profesores.
- V-0439: Ficha de cada profesor.
- V-0440: Valoración Recommended / Maybe / Avoid.
- V-0441: Filtro o búsqueda disponible.
- V-0442: Añadir profesor.
- V-0443: Formulario del profesor.
- V-0444: Datos del profesor.
- V-0445: Valoración editable.
- V-0446: Guardar profesor.
- V-0447: Cancelar profesor.
- V-0448: Ventanas inferiores superpuestas.

### 20 · Library normal / Study Library

- V-0449: Cabecera Library.
- V-0450: Botón Back.
- V-0451: Búsqueda.
- V-0452: Estadísticas.
- V-0453: Estantes y secciones.
- V-0454: Lista de colecciones.
- V-0455: Añadir archivo.
- V-0456: Importar.
- V-0457: Add images.
- V-0458: New note.
- V-0459: Organize.
- V-0460: Ficha de archivo.
- V-0461: Portada de archivo.
- V-0462: Título y formato.
- V-0463: Botón abrir archivo.
- V-0464: Menú de acciones de archivo.
- V-0465: Selección de un archivo.
- V-0466: Selección múltiple.
- V-0467: Select / Unselect.
- V-0468: Done de selección.
- V-0469: Favorito / pin.
- V-0470: Eliminar archivo.
- V-0471: Vínculos Used in.
- V-0472: Ficha de nota de estudio.
- V-0473: Título de nota.
- V-0474: Colecciones de nota.
- V-0475: Editor de nota.
- V-0476: Ficha de grabación.
- V-0477: Acciones de grabación.
- V-0478: Mensaje de operación.
- V-0479: Estado vacío.
- V-0480: Estado de carga.

### 21 · My AO3 Library y biblioteca general

- V-0481: Pantalla de apertura.
- V-0482: Cabecera AO3.
- V-0483: Botón Back.
- V-0484: Barra de búsqueda.
- V-0485: Filtro por tipo.
- V-0486: Filtro por tag.
- V-0487: Tag activo.
- V-0488: Limpiar búsqueda.
- V-0489: Contador de resultados.
- V-0490: Cuadrícula de fics.
- V-0491: Tarjeta de fic.
- V-0492: Título con acción copiar.
- V-0493: Autor y datos importados.
- V-0494: Estado de obra.
- V-0495: Resumen.
- V-0496: Fandoms.
- V-0497: Relationships.
- V-0498: Characters.
- V-0499: Additional tags.
- V-0500: Tags expandidos.
- V-0501: Tag que inicia búsqueda.
- V-0502: Tarjeta de serie.
- V-0503: Partes de la serie.
- V-0504: Series adicionales.
- V-0505: Lista de versiones.
- V-0506: Versión archivada.
- V-0507: Abrir enlace externo.
- V-0508: Acción descargar EPUB.
- V-0509: Confirmación de descarga.
- V-0510: Cancelar descarga.
- V-0511: Guardar archivo.
- V-0512: Error de descarga.
- V-0513: Toast de copia o descarga.
- V-0514: Mensaje sin resultados.
- V-0515: Ficha de libro genérico.
- V-0516: Formato de libro genérico.
- V-0517: Versiones de libro genérico.
- V-0518: Acciones de libro genérico.

### 22 · Lector PDF

- V-0519: Pantalla del lector.
- V-0520: Cabecera y título.
- V-0521: Cerrar / Back.
- V-0522: Barra de herramientas.
- V-0523: Selector de herramienta.
- V-0524: Tamaño de trazo.
- V-0525: Color de trazo.
- V-0526: Subrayador y tinta.
- V-0527: Borrador.
- V-0528: Zoom anterior / siguiente.
- V-0529: Nivel de zoom.
- V-0530: Campo de búsqueda.
- V-0531: Búsqueda anterior / siguiente.
- V-0532: Contador de coincidencias.
- V-0533: Resaltado de coincidencia.
- V-0534: Panel de navegación.
- V-0535: Miniatura de página.
- V-0536: Número de página.
- V-0537: Índice del PDF.
- V-0538: Enlaces del índice.
- V-0539: Marcadores.
- V-0540: Resaltados guardados.
- V-0541: Filtro de resaltados.
- V-0542: Menú de selección.
- V-0543: Notas de página.
- V-0544: Vínculos Used in.
- V-0545: Modo oscuro del lector.
- V-0546: Pie del lector.
- V-0547: Estado cargando.
- V-0548: Mensaje del lector.
- V-0549: Página PDF original.
- V-0550: Capa de texto.
- V-0551: Capa de tinta.

### 23 · Lector EPUB

- V-0552: Cabecera del lector.
- V-0553: Título del libro.
- V-0554: Cerrar / Back.
- V-0555: Barra de herramientas.
- V-0556: Índice por capítulos.
- V-0557: Número de capítulo.
- V-0558: Selector de tamaño de texto.
- V-0559: Controles de lectura.
- V-0560: Modo oscuro del lector.
- V-0561: Campo de búsqueda.
- V-0562: Resultados de búsqueda.
- V-0563: Texto coincidente.
- V-0564: Marcar posición.
- V-0565: Lista de bookmarks.
- V-0566: Añadir highlight.
- V-0567: Paleta de highlights.
- V-0568: Lista de highlights.
- V-0569: Filtro de highlights.
- V-0570: Menú de texto seleccionado.
- V-0571: Notas al margen.
- V-0572: Pestañas del panel.
- V-0573: Panel abierto / cerrado.
- V-0574: Texto y tablas del libro.
- V-0575: Posición guardada de lectura.
- V-0576: Pie del lector.

### 24 · Imagen y documentos genéricos

- V-0577: Cabecera del visor.
- V-0578: Título del archivo.
- V-0579: Botón cerrar.
- V-0580: Área de imagen.
- V-0581: Imagen original.
- V-0582: Error al abrir imagen.
- V-0583: Documento embebido.
- V-0584: Panel de contenido.
- V-0585: Panel de páginas.
- V-0586: Panel de marcadores.
- V-0587: Panel de highlights.
- V-0588: Panel de notas.
- V-0589: Texto de archivo conservado.
- V-0590: Mensaje de original guardado.

### 25 · Grabaciones y audio

- V-0591: Panel de grabación.
- V-0592: Encabezado de grabación.
- V-0593: Campos de título o clase.
- V-0594: Acción Start recording.
- V-0595: Indicador de grabación activa.
- V-0596: Stop & save.
- V-0597: Error de grabación.
- V-0598: Cancel recording.
- V-0599: Lista de grabaciones.
- V-0600: Ficha de audio.
- V-0601: Icono de audio.
- V-0602: Título y clase.
- V-0603: Control de reproducción.
- V-0604: Editar grabación.
- V-0605: Campos de edición.
- V-0606: Guardar edición.
- V-0607: Delete recording.
- V-0608: Confirmación de eliminar.
- V-0609: Estado sin grabaciones.

### 26 · Focus y métricas

- V-0610: Pantalla Focus.
- V-0611: Selector de modo de temporizador.
- V-0612: Superficie del temporizador.
- V-0613: Tiempo restante.
- V-0614: Botón iniciar.
- V-0615: Botón pausa.
- V-0616: Botón continuar.
- V-0617: Botón reset.
- V-0618: Contador de sesiones.
- V-0619: Tarjeta lateral.
- V-0620: Iconos decorativos del temporizador.
- V-0621: Pantalla de métricas.
- V-0622: Regreso y cierre de métricas.
- V-0623: Selector Week / Month / Year / All.
- V-0624: Rango de fechas.
- V-0625: Periodo anterior y siguiente.
- V-0626: Tarjetas de resumen.
- V-0627: Gráfica de progreso.
- V-0628: Gráfica de moods.
- V-0629: Donut de cumplimiento.
- V-0630: Información de racha existente.
- V-0631: Cuadrícula semanal.
- V-0632: Tarjetas de observaciones.
- V-0633: Estado sin historial.

### 27 · Sketchbook

- V-0634: Pantalla de dibujo.
- V-0635: Área exterior del lienzo.
- V-0636: Lienzo y papel.
- V-0637: Papel plain / ruled / grid.
- V-0638: Tamaño de página.
- V-0639: Orientación de página.
- V-0640: Color de página.
- V-0641: Color personalizado.
- V-0642: Selección de pluma.
- V-0643: Selección de tinta.
- V-0644: Grosor de trazo.
- V-0645: Borrador.
- V-0646: Herramientas de formas.
- V-0647: Herramientas inteligentes.
- V-0648: Herramienta de texto.
- V-0649: Panel para escribir texto.
- V-0650: Selección de elementos.
- V-0651: Acciones de selección.
- V-0652: Undo / Redo.
- V-0653: Zoom y navegación de lienzo.
- V-0654: Barra de herramientas.
- V-0655: Ocultar / mostrar herramientas.
- V-0656: Pantalla completa.
- V-0657: Salir de pantalla completa.
- V-0658: Guardar dibujo.
- V-0659: Limpiar página.
- V-0660: Exportar dibujo.
- V-0661: Tarjeta de exportación.
- V-0662: Galería de dibujos.
- V-0663: Miniatura de dibujo.
- V-0664: Título y datos de página.
- V-0665: Eliminar dibujo.
- V-0666: Estado de galería vacía.
- V-0667: Mensajes de operación.

### 28 · Ajustes y sincronización

- V-0668: Ventana Settings.
- V-0669: Cabecera de ajustes.
- V-0670: Cerrar ajustes.
- V-0671: Fotografía de perfil.
- V-0672: Choose photo.
- V-0673: Remove photo.
- V-0674: Tarjeta de sincronización.
- V-0675: Cuenta conectada.
- V-0676: Campo de correo.
- V-0677: Solicitud de código.
- V-0678: Campo de código.
- V-0679: Connect this device.
- V-0680: Send another code.
- V-0681: Estado de sincronización.
- V-0682: Sign out.
- V-0683: Callback de autenticación.
- V-0684: Resultado de callback.
- V-0685: Tarjeta Brightness.
- V-0686: Botón Light.
- V-0687: Botón Dark.
- V-0688: Tarjeta de modo simplificado.
- V-0689: Botón Full aérea.
- V-0690: Botón Just calendar.
- V-0691: Catálogo de temas.
- V-0692: Tarjeta de cada tema.
- V-0693: Ilustración de tema.
- V-0694: Nombre y descripción.
- V-0695: Muestras de paleta.
- V-0696: Estado de tema elegido.
- V-0697: Indicador NEW UI.
- V-0698: Créditos de ilustraciones.
- V-0699: Pie de ajustes.

### 29 · Papelera, avisos y estados comunes

- V-0700: Pantalla Trash.
- V-0701: Explicación de retención.
- V-0702: Lista de eliminados.
- V-0703: Ficha de elemento eliminado.
- V-0704: Días restantes.
- V-0705: Restore.
- V-0706: Eliminar definitivamente con confirmación existente.
- V-0707: Empty trash con confirmación existente.
- V-0708: Estado de papelera vacía.
- V-0709: Botón habilitado.
- V-0710: Botón deshabilitado.
- V-0711: Botón presionado.
- V-0712: Elemento seleccionado.
- V-0713: Foco de teclado visible.
- V-0714: Input con placeholder.
- V-0715: Input con valor.
- V-0716: Input con error.
- V-0717: Error de validación.
- V-0718: Estado de carga.
- V-0719: Estado de guardado.
- V-0720: Mensaje de éxito.
- V-0721: Mensaje de error.
- V-0722: Confirmación modal.
- V-0723: Tooltip / title.
- V-0724: Nombre accesible.
- V-0725: Texto de anuncio Undo / Redo.
- V-0726: Elementos ocultos para lectores de pantalla.
- V-0727: Notificaciones del sistema que existan.
- V-0728: Widget de agenda diaria.
- V-0729: Widget de calendario mensual.
- V-0730: Controles Today / Back del widget.
- V-0731: Controles anterior / siguiente del widget.
- V-0732: Acción añadir del widget.
- V-0733: Evento dentro del widget.
- V-0734: Celda y marcador mensual del widget.

## Inventario exacto del código

Base: 98af1cd4334b39914ed8b052283beff1991aee80. Se identificaron 579 declaraciones de controles, 912 identificadores visuales y 46 estilos inline. El anexo enumera cada declaración con archivo, línea, etiqueta, clase y contexto. Una declaración reutilizada puede representar varios botones. El inventario incluye ramas condicionales y no es un conteo de botones simultáneamente visibles.

## Verificación y pendientes

- Comprobación de tipos: correcta.
- Límites de arquitectura: correctos.
- Lint sin errores.
- Las 210 reglas CSS están aisladas por el atributo de los temas nuevos.
- Compilación web y del contenido Android: correctas.
- Suite existente: 219 pruebas aprobadas.
- Sincronización de Capacitor: correcta.
- Revisión visual de todas las pantallas, teléfono y tableta: pendiente; el navegador de revisión no pudo acceder a la vista local.
- Compilación APK: bloqueada por descarga de Gradle inaccesible; el entorno tampoco dispone de SDK Android configurado.
- Prueba en dispositivo, arranque, widgets e instalación como actualización: pendientes.
- Publicación de rama y PR: bloqueada por aprobación automática; se requiere autorización explícita para el repositorio público.

No se puede afirmar todavía que cada estado se ve idéntico a las capturas ni que se ha revisado visualmente cada botón.
