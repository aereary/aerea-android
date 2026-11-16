# aérea Together — integración del HTML original

Tema nuevo e independiente para `aereary/aerea-android`, sobre `main` en `f0338f50925d81652ae81db97449a6bcd93f4c3f`.

## Cómo agregarlo

1. Descomprime el ZIP fuera del repositorio.
2. Copia su contenido en la raíz del repositorio, conservando las carpetas `app`, `android`, `public`, `scripts`, `design`, `tests` y `docs`. Incluye también `native.html`.
3. Confirma los cambios en una sola rama y completa su pull request. El paquete incluye la integración completa del tema, por lo que no requiere el ZIP anterior del tema Together ni el rediseño descartado de la biblioteca normal.
4. Genera el APK con el flujo habitual del proyecto y su firma existente.
5. Dentro de la app, abre Settings y selecciona **aérea Together**. En sus ajustes están **Evening rose**, **Paper morning** y los acentos del HTML. **All app themes** permite volver a otro tema.

## Qué contiene

- El HTML original, su CSS completo y sus pantallas, aislados en un documento propio. El tema no sustituye estilos ni definiciones de los demás temas.
- Today, Daily care y My rhythm, Journal, Spaces, Calendar, My studies, My degree, Library, Fiction shelf, Class recordings, Inbox, Archive, Recently removed y Settings con los datos reales.
- Importación de archivos y audio; notas y colecciones; clases y grabaciones; tareas, eventos repetidos y rutinas; restauración de elementos mediante la papelera existente.
- El lector del HTML para EPUB y PDF. Los PDF con texto se presentan de manera continua y usan su índice integrado o encabezados detectados. Las páginas sin texto se muestran como imágenes originales; no se inventa OCR ni un índice inexistente.
- Guardado de posición, capítulos/páginas, marcadores y tamaño de lectura. El modo sin controles se abandona con doble toque o Back.
- Acceso a Fiction shelf a través del bloqueo privado existente. Los archivos de AO3 no se convierten en archivos de la biblioteca normal.
- Paletas de Together para los dos widgets existentes.

Los registros conservan sus identificadores y metadatos originales. No se introduce contenido de ejemplo en los datos de la app. El formulario de clases respeta la capacidad actual del horario: lunes a sábado.

## Fuente editable

- `design/together/reference.html`: HTML de referencia intacto.
- `scripts/generate-together-document.py`: adapta ese documento a los datos de la app sin modificar su CSS.
- `scripts/together/reader.js` y `native-bridge.js`: puentes del lector y de las acciones.
- `app/together-document.ts`: documento generado que utiliza la app.
- `app/together-experience.tsx`, `together-model.ts` y `together-reader.ts`: conexión con el estado y los archivos reales.

Después de editar el puente, ejecuta `python3 scripts/generate-together-document.py`. La prueba compara el CSS generado con el HTML y con su hash original para detectar cambios visuales involuntarios.

## Verificación de esta entrega

- `npm ci`: completado.
- `npm run check:repo`: arquitectura y tipos correctos; lint sin errores; compilación web y nativa completadas; 312 pruebas aprobadas.
- Comprobación del runtime del documento con DOM: rutas con datos vacíos y poblados, formularios, eventos repetidos y salida del lector/foco sin errores.
- `npx cap sync android`: completado.
- `./gradlew assembleDebug --stacktrace`: bloqueado al descargar Gradle 8.14.3 por `Network is unreachable`. No se generó un APK aquí.
- No se completó una comparación visual en navegador: Chromium no pudo iniciar porque el entorno bloquea sus sockets. El CSS original sí se verificó byte por byte.
- Pendientes en dispositivo: instalación/actualización firmada, comparación visual en Samsung y tableta, permisos/grabación, archivos reales de EPUB/PDF, desbloqueo privado, sincronización remota y los dos widgets. Las pruebas automatizadas no sustituyen estas comprobaciones.

No se modificaron la firma ni el identificador de Android. Este archivo es un paquete de código para integrar; no indica que el repositorio remoto o el APK instalado ya se hayan actualizado.
