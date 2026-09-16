# Personalización manual segura de aérea

Esta guía indica qué puedes cambiar sin entrar en la parte delicada de la app.
La regla más importante es: **apariencia y valores normales arriba; datos,
almacenamiento y sincronización abajo y aislados**.

## Cambios seguros

| Quiero cambiar | Archivo | Qué editar |
| --- | --- | --- |
| Colores base, fondo, sombras y bordes redondeados | `app/styles/manual-customization.css` | Variables dentro de `:root` |
| Nombre, textos descriptivos y colores de instalación/PWA | `app/config/app-config.ts` | `APP_IDENTITY` y `APP_APPEARANCE` |
| Idioma base y horas de hidratación | `app/config/app-config.ts` | `UI_DEFAULTS` |
| Datos académicos iniciales | `app/career-plan-data.ts` | Cursos y profesores; no cambies las claves ya guardadas sin migración |
| Papel, tamaños y colores del sketchbook | `app/sketch-paper.ts` | Listas `SKETCH_PAGE_*` |
| Diseño del horario diario | `app/timetable-agenda.css` | Solo reglas visuales del horario |

Después de cualquier cambio ejecuta:

```bash
npm run check:repo
```

Para producir un APK también ejecuta los pasos Android de `AGENTS.md`.

## Cambios que requieren cuidado

- Los temas completos todavía viven en `app/globals.css` y su catálogo en
  `app/page.tsx`. Cambia un tema por vez y conserva su `id`, porque ese valor se
  guarda en el dispositivo.
- Los textos visibles de la aplicación deben permanecer en inglés salvo que se
  decida explícitamente lo contrario. Los datos escritos por la usuaria no se
  traducen.
- Las claves de `localStorage`, IDs de eventos, IDs de clases y números de
  versión de restauración son contratos de datos. Renombrarlos necesita una
  migración, no un reemplazo directo.
- Los XML de widgets Android tienen su propia apariencia y deben comprobarse
  en Samsung después de tocarlos.

## Zona protegida: no editar para un cambio visual

No cambies estos archivos al ajustar colores, tamaños o tarjetas:

- `app/supabase-sync.ts`
- `app/chatgpt-auth.ts`
- `app/ao3-library.tsx`
- `app/generic-library-bridge.tsx`
- `app/study-library.tsx`
- `app/study-reader.tsx`
- `app/api/**`
- `db/**`
- `supabase/**`
- `android/app/src/main/java/**`

Ahí viven autenticación, persistencia, Google Drive/Supabase, AO3, lectores,
archivos privados, notificaciones, permisos, widgets y sincronización. Si un
cambio visual parece requerir tocar uno de ellos, primero crea una capa visual
externa o una propiedad configurable.

## Flujo recomendado

1. Crea una rama desde la rama estable más reciente, nunca desde una rama
   histórica solo porque contiene una pantalla que te gusta.
2. Cambia un grupo pequeño de variables o una sola vista.
3. Revisa `git diff` completo.
4. Ejecuta `npm run check:repo`.
5. Si habrá APK, genera e instala una actualización y verifica que los datos
   reales sigan presentes.
