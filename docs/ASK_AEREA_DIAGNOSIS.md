# Ask aérea: diagnóstico e implementación inicial

Inspección: 9 de octubre de 2026. Base estable: `53cc38cb540ec5dc9406c7c08d6dc6a7f5992a53` (v0.127). Rama independiente: `feature/ask-aerea-20261009`. Esta etapa es una vista previa de búsqueda local con integraciones reales, **no el asistente de IA completo**. No modifica la versión publicada ni habilita consumo de un proveedor de modelos.

## Lo que existe y cómo se aprovecha

| Área | Evidencia encontrada | Integración de esta etapa | Desarrollo adicional |
| --- | --- | --- | --- |
| My AO3 Library | `ao3_works`: 504 obras; `ao3_epub_versions`: 509 versiones. Índice con fandoms, relaciones, personajes, etiquetas, palabras, estado y series; caché `aerea-ao3-library-cache-v1`. | Conector SELECT independiente. Reutiliza validadores e índice existentes, conserva el identificador de cada obra y cuenta sus versiones. No escribe a la biblioteca ni a sus cachés. | Embeddings/recuperación semántica real; recomendaciones con historial real; apertura directa por identificador si hay una interfaz pública segura. |
| Drive | Ingestión/sincronización existentes; 4 `library_items`, los 4 con espejo privado. La descarga AO3 nativa utiliza un enlace de Drive y puede importar/reemplazar la copia del lector. | Consulta nombres del catálogo sincronizado y enlace al original de Drive. Para EPUB de Your Library lee su copia actual o espejo privado sin restaurarlo/importarlo. | OAuth de solo lectura y selección de carpetas para buscar archivos fuera del catálogo; acceso de lectura a EPUB remotos. La conexión de una app de ChatGPT no equivale a OAuth dentro del APK. |
| EPUB | Lector existente y archivos privados `StudyFileItem`. La tabla AO3 contiene metadatos/versiones, no texto completo. | Extractor independiente en Worker, según el orden del spine; devuelve capítulo, fragmento y archivo. Una escena recordada puede producir un fragmento posible mediante sinónimos y coincidencia parcial, etiquetado como aproximado. Lectura explícita/cancelable, caché en memoria de hasta 12 MB. No envía el texto a IA. | Indexación incremental persistente opcional, recuperación semántica real, EPUB remotos. Navegación a posición exacta no implementada: abrir conserva la posición actual del lector. |
| Calendar y Schedule | Eventos y horario local-first en `app/page.tsx`; recurrencias, exclusiones, semestre y eventos generados de clases ya implementados. | Snapshot de eventos y recurrencias existentes (ayer a 90 días futuros), además de eventos originales. Consulta fechas relativas en America/Panama. Borradores abren el editor existente, sin crear hasta guardar allí. | Creación/edición directa con verificación durable, conflictos, adjuntos, idempotencia y confirmación de acciones destructivas. |
| Notes, tareas, Inbox, post-its | Estado actual de la app y almacenamiento/sincronización existentes. | Búsqueda conjunta con referencias y apertura de controles actuales. Cruce por términos compartidos, sin afirmar relaciones académicas no registradas. | Relaciones explícitas, extracción de PDF y otros formatos, acciones compuestas y herramientas académicas generativas. |
| Quick journal | Entradas privadas en el estado actual. | Deshabilitado por defecto en Ask; habilitación explícita por la usuaria. No lee estados de bienestar. | Memoria persistente opcional y permisos más granulares, si se solicitan. |
| Grabaciones | Grabación de fondo y almacenamiento de audio existentes; nombre, clase y notas. | Solo nombres/notas, deshabilitado por defecto. Abre la sección de grabaciones de esa clase. No altera ni transcribe audio. | Transcripción autorizada, timestamps y recuperación de fragmentos de audio. |
| Supabase | `aerea_sync` para estado privado, tablas de catálogo y buckets privados. RLS de AO3 por correo autenticado; `library_items` por `auth.uid()`. | Cliente autenticado existente, paginación de 500 hasta 20.000 filas, cancelación, caché original de respaldo. Sin migraciones, nuevas tablas, buckets o Edge Functions. | Endpoint de IA autenticado, validación server-side del usuario, límites de consumo, consentimiento para fragmentos externos. |

## Arquitectura inicial

- `app/ask-aerea/core.ts`: filtros/contexto deterministas y contratos de resultados. No es un LLM ni búsqueda semántica. Todos los términos y límites explícitos son obligatorios; sinónimos bilingües se identifican como coincidencias relacionadas. «Largo» significa 50.000+ palabras y «corto» hasta 20.000; se explica en los resultados.
- `library-connector.ts`: consultas de solo lectura a los catálogos actuales, agrupadas por ID de obra. No importa, fusiona, borra, renombra, comparte ni sincroniza libros.
- `search.worker.ts`: búsquedas fuera del hilo de la interfaz; hasta 40 referencias visibles por consulta, con total real. En una consulta explícita de una escena recordada y tras fallar la coincidencia estricta, compara pasajes locales y muestra únicamente una posibilidad bien etiquetada. No equivale a un modelo semántico.
- `epub-text.ts` / `epub.worker.ts`: extracción separada del lector. Límites de archivo, entradas y texto descomprimido; contenido nunca ejecutado ni interpretado como instrucciones.
- `ask-panel.tsx`: ficha nativa lazy desde los dos botones centrales `+`; conserva Quick Capture dentro de Ask. Entradas/salidas con SheetPresence, Back/Escape, cancelar, filtros de fuentes, referencias y errores aislados.
- `app/page.tsx`: adaptadores estrechos de lectura y navegación. Solo permite preparar un borrador en Calendar; la escritura utiliza Save y persistencia existentes.

La conversación se mantiene únicamente en memoria, hasta 12 intercambios visibles. Clear conversation elimina ese contexto, el snapshot temporal de metadatos y el texto auxiliar de Ask. Reiniciar elimina todo ello. La caché original de My AO3 Library permanece intacta. Cambiar permisos de fuentes borra el contexto anterior para evitar referencias a fuentes que se acaban de deshabilitar.

## Protección de My AO3 Library

No hay cambios en `app/ao3-library.tsx`, `app/generic-library-bridge.tsx`, `app/study-library.tsx`, `app/epub-reader.ts`, `app/study-reader.tsx`, tablas/migraciones/funciones Supabase o plugins Android. No se modifica la grabación, lectura, marcadores, metadatos, filtros, series, versiones o sincronización.

El botón de una obra AO3 abre **My AO3 Library**, usando su navegación actual; el enlace separado abre su original de Drive. Los EPUB locales pueden abrirse directamente en el lector actual. No se ha fingido una navegación al capítulo: el resultado muestra su referencia y abrir conserva el progreso existente. Una interfaz precisa para una obra/capítulo se debe resolver mediante un puente externo o solicitar aprobación específica antes de modificar un módulo protegido.

## Costo cero y uso personal

Ask aérea se diseña para una sola persona. **Costo adicional permitido: US$0.** Se descarta la propuesta anterior de una API de IA con un presupuesto mensual: ni siquiera un tope pequeño cumple el requisito. No se incorporan APIs de pago, embeddings alojados, transcripción facturable, nuevos recursos de servidor con cargo ni claves en el APK. Tampoco se confía en un nivel gratuito externo que pueda cambiar sus condiciones o requerir facturación. El plan existente de la app y Supabase tiene sus propias condiciones, que esta etapa no modifica ni promete financiar.

La búsqueda de metadatos y EPUB descargados se ejecuta localmente y no genera consumo de un proveedor de modelos. La búsqueda aproximada de una escena usa un vocabulario pequeño bilingüe y coincidencias parciales dentro de un pasaje: puede pasar por alto sinónimos no previstos o hallar una escena parecida. El resultado muestra el fragmento y su capítulo, con la etiqueta **Possible passage** y sin probabilidad inventada. No se presenta como una IA conversacional completa.

Si más adelante se necesita un modelo generativo local, primero habrá que comprobar tamaño del paquete, memoria, batería, rendimiento y compatibilidad en Android y web; no se ha descargado ni activado uno. La autenticación privada, los permisos y el aislamiento de fallos existentes se conservan aunque hoy haya una sola usuaria. La conexión OAuth Drive de solo lectura y el acceso a EPUB remotos siguen pendientes; se implementarán únicamente por una vía sin costo adicional comprobado.

## Secuencia siguiente y criterios de cierre

1. Validar esta base en la rama de desarrollo. No publicarla como Ask completo.
2. Ampliar la búsqueda local y las referencias comprobables. Evaluar un modelo local solo si funciona en el celular y en web sin servicios facturables.
3. Conector OAuth Drive independiente de solo lectura y búsqueda EPUB remota, condicionado a que la configuración y las cuotas puedan mantenerse en costo cero. Mantener originales/versiones; no llamar a import/reemplazo para indexar.
4. Índice de texto local incremental y eliminable, sin alojar embeddings de pago ni duplicar los metadatos de My AO3 Library.
5. Motor de acciones sobre funciones actuales: creación/modificación verificadas, idempotencia, errores parciales y confirmaciones sensibles; no duplicar el calendario.
6. Relaciones académicas y tareas compuestas; después investigar transcripción local autorizada y memoria opcional.

Los 15 escenarios del encargo completo **no están todos terminados**: búsqueda semántica real, texto remoto de toda la biblioteca, Drive general, creación/edición automática, planes/resúmenes académicos, transcripciones y memoria persistente siguen pendientes. La prueba de metadatos extensos usa 20.000 registros sintéticos aislados; la prueba funcional de UI también usa fixtures, no los datos personales ni el micrófono del dispositivo. Los conteos del catálogo y sus políticas se verificaron en el backend real con consultas de solo lectura.
