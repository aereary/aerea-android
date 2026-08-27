# Recuperacion de la fuente actual de ChatGPT Sites

Fecha de recuperacion: 2026-08-27

## Fuente canonica

- Proyecto de Sites: `appgprj_6a6201ac4bcc8191a9700d917874961e`
- Sitio publicado: `aerea-planner.aereaary.chatgpt.site`
- Version recuperada: Sites v175
- Commit exacto de la fuente de Sites: `176c7ff641f604388a25ef5f088dbd48a57b1cf4`
- Base de `main` usada para la recuperacion: `aa0e84042f10092d8648e522ec07723f9a440b13`
- Ancestro comun entre `main` y Sites v175: `f2dab70bc7f0601becad12c2d9bead4614922d81` (Sites v158)

La recuperacion se hizo desde la fuente del proyecto activo en Sites. No se uso el
commit `995c477ff065d02587211682ad428e5678429ee6` (Sites v156) ni otro snapshot
anterior.

## Cambios que faltaban en `main`

Entre Sites v158 y v175 habia 17 commits que aun no estaban en GitHub. Incluyen:

- mejoras de tarjetas de eventos, agrupacion de post-its, filtros y busqueda del calendario;
- apertura de resultados y detalles directamente en el editor de eventos;
- ajustes de Inbox, paletas, calendario movil y calendario extendido basado en la referencia vertical;
- mejoras de Spaces, editor compacto de clases y horario semestral;
- rediseño de Boca Day Pocket y sus stickers del escudo y La Bombonera;
- correcciones nativas de safe areas, splash, pantalla completa, nubes y navegacion en tablets;
- mejoras de busqueda AO3, incluida la busqueda interactiva por tags;
- limpieza de contenido personal para pruebas y restauracion de habitos incluidos.

Archivos afectados por esos cambios:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java`
- `android/app/src/main/res/values/styles.xml`
- `app/aerea-features.ts`
- `app/ao3-library.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/study-library.tsx`
- `public/assets/boca-crest-sticker.png`
- `public/assets/bombonera-sticker.png`
- `tests/aerea-contract.test.mjs`
- `tests/ao3-library.test.mjs`

El delta recuperado suma 4,454 inserciones y 645 eliminaciones respecto de `main`.

## Integracion con Android y AO3

La fuente v175 se integro sobre `main` mediante un merge de historiales, conservando
la infraestructura Android del repositorio. Encima de la fuente canonica solo quedan
las diferencias necesarias del PR #4 en estos cuatro archivos:

- `android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java`
- `app/ao3-library.tsx`
- `app/page.tsx`
- `tests/ao3-library.test.mjs`

Esas diferencias mantienen AO3 Auto Import: `Download EPUB` descarga por
`drive_file_id`, guarda el archivo privado como `kind: "epub"`, actualiza Your
Library inmediatamente y evita duplicados por `drive_file_id` o `work_id`. La
implementacion usa solicitudes de solo lectura y no modifica archivos en Google
Drive ni el flujo AO3 -> Drive -> Supabase.

No se eliminaron ni simplificaron funciones de Sites v175 para resolver la
integracion.

## Correcciones de seguridad previas al merge

- Se elimino del arranque el reset automatico marcado como
  `personal-content-reset-2026-08-24`, incluida la limpieza nativa, el saneamiento
  destructivo del estado y el borrado automatico de archivos web.
- Los payloads existentes se cargan y migran in-place sin vaciar contenido personal.
- La restauracion de habitos incorporados de 2026-08-26 sigue siendo aditiva y
  conserva incluso habitos personalizados que reutilicen un ID incorporado.
- Android usa `versionCode 260827000 + aereaRunNumber` y conserva
  `versionName "0.${aereaRunNumber}"`.

## Verificacion

La rama se valida con:

1. `npm ci`: correcto (803 paquetes instalados).
2. `npm test`: correcto; build web, build nativo y 62/62 tests aprobados.
3. `npx cap sync android`: correcto.
4. `android/gradlew.bat assembleDebug --stacktrace`: `BUILD SUCCESSFUL`.
5. `android/gradlew.bat testDebugUnitTest --stacktrace`: `BUILD SUCCESSFUL`.
6. APK confirmado en `android/app/build/outputs/apk/debug/app-debug.apk`.
7. APK inspeccionado: `versionCode 260827001`, `versionName 0.1` con el run
   local predeterminado.

No habia ningun dispositivo o emulador visible en `adb devices`, por lo que no se
pudieron ejecutar en este entorno las comprobaciones manuales de arranque limpio,
actualizacion, telefono, tablet y widgets.
