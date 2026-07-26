# Traspaso de aérea a Codex para Android

Este repositorio contiene la interfaz funcional de **aérea**, el proyecto
Capacitor/Android, dos widgets nativos y el flujo de GitHub Actions que debe
publicar `aerea.apk`.

## Resultado esperado

Una aplicación Android instalable en teléfono y tableta que:

- conserve la interfaz y todos los flujos actuales;
- abra sin depender de una sesión de ChatGPT;
- guarde los datos de manera privada;
- pueda sincronizar teléfono y tableta de forma segura;
- use el calendario de Android cuando la usuaria lo autorice;
- programe notificaciones;
- grabe y reproduzca audios de clase;
- guarde dibujos con trazos nítidos y soporte de lápiz;
- conserve Safe Place, sus mensajes escritos y su latido opcional;
- incluya los widgets Agenda y Mes;
- se actualice descargando un nuevo `aerea.apk` desde GitHub Releases.

## Estado técnico actual

- Interfaz: `app/page.tsx`
- Estilos: `app/globals.css`
- API alojada: `app/api`
- Esquema de datos: `db`
- Configuración Capacitor: `capacitor.config.ts`
- Código Android y widgets: `android`
- Automatización del APK: `.github/workflows/build-apk.yml`
- Reglas visuales y de datos: `AGENTS.md`

El contenedor Android actual apunta a la URL privada de Sites. Esa URL usa la
cabecera `oai-authenticated-user-email` en `app/api/user.ts`. Una WebView normal
no recibe esa cabecera, así que no se debe considerar terminada la aplicación
solo porque compile.

## Migración necesaria

### 1. Persistencia local

Reemplaza, dentro del APK, las dependencias de `/api/state` y `/api/sketches`
por almacenamiento local nativo:

- SQLite/Room para calendario, hábitos, estados, diario, clases y metadatos;
- archivos privados de la aplicación para dibujos y grabaciones;
- migraciones versionadas para conservar datos al actualizar.

La versión web alojada puede seguir usando sus rutas actuales. La aplicación
Android debe detectar la plataforma nativa y usar el repositorio local.

### 2. Sincronización entre dispositivos

La sincronización requiere un servicio autenticado. No hagas público el sitio
ni inventes credenciales. Implementa una interfaz de sincronización y:

- si ya hay un backend privado configurado, úsalo con autenticación explícita;
- si faltan credenciales, entrega primero el APK local totalmente funcional y
  documenta exactamente la única configuración pendiente para activar sync;
- conserva funcionamiento sin conexión y resuelve conflictos por fecha de
  modificación, sin borrar silenciosamente datos.

### 3. Funciones Android

- Solicita `READ_CALENDAR` y `WRITE_CALENDAR` al activar la integración.
- Solicita `POST_NOTIFICATIONS` al crear el primer aviso.
- Solicita `RECORD_AUDIO` al comenzar la primera grabación.
- Usa alarmas/trabajo en segundo plano apropiado para recordatorios diarios y
  eventos.
- Mantén los archivos internos, con acciones separadas para exportar o
  compartir.
- Actualiza widgets al cambiar eventos, fecha, tema o tareas.

### 4. Inicio limpio

El primer arranque no debe contener eventos, clases, grabaciones, entradas de
diario, páginas de sketchbook ni otros datos creados durante las pruebas.
No borres los datos existentes durante una actualización.

### 5. Safe Place

Safe Place debe funcionar sin red. Conserva Hold me, Need praise, Can I cry? y
Little things, con mensajes incorporados que aparecen poco a poco. El latido
solo comienza después de tocarlo, debe tener control de apagado y debe respetar
las preferencias de reducción de movimiento. No uses generación automática de
mensajes ni telemetría sobre lo escrito allí.

## Temas

Conserva los temas existentes con su aspecto actual/original. Los tres temas
nuevos decorados son Duckling happy mail, Calico tea nook y Moonberry quilt;
no deben mostrar el sello blanco con animal. Lavender conserva el sello de la
nutria con `YOU MAY REST` curvado.

## Compilación y Releases

El workflow ya compila directamente desde el contenido del repositorio. No
descarga el código desde la URL privada.

1. Sube este proyecto completo a `https://github.com/aereary/aerea-android`.
2. Conserva `.github/workflows/build-apk.yml`.
3. En GitHub, abre **Actions** y ejecuta **Build aérea APK**, o haz push a
   `main`.
4. El flujo debe crear una versión en **Releases** con:
   - `aerea.apk`;
   - `aerea-source.tar.gz`.

## Criterios de aceptación

- El APK instala y abre sin navegador ni login de ChatGPT.
- Teléfono y tableta muestran diseños adaptados, sin recortes.
- Una instalación nueva está limpia.
- Una actualización conserva los datos.
- Calendario, notificaciones y micrófono usan permisos solicitados en contexto.
- Sketchbook funciona con stylus, zoom, deshacer/rehacer y trazos nítidos.
- Agenda y Mes aparecen en el selector de widgets y se actualizan.
- Safe Place funciona sin conexión, sin IA en tiempo de ejecución y sin
  reproducir sonido sin consentimiento.
- Solo se publica un APK después de completar las verificaciones de `AGENTS.md`.
