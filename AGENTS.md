# aérea — instrucciones permanentes para Codex

## Identidad y alcance

- El nombre visible siempre es **aérea**, en minúsculas y con tilde.
- El identificador Android es `com.aereaary.aerea`.
- Es una aplicación personal para teléfono y tableta Android.
- Conserva la interfaz actual; no la reemplaces por Material Design genérico.
- No añadas mascotas, plantas motivacionales ni datos de ejemplo.

## Contrato visual

- La referencia principal de Lavender es la interfaz lavanda, blanca, redondeada y suave que ya existe.
- Conserva sin rediseñar los temas existentes:
  - Cloudberry meadow
  - Lavender otter
  - Strawberry picnic
  - Duckling pond
  - Bunny bakery
  - Moonlit calico
  - Little whale song
  - Ribbon promise
  - Gentle kitten
  - Soft guidance
  - Velvet permission
  - Peach ribbon parlor
  - Mint letter garden
  - Blueberry starglow
  - Apricot sunset sea
- Duckling happy mail, Calico tea nook y Moonberry quilt son temas nuevos y pueden tener escenas más decoradas.
- Los temas nuevos no deben mostrar el círculo blanco con animal en la tarjeta de bienvenida.
- En Lavender, el sello de la nutria sí permanece y el texto `YOU MAY REST` debe seguir una curva dentro del círculo.
- Mantén buen contraste en modo oscuro y corrige primero teléfono; después valida tableta.

## Safe Place

- El acceso discreto desde `MY LITTLE DAY aérea` abre **Safe Place**.
- No lo nombres “Aftercare”, “Subspace” ni “app para sumisos” en la interfaz.
- Conserva las experiencias Hold me, Need praise, Can I cry? y Little things.
- Los mensajes son un catálogo incorporado y cuidadosamente escrito; no se generan
  con IA en tiempo de ejecución.
- Nunca uses culpa, castigo, dependencia, exclusividad ni presión.
- El sonido siempre parte de una acción de la usuaria y puede apagarse.
- Safe Place no muestra tareas, rachas ni métricas de productividad.

## Datos

- Una instalación nueva debe comenzar sin eventos, clases, grabaciones, notas, dibujos ni estados de prueba.
- Los recordatorios y hábitos incorporados que forman parte del producto pueden conservarse.
- Una actualización del APK nunca debe borrar información real ya guardada.
- No hagas público el sitio ni desactives autenticación para resolver la persistencia.

## Android

- Mantén una firma estable para que Android ofrezca **Actualizar**.
- Genera el archivo final como `outputs/aerea.apk`.
- Conserva y termina los dos widgets:
  - agenda del día;
  - calendario mensual con miniagenda.
- Implementa permisos Android en tiempo de ejecución únicamente cuando la función los necesite:
  calendario, notificaciones y micrófono.
- El sketchbook y las grabaciones deben almacenarse dentro de la aplicación, con exportación opcional.
- El APK no debe depender de cabeceras privadas de ChatGPT para leer o guardar datos.

## Verificación obligatoria

Antes de entregar:

1. Ejecuta `npm ci`.
2. Ejecuta `npm test`.
3. Ejecuta `npx cap sync android`.
4. Ejecuta `cd android && ./gradlew assembleDebug --stacktrace`.
5. Confirma que existe `android/app/build/outputs/apk/debug/app-debug.apk`.
6. Copia el resultado a `outputs/aerea.apk`.
7. Comprueba inicio limpio, actualización sin pérdida de datos, teléfono, tableta y ambos widgets.

## Recovery baseline and regression safety

- Before changing an already-established feature, read `docs/AEREA_RECOVERY_MANIFEST.md`.
- The recovery baseline is commit `78df166e6442540fde71612917247e7c0270d118`; do not replace current files wholesale with older variants to recover one behavior.
- Treat `tests/recovery-baseline.test.mjs` and the existing Android correction tests as regression contracts. Strengthen them when fixing a regression; do not remove them to make a build pass.
- Android recovery work must preserve images, microphone, notifications, Back behavior, 12-hour time, center-based post-it drag, the approved Boca card, AO3, and phone/tablet behavior unless the user explicitly asks to change that specific area.
