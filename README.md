# aérea

Aplicación personal de planificación para web y Android. El mismo repositorio
contiene la interfaz de **aérea**, su almacenamiento privado, la integración con
Supabase, la biblioteca AO3/PDF/EPUB, las funciones nativas de Android y los
widgets Agenda y Mes.

## Estado del proyecto

- Rama estable actual: `fix/restore-just-calendar-baseline-20260915`.
- `main` conserva una línea antigua y no debe usarse como base hasta completar
  su promoción controlada.
- Los Pull Requests ejecutan web, TypeScript, lint, la suite de regresión,
  sincronización de Capacitor y compilación Android.
- Las Releases instalables usan una clave privada guardada exclusivamente en
  GitHub Secrets; el repositorio nunca contiene el keystore.

## Descargar la aplicación

1. Abre **Releases** en GitHub.
2. Entra en la versión más reciente de **aérea preview**.
3. Descarga `aerea.apk`.
4. Abre el archivo en Android para instalar o actualizar.

Una actualización firmada conserva los datos existentes. Una instalación
nueva debe comenzar sin contenido de prueba.

## Desarrollo

Requisitos:

- Node.js 22.13 o posterior.
- Java 21 y Android SDK 36 para compilar el APK.
- Linux con `flock`, `curl` y GNU `timeout` para los helpers de Sites.

Instalación y comprobación ordinaria:

```bash
npm ci
npm run check:repo
```

Vista local:

```bash
npm run dev
```

Comprobación Android completa:

```bash
node ci/restore-android-binaries.mjs
npx cap sync android
cd android
./gradlew assembleDebug --stacktrace
```

## Estructura

| Ubicación | Responsabilidad |
| --- | --- |
| `app/` | Interfaz, lectores, configuración y lógica de producto |
| `app/config/app-config.ts` | Identidad y valores ordinarios editables |
| `app/styles/manual-customization.css` | Colores y dimensiones base editables |
| `app/api/`, `db/`, `supabase/` | Persistencia, archivos y sincronización |
| `android/` | Contenedor nativo, permisos, notificaciones y widgets |
| `tests/` | Contratos de regresión web y Android |
| `.github/workflows/verify.yml` | Verificación de Pull Requests sin publicar |
| `.github/workflows/build-apk.yml` | Construcción firmada y publicación de Releases |

## Documentación esencial

- [`AGENTS.md`](AGENTS.md): reglas obligatorias de producto y verificación.
- [`docs/MANUAL_CUSTOMIZATION.md`](docs/MANUAL_CUSTOMIZATION.md): cambios
  manuales seguros.
- [`docs/ARCHITECTURE_GUARDRAILS.md`](docs/ARCHITECTURE_GUARDRAILS.md): límites
  entre presentación, datos e integraciones.
- [`docs/AEREA_RECOVERY_MANIFEST.md`](docs/AEREA_RECOVERY_MANIFEST.md): funciones
  que no pueden perderse durante una recuperación.
- [`docs/BRANCH_POLICY.md`](docs/BRANCH_POLICY.md): fuente de verdad y limpieza
  de ramas.

## Flujo de cambios

1. Parte siempre de la rama estable indicada arriba.
2. Separa los cambios visuales de los cambios de datos o sincronización.
3. Ejecuta `npm run check:repo`.
4. Abre un Pull Request y espera que **Verify aérea** quede en verde.
5. Para una Release, verifica además instalación/actualización en teléfono y
   tableta cuando el cambio afecte Android.

No publiques credenciales, tokens, datos personales ni archivos de firma.
