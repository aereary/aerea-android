# aérea para Android

Este repositorio genera una versión instalable de **aérea** con sus dos widgets:

- **Agenda de aérea**, para ver el día, avanzar o retroceder y añadir eventos.
- **Mes de aérea**, con calendario mensual, indicadores y una miniagenda.

## Descargar la aplicación

1. Abre la sección **Releases** del repositorio.
2. Entra en la versión más reciente de **aérea preview**.
3. Descarga `aerea.apk`.
4. Toca el archivo para instalarlo.

Android puede pedir autorización para instalar aplicaciones desde GitHub o
desde el navegador. Cada corrección publicada crea una versión nueva en
**Releases**. Descarga el nuevo `aerea.apk` y Android ofrecerá **Actualizar**
sin borrar tus datos.

Cada versión también adjunta `aerea-source.tar.gz`, una copia del código exacto
utilizado para construir ese APK.

Para continuar el desarrollo con Codex, usa `CODEX_PROMPT.md`. El contexto
técnico completo está en `CODEX_ANDROID_HANDOFF.md` y las reglas que no deben
cambiar están en `AGENTS.md`.

La firma no se incluye en el repositorio. GitHub Actions la reconstruye desde
los Secrets `AEREA_KEYSTORE_BASE64`, `AEREA_KEYSTORE_PASSWORD`,
`AEREA_KEY_ALIAS` y `AEREA_KEY_PASSWORD`, lo que mantiene una identidad de
firma estable sin publicar la clave privada.

La aplicación funciona por completo en modo local y sin conexión. Para activar
la sincronización entre dispositivos queda una única configuración externa:
proporcionar la URL y autenticación de un backend privado compatible con la
interfaz de sincronización; nunca debe reutilizar la cabecera privada de Sites.

## Añadir los widgets

Mantén presionada una zona vacía de la pantalla principal, toca **Widgets**,
busca **aérea** y arrastra el widget que quieras.
