# Prompt listo para pegar en Codex

Trabaja en el repositorio `https://github.com/aereary/aerea-android`.

## Objetivo

Convierte el proyecto actual de **aérea** en una aplicación Android realmente
instalable y privada para teléfono y tableta. Debe producir
`outputs/aerea.apk` y publicarlo automáticamente en GitHub Releases.

## Contexto

Lee primero, completos, `AGENTS.md` y `CODEX_ANDROID_HANDOFF.md`. El repositorio
ya incluye la interfaz, Capacitor, el proyecto Android, dos widgets y un
workflow de compilación. La WebView actual apunta a un sitio privado cuya API
depende de una cabecera de autenticación de ChatGPT; no des por terminada la
tarea si solo envuelves esa URL.

## Trabajo

1. Conserva la interfaz actual y el contrato de temas descrito en `AGENTS.md`.
2. Haz que el APK funcione sin navegador ni sesión de ChatGPT.
3. Implementa persistencia local con migraciones para estado, eventos, hábitos,
   diario, clases, dibujos y grabaciones.
4. Deja una instalación nueva sin datos de prueba y conserva datos al
   actualizar.
5. Implementa permisos de calendario, notificaciones y micrófono en contexto.
6. Termina y verifica los widgets Agenda y Mes.
7. Mantén funcionamiento sin conexión.
8. Prepara sincronización segura entre teléfono y tableta. Si falta una
   credencial o decisión externa, completa primero el APK local y deja una
   única instrucción concreta para habilitar sync; no hagas público el sitio.
9. Conserva Safe Place completamente sin conexión, con mensajes incorporados,
   audio opcional iniciado por la usuaria y sin generación por IA.
10. Corrige cualquier recorte en teléfono/tableta sin rediseñar la app.
11. Ajusta GitHub Actions para que cada push válido a `main` cree una Release
    con `aerea.apk`.

## Límites

- El nombre visible es `aérea`, siempre en minúsculas.
- No añadas mascotas ni datos de demostración.
- No sustituyas la estética por una interfaz Android genérica.
- No borres información real durante una actualización.
- No copies credenciales ni publiques información privada.

## Verificación y entrega

Ejecuta todas las verificaciones de `AGENTS.md`, inspecciona los logs de Gradle
y comprueba que el APK exista. Al terminar, informa:

- qué quedó implementado;
- qué probaste;
- la ruta exacta del APK;
- el enlace a la Release;
- cualquier única acción externa todavía necesaria.
