# Samsung Minimal y Samsung AO3

Dos temas nuevos y optativos para aérea, basados en el video de Samsung Reminder y la captura AO3 entregados el 3 de octubre de 2026. Los estilos existentes no se modifican. La selección de cualquiera de estos dos temas empieza en oscuro; Light permite usar su variante clara.

## Qué se reconstruyó

| Área | Tratamiento nuevo |
|---|---|
| Superficies | Fondo plano, grupos de carbón, radios de 14 px y separadores finos; sin texturas, escenas, cintas ni burbujas decorativas. |
| Tipografía | Familia SamsungOne/One UI Sans si está disponible, con respaldo sans del dispositivo; títulos 25–32 px, filas 14 px, metadatos 11–13 px y pesos moderados. No se distribuyen fuentes propietarias de Samsung. |
| Cabecera | Menú lateral, nombre breve e iconos de línea para post-it, calendario y ajustes; zonas de toque de 44 px. |
| Menú lateral | Superficie carbón, selección gris, filas de 48 px, iconos finos y acceso a las secciones existentes. Usa el estado de apertura/cierre y Back ya existente. |
| Inicio | Saludo sin tarjeta decorada; fecha debajo, semana de siete días, agenda compacta y lista agrupada de recordatorios con círculo a la izquierda. |
| Calendarios | Mes, semana, búsqueda, selectores, categorías, moods, stickers y agenda con la misma paleta; se conserva SUN primero y la geometría de siete columnas. |
| Formularios | Campos agrupados, fondos sobrios, texto claro y acciones de guardar en el color de acento. Incluye evento, hábito, recordatorio, nota, post-it, tarea, materia y profesor. |
| Contenido | Biblioteca, tarjetas AO3, menús, herramientas PDF/EPUB, audio, notas, horario, carrera, métricas, papelera y ajustes con superficies coherentes. |
| Movimiento | Pulsación discreta de 120 ms; páginas de 180 ms; superficies de 220 ms; menú de 240 ms. Se respeta reduced motion y se evita animar el diseño geométrico. |
| Widgets Android | Agenda y mes usan paletas optativas propias; no cambian sus datos ni acciones. |

## Paletas

| Papel | Samsung Minimal oscuro | Samsung AO3 oscuro |
|---|---|---|
| Fondo | #000000 | #131313 |
| Grupo | #171717 | #1B1B1B |
| Texto | #F3F3F3 | #DFDBEC |
| Texto secundario | #A4A4A4 | #B1ABBC |
| Selección | #414045 | #3B313D |
| Acción | #A294F9 | #F4BFD7 |
| Títulos AO3 | Texto principal | #9ACBD1 |
| Categorías | Tonos neutros | Rosa, aqua, lavanda, salvia y ámbar sobre superficies oscuras |

Los colores de AO3 se obtuvieron visualmente de la captura proporcionada. El archivo no contiene el CSS original de ese skin.

## Inventario y aislamiento

`native-ui-inventory.md` y `native-ui-inventory.json` enumeran 584 declaraciones de controles, 913 identificadores de clases y 46 estilos inline del código. Una declaración reutilizada puede producir varios botones. El inventario de código no constituye una prueba visual de todos los estados posibles.

`html[data-native-theme]` y `.app-shell[data-native-theme]` solo se asignan a `samsungminimal` y `samsungao3`. Al volver a un tema anterior se eliminan ambos atributos y el atributo del modo; las hojas de estilos anteriores permanecen intactas. También se contempla el portal de carrera/profesores y los estilos internos de la biblioteca AO3.

Se mantienen los datos guardados, las fechas y horas de 12 h, las selecciones, los emojis importados, las portadas, las páginas PDF, los dibujos, la tinta y los movimientos de arrastre de post-its. Las muestras de color de los selectores conservan su función.

## Comprobaciones realizadas

- `npm ci`, tipos y límites de arquitectura: correctos. Lint no presenta errores; conserva advertencias previas del compilador React.
- Compilaciones web y contenido Android: correctas.
- Suite existente: 219 pruebas aprobadas.
- Capacitor: sincronización correcta. El modo claro/oscuro se guarda en el puente de widgets; el widget mensual adapta también los encabezados y resalta únicamente SUN/SAT.
- Navegador real sobre el contenido compilado: ambos temas, oscuro/claro, anchos de 393 y 800 px. Inicio, menú lateral, ajustes, editor de recordatorio, hábitos, journal, spaces, Library y calendario; sin desbordamiento horizontal. También se comprobó la ausencia del atributo nuevo al usar Lavender en ambos modos y tamaños.
- APK: la descarga de Gradle falló por falta de acceso a la red. No se generó APK ni se verificaron instalación, actualización o widgets en un dispositivo Android real.

## Límite de fidelidad

Se ha implementado una adaptación visual y de interacción del video dentro de la arquitectura actual. No es una conversión de WebView a controles nativos Samsung. La fuente exacta, el teclado, las barras del sistema y la respuesta de desplazamiento dependen del dispositivo y requieren revisión en el Samsung real. No se afirma identidad píxel por píxel ni la misma velocidad que Samsung Reminder.

## Recuperación del 4 de octubre de 2026

Aplicado y comprobado sobre `main` (`23dc2dc`), después de retirar los cuatro temas rechazados. Corregidas las columnas del selector de temas, el control de elegir foto y las paletas del widget mensual. Los cambios permanecen en una rama propia; no se han publicado ni fusionado. La revisión automática de autorización bloqueó la subida a GitHub.
