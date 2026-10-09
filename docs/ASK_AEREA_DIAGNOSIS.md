# Ask aérea: diagnóstico e implementación inicial

Inspección: 9 de octubre de 2026. Base estable: `53cc38cb540ec5dc9406c7c08d6dc6a7f5992a53` (v0.127). Rama independiente: `feature/ask-aerea-20261009`. Esta etapa es una vista previa de búsqueda local con integraciones reales, **no el asistente de IA completo**. No modifica la versión publicada ni habilita consumo de un proveedor de modelos.

## Lo que existe y cómo se aprovecha

| Área | Evidencia encontrada | Integración de esta etapa | Desarrollo adicional |
| --- | --- | --- | --- |
| My AO3 Library | `ao3_works`: 504 obras; `ao3_epub_versions`: 509 versiones. Índice con fandoms, relaciones, personajes, etiquetas, palabras, estado y series; caché `aerea-ao3-library-cache-v1`. | Conector SELECT independiente. Reutiliza validadores e índice existentes, conserva el identificador de cada obra y cuenta sus versiones. No escribe a la biblioteca ni a sus cachés. | Embeddings/recuperación semántica real; recomendaciones con historial real; apertura directa por identificador si hay una interfaz pública segura. |
| Drive | Ingestión/sincronización existentes; 4 `library_items`, los 4 con espejo privado. La descarga AO3 nativa utiliza un enlace de Drive y puede importar/reemplazar la copia del lector. | Consulta nombres del catálogo sincronizado y enlace al original de Drive. Para EPUB de Your Library lee su copia actual o espejo privado sin restaurarlo/importarlo. | OAuth de solo lectura y selección de carpetas para buscar archivos fuera del catálogo; acceso de lectura a EPUB remotos. La conexión de una app de ChatGPT no equivale a OAuth dentro del APK. |
| EPUB | Lector existente y archivos privados `StudyFileItem`. La tabla AO3 contiene metadatos/versiones, no texto completo. | Extractor independiente en Worker, según el orden del spine; devuelve capítulo, fragmento y archivo. Lectura explícita/cancelable, caché en memoria de hasta 12 MB. No envía el texto a IA. | Indexación incremental persistente opcional, frases aproximadas/escenas semánticas, EPUB remotos. Navegación a posición exacta no implementada: abrir conserva la posición actual del lector. |
| Calendar y Schedule | Eventos y horario local-first en `app/page.tsx`; recurrencias, exclusiones, semestre y eventos generados de clases ya implementados. | Snapshot de eventos y recurrencias existentes (ayer a 90 días futuros), además de eventos originales. Consulta fechas relativas en America/Panama. Borradores abren el editor existente, sin crear hasta guardar allí. | Creación/edición directa con verificación durable, conflictos, adjuntos, idempotencia y confirmación de acciones destructivas. |
| Notes, tareas, Inbox, post-its | Estado actual de la app y almacenamiento/sincronización existentes. | Búsqueda conjunta con referencias y apertura de controles actuales. Cruce por términos compartidos, sin afirmar relaciones académicas no registradas. | Relaciones explícitas, extracción de PDF y otros formatos, acciones compuestas y herramientas académicas generativas. |
| Quick journal | Entradas privadas en el estado actual. | Deshabilitado por defecto en Ask; habilitación explícita por la usuaria. No lee estados de bienestar. | Memoria persistente opcional y permisos más granulares, si se solicitan. |
| Grabaciones | Grabación de fondo y almacenamiento de audio existentes; nombre, clase y notas. | Solo nombres/notas, deshabilitado por defecto. Abre la sección de grabaciones de esa clase. No altera ni transcribe audio. | Transcripción autorizada, timestamps y recuperación de fragmentos de audio. |
| Supabase | `aerea_sync` para estado privado, tablas de catálogo y buckets privados. RLS de AO3 por correo autenticado; `library_items` por `auth.uid()`. | Cliente autenticado existente, paginación de 500 hasta 20.000 filas, cancelación, caché original de respaldo. Sin migraciones, nuevas tablas, buckets o Edge Functions. | Endpoint de IA autenticado, validación server-side del usuario, límites de consumo, consentimiento para fragmentos externos. |

## Arquitectura inicial

- `app/ask-aerea/core.ts`: filtros/contexto deterministas y contratos de resultados. No es un LLM ni búsqueda semántica. Todos los términos y límites explícitos son obligatorios; sinónimos bilingües se identifican como coincidencias relacionadas. «Largo» significa 50.000+ palabras y «corto» hasta 20.000; se explica en los resultados.
- `library-connector.ts`: consultas de solo lectura a los catálogos actuales, agrupadas por ID de obra. No importa, fusiona, borra, renombra, comparte ni sincroniza libros.
- `search.worker.ts`: búsquedas fuera del hilo de la interfaz; hasta 40 referencias visibles por consulta, con total real.
- `epub-text.ts` / `epub.worker.ts`: extracción separada del lector. Límites de archivo, entradas y texto descomprimido; contenido nunca ejecutado ni interpretado como instrucciones.
- `ask-panel.tsx`: ficha nativa lazy desde los dos botones centrales `+`; conserva Quick Capture dentro de Ask. Entradas/salidas con SheetPresence, Back/Escape, cancelar, filtros de fuentes, referencias y errores aislados.
- `app/page.tsx`: adaptadores estrechos de lectura y navegación. Solo permite preparar un borrador en Calendar; la escritura utiliza Save y persistencia existentes.

La conversación se mantiene únicamente en memoria, hasta 12 intercambios visibles. Clear conversation elimina ese contexto, el snapshot temporal de metadatos y el texto auxiliar de Ask. Reiniciar elimina todo ello. La caché original de My AO3 Library permanece intacta. Cambiar permisos de fuentes borra el contexto anterior para evitar referencias a fuentes que se acaban de deshabilitar.

## Protección de My AO3 Library

No hay cambios en `app/ao3-library.tsx`, `app/generic-library-bridge.tsx`, `app/study-library.tsx`, `app/epub-reader.ts`, `app/study-reader.tsx`, tablas/migraciones/funciones Supabase o plugins Android. No se modifica la grabación, lectura, marcadores, metadatos, filtros, series, versiones o sincronización.

El botón de una obra AO3 abre **My AO3 Library**, usando su navegación actual; el enlace separado abre su original de Drive. Los EPUB locales pueden abrirse directamente en el lector actual. No se ha fingido una navegación al capítulo: el resultado muestra su referencia y abrir conserva el progreso existente. Una interfaz precisa para una obra/capítulo se debe resolver mediante un puente externo o solicitar aprobación específica antes de modificar un módulo protegido.

## Opciones de IA y costo propuesto

Fuentes oficiales consultadas el 9 de octubre de 2026. Precios estándar en USD por millón de tokens; contexto corto, sin caché. El cálculo ilustrativo supone 3.000 tokens de entrada y 300 de salida por solicitud, una sola llamada, sin herramientas facturadas, embeddings, transcripción, almacenamiento, impuestos ni tokens adicionales de razonamiento. **No es una cotización ni un límite garantizado.**

| Alternativa | Entrada / salida | Ejemplo por 1.000 solicitudes | Uso propuesto |
| --- | --- | --- | --- |
| Búsqueda determinista local (implementada) | Sin costo de modelo | $0 de modelo | Metadatos, filtros, texto y consultas simples; el backend actual conserva sus propios límites de plan. |
| OpenAI GPT-6 Luna | $0,10 / $0,50 | $0,45 | Candidato inicial económico para interpretar intenciones y sintetizar fragmentos; Responses soporta function calling y salida estructurada. |
| OpenAI GPT-6.1 Sol | $2 / $10 | $9 | Evaluar solo para solicitudes complejas que Luna no resuelva bien, con escalamiento explícito. |
| Claude Haiku 5.5 (hasta 100.000 tokens) | $0,10 / $0,50 | $0,45 | Alternativa de routing/extracción; comparar con consultas reales en español e inglés antes de elegir. |
| Gemini 3.5 Flash-Lite | $0,30 / $2,50 | $1,65 | Alternativa de procesamiento económico. La página distingue uso de contenido para mejorar productos en free tier y paid tier; no enviar archivos privados al free tier por defecto. |
| Modelo/embeddings local | Sin costo API; usa recursos del dispositivo o servidor | Depende de hardware/hosting | Necesita evaluación de tamaño, batería, memoria y compatibilidad web/Android antes de instalar pesos. No se descarga ningún modelo en esta etapa. |

Fuentes: [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). La calidad relativa en tus consultas y la latencia en tu celular no se han medido; la propuesta es una decisión de implementación, no un benchmark de esos modelos.

Propuesta: preservar el camino de búsqueda sin modelo y evaluar **GPT-6 Luna**, con máximo **US$2 por mes de consumo del modelo**, solo tras aprobación. La clave iría en secretos del servidor, nunca en el APK/web/GitHub. Se necesita un límite duro server-side con reserva atómica por operación y tope de tokens/pasos para impedir que concurrencia/reintentos excedan el presupuesto; una alerta de facturación por sí sola no basta. No se ha habilitado ni creado ese servicio. Solo consultas y fragmentos seleccionados se enviarían, con fuentes privadas excluidas hasta consentimiento; el proveedor no recibe toda la biblioteca. Embeddings, audio y costos extra requerirían una decisión adicional.

## Secuencia siguiente y criterios de cierre

1. Validar esta base en la rama de desarrollo. No publicarla como Ask completo.
2. Tras elegir/aprobar proveedor y presupuesto: endpoint autenticado con secretos, permisos, límites y contratos de herramientas; evaluar español/inglés, ambigüedad, contexto, referencias e instrucciones maliciosas.
3. Conector OAuth Drive independiente de solo lectura y búsqueda EPUB remota. Mantener originales/versiones; no llamar a import/reemplazo para indexar.
4. Recuperación semántica incremental; índices auxiliares separados y eliminables por usuario. Aprobar costos de embeddings/hosting antes de usarlos.
5. Motor de acciones sobre funciones actuales: creación/modificación verificadas, idempotencia, errores parciales y confirmaciones sensibles; no duplicar el calendario.
6. Relaciones académicas y tareas compuestas; después transcripción autorizada y memoria opcional.

Los 15 escenarios del encargo completo **no están todos terminados**: búsqueda semántica real, texto remoto de toda la biblioteca, Drive general, creación/edición automática, planes/resúmenes académicos, transcripciones y memoria persistente siguen pendientes. La prueba de metadatos extensos usa 20.000 registros sintéticos aislados; la prueba funcional de UI también usa fixtures, no los datos personales ni el micrófono del dispositivo. Los conteos del catálogo y sus políticas se verificaron en el backend real con consultas de solo lectura.
