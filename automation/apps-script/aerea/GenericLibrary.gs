/*
 * ============================================================
 * AÉREA — GENERIC LIBRARY
 * Drive -> Supabase
 * ============================================================
 *
 * ESTE ARCHIVO ES INDEPENDIENTE DEL SYNC AO3.
 *
 * Lee únicamente archivos genéricos directos en Drive/downloads:
 *   - EPUB NO-AO3
 *   - PDF
 *   - DOC / DOCX
 *   - TXT / RTF
 *
 * Los EPUB con identidad AO3 se IGNORAN aquí y siguen siendo
 * responsabilidad de aereaDriveSync().
 *
 * Historial:
 *   downloads/_AEREA/generic_versions/
 *
 * Nunca borra archivos.
 * Nunca borra filas.
 * Si un archivo desaparece de Drive, simplemente se ignora.
 */

const AEREA_GENERIC = {
  DOWNLOADS_FOLDER_ID:
    aereaRequiredProperty_("AEREA_DOWNLOADS_FOLDER_ID"),

  AEREA_FOLDER_ID:
    aereaRequiredProperty_("AEREA_FOLDER_ID"),

  BACKUP_FOLDER_NAME:
    "generic_versions",

  STATE_FILE_NAME:
    "AEREA_GENERIC_DRIVE_STATE.json",

  AO3_STATE_FILE_NAME:
    "AEREA_DRIVE_SYNC_STATE.json",

  PREVIEW_URL:
    aereaFunctionUrl_("library-sync-preview"),

  APPLY_URL:
    aereaFunctionUrl_("library-sync-apply"),

  PUBLISH_URL:
    aereaFunctionUrl_("library-content-publish")
};


/*
 * PRIMERA PRUEBA — SOLO LECTURA
 */
function aereaGenericPreview() {
  console.log("====================================");
  console.log(" AEREA GENERIC LIBRARY | PREVIEW");
  console.log("====================================");
  console.log("Modo: SOLO LECTURA");
  console.log("");

  const scan =
    aereaGenericScan_();

  aereaGenericLogScan_(scan);

  const result =
    aereaGenericCall_(
      AEREA_GENERIC.PREVIEW_URL,
      {
        current_items:
          scan.currentItems
      }
    );

  console.log("");
  aereaGenericLogPreview_(result);

  if (
    result.warnings.length === 0 &&
    result.destructive_operations === 0
  ) {
    console.log("");
    console.log("PREVIEW GENÉRICO LIMPIO.");
  }

  return result;
}


/*
 * SYNC REAL
 *
 * Solo ejecutar después de un preview limpio.
 */
function aereaGenericSync() {
  return aereaWithScriptLock_(
    aereaGenericSyncUnlocked_
  );
}


function aereaGenericSyncUnlocked_() {
  console.log("====================================");
  console.log(" AEREA GENERIC LIBRARY | SYNC");
  console.log("====================================");
  console.log("");

  const scan =
    aereaGenericScan_();

  aereaGenericLogScan_(scan);

  const preview =
    aereaGenericCall_(
      AEREA_GENERIC.PREVIEW_URL,
      {
        current_items:
          scan.currentItems
      }
    );

  console.log("");
  aereaGenericLogPreview_(preview);

  if (
    preview.warnings.length > 0 ||
    preview.destructive_operations !== 0
  ) {
    throw new Error(
      "Sync genérico cancelado: preview con advertencias."
    );
  }

  const changes =
    Array.isArray(preview.changes)
      ? preview.changes
      : [];

  if (changes.length === 0) {
    const published =
      aereaGenericPublishPending_(
        scan.publishItems
      );

    aereaGenericMarkPublished_(
      scan.nextState,
      published
    );

    aereaGenericSaveState_(
      scan.nextState
    );

    aereaGenericLogPublish_(
      published
    );

    console.log("");
    console.log(
      "No hay cambios genéricos."
    );
    console.log(
      "Operaciones destructivas: 0"
    );

    return preview;
  }

  const payloadChanges = [];

  changes.forEach(
    function(change) {
      const source =
        scan.byDriveId[
          change.drive_file_id
        ];

      if (!source) {
        throw new Error(
          "No encontré el archivo genérico " +
            change.drive_file_id
        );
      }

      const item =
        Object.assign(
          {},
          change
        );

      if (
        change.action === "new" ||
        change.action === "updated"
      ) {
        const backup =
          aereaGenericEnsureBackup_(
            source,
            change.sha256
          );

        item.snapshot_drive_file_id =
          backup.id;

        item.snapshot_filename =
          backup.name;

        item.snapshot_storage_path =
          "Drive/downloads/_AEREA/" +
          AEREA_GENERIC.BACKUP_FOLDER_NAME +
          "/" +
          backup.name;
      }

      payloadChanges.push(
        item
      );
    }
  );

  console.log("");
  console.log(
    "Aplicando " +
      payloadChanges.length +
      " cambio(s) genérico(s)..."
  );

  const applied =
    aereaGenericCall_(
      AEREA_GENERIC.APPLY_URL,
      {
        changes:
          payloadChanges
      }
    );

  console.log("");
  console.log("--- Resultado ---");

  console.log(
    "Items nuevos: " +
      applied.new_items
  );

  console.log(
    "Items actualizados: " +
      applied.updated_items
  );

  console.log(
    "Cambios de metadata: " +
      applied.metadata_updates
  );

  console.log(
    "Versiones protegidas nuevas: " +
      applied.inserted_versions
  );

  console.log(
    "Operaciones destructivas: " +
      applied.destructive_operations
  );

  if (
    applied.destructive_operations !== 0 ||
    applied.warnings.length !== 0
  ) {
    throw new Error(
      "Resultado genérico inesperado."
    );
  }

  console.log("");
  console.log(
    "Verificando..."
  );

  const verify =
    aereaGenericCall_(
      AEREA_GENERIC.PREVIEW_URL,
      {
        current_items:
          scan.currentItems
      }
    );

  console.log(
    "Nuevos pendientes: " +
      verify.new_items
  );

  console.log(
    "Actualizados pendientes: " +
      verify.updated_items
  );

  console.log(
    "Metadata pendiente: " +
      verify.metadata_updates
  );

  console.log(
    "Warnings: " +
      verify.warnings.length
  );

  if (
    verify.new_items !== 0 ||
    verify.updated_items !== 0 ||
    verify.metadata_updates !== 0 ||
    verify.warnings.length !== 0
  ) {
    throw new Error(
      "El sync genérico escribió, pero aún hay pendientes."
    );
  }

  const published =
    aereaGenericPublishPending_(
      scan.publishItems
    );

  aereaGenericMarkPublished_(
    scan.nextState,
    published
  );

  aereaGenericSaveState_(
    scan.nextState
  );

  aereaGenericLogPublish_(
    published
  );

  console.log("");
  console.log("====================================");
  console.log(" GENERIC LIBRARY SYNC COMPLETADO");
  console.log("====================================");

  return applied;
}


/*
 * NO INSTALAR TODAVÍA.
 * Más adelante podemos hacer que el trigger principal
 * llame tanto a aereaDriveSync() como a aereaGenericSync().
 */
function aereaGenericInstallAutoTrigger() {
  throw new Error(
    "Todavía no: primero probamos un archivo genérico real."
  );
}


/*
 * ESCANEO
 */
function aereaGenericScan_() {
  const inventory =
    aereaListFolderFiles_(
      AEREA_GENERIC
        .DOWNLOADS_FOLDER_ID
    );

  const state =
    aereaGenericReadState_();

  const oldFiles =
    state.files || {};

  /*
   * Reutiliza el cache del sync AO3.
   * Así NO abrimos/descomprimimos cientos de EPUB conocidos.
   */
  const ao3State =
    aereaGenericReadAo3State_();

  const knownAo3DriveIds =
    new Set(
      Object.keys(
        ao3State.files || {}
      )
    );

  const files =
    aereaMetadataIterator_(
      inventory
    );

  const currentItems = [];
  const byDriveId = {};
  const nextFiles = {};

  let supported = 0;
  let skippedAo3 = 0;
  let reused = 0;
  let hashed = 0;

  while (files.hasNext()) {
    const file =
      files.next();

    const name =
      file.getName();

    const id =
      file.getId();

    const size =
      Number(
        file.getSize()
      );

    const modified =
      file
        .getLastUpdated()
        .toISOString();

    const ext =
      aereaGenericExtension_(
        name
      );

    if (
      ![
        "epub",
        "pdf",
        "doc",
        "docx",
        "txt",
        "rtf"
      ].includes(ext)
    ) {
      continue;
    }

    let meta;
    const cached =
      oldFiles[id];

    const unchanged =
      cached &&
      cached.name === name &&
      Number(cached.size) === size &&
      cached.modified_time === modified;

    if (ext === "epub") {
      /*
       * Si el Drive ID ya está en el state AO3,
       * sabemos que es un EPUB AO3 sin abrirlo.
       */
      if (
        knownAo3DriveIds.has(
          id
        )
      ) {
        skippedAo3++;
        continue;
      }

      /*
       * Solo EPUB desconocidos se inspeccionan realmente.
       */
      meta =
        unchanged &&
        cached.metadata
          ? cached.metadata
          : aereaGenericInspectEpub_(
              file
            );

      if (meta.isAo3) {
        skippedAo3++;
        continue;
      }
    } else {
      meta = {
        isAo3:
          false,

        title:
          aereaGenericTitleFromFilename_(
            name
          ),

        author:
          null
      };
    }

    supported++;

    const kind =
      aereaGenericKind_(
        ext
      );

    const mime =
      file.getMimeType() ||
      null;

    let sha = null;

    if (
      unchanged &&
      aereaGenericValidSha_(
        cached.sha256
      )
    ) {
      sha =
        String(
          cached.sha256
        ).toUpperCase();

      reused++;
    } else {
      sha =
        aereaGenericSha256_(
          file
        );

      hashed++;
    }

    const item = {
      drive_file_id:
        id,

      filename:
        name,

      title:
        meta.title ||
        aereaGenericTitleFromFilename_(
          name
        ),

      author:
        meta.author ||
        null,

      kind:
        kind,

      mime_type:
        mime,

      extension:
        ext,

      size_bytes:
        size,

      sha256:
        sha,

      storage_path:
        "Drive/downloads/" +
        name,

      source_modified_at:
        modified
    };

    currentItems.push(
      item
    );

    byDriveId[id] = {
      file:
        file,
      item:
        item
    };

    nextFiles[id] = {
      name:
        name,
      size:
        size,
      modified_time:
        modified,
      sha256:
        sha,
      metadata: {
        isAo3:
          false,
        title:
          item.title,
        author:
          item.author
      },
      published_sha256:
        cached &&
        aereaGenericValidSha_(
          cached.published_sha256
        )
          ? String(
              cached.published_sha256
            ).toUpperCase()
          : null
    };
  }

  currentItems.sort(
    function(a, b) {
      return a.filename
        .localeCompare(
          b.filename
        );
    }
  );

  return {
    currentItems:
      currentItems,

    byDriveId:
      byDriveId,

    publishItems:
      currentItems.filter(
        function(item) {
          return (
            nextFiles[
              item.drive_file_id
            ].published_sha256 !==
            String(
              item.sha256
            ).toUpperCase()
          );
        }
      ),

    nextState: {
      schema_version:
        2,

      files:
        nextFiles
    },

    stats: {
      supported:
        supported,

      skipped_ao3:
        skippedAo3,

      reused:
        reused,

      hashed:
        hashed
    }
  };
}


/*
 * EPUB GENERICO
 *
 * No usa el parser AO3.
 * Solo identifica AO3 y extrae title/creator del OPF.
 */
function aereaGenericInspectEpub_(
  file
) {
  const epubBlob =
    file
      .getBlob()
      .setContentType(
        "application/zip"
      );

  const blobs =
    Utilities.unzip(
      epubBlob
    );

  let opf = null;

  for (
    let i = 0;
    i < blobs.length;
    i++
  ) {
    const name =
      blobs[i]
        .getName();

    if (
      /\.opf$/i.test(name)
    ) {
      opf =
        blobs[i]
          .getDataAsString(
            "UTF-8"
          );

      break;
    }
  }

  if (!opf) {
    return {
      isAo3:
        false,

      title:
        aereaGenericTitleFromFilename_(
          file.getName()
        ),

      author:
        null
    };
  }

  const isAo3 =
    /archiveofourown\.org\/works\/\d+/i
      .test(opf) ||
    /<dc:identifier[^>]*>\s*(?:https?:\/\/)?archiveofourown\.org\/works\/\d+/i
      .test(opf);

  const title =
    aereaGenericXmlValue_(
      opf,
      "title"
    );

  const author =
    aereaGenericXmlValue_(
      opf,
      "creator"
    );

  return {
    isAo3:
      isAo3,

    title:
      title,

    author:
      author
  };
}


function aereaGenericXmlValue_(
  xml,
  localName
) {
  const re =
    new RegExp(
      "<(?:[A-Za-z0-9_-]+:)?" +
        localName +
        "\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?" +
        localName +
        ">",
      "i"
    );

  const m =
    String(xml)
      .match(re);

  if (!m) {
    return null;
  }

  return aereaGenericDecodeXml_(
    String(m[1])
      .replace(
        /<[^>]+>/g,
        ""
      )
      .trim()
  );
}


function aereaGenericDecodeXml_(
  text
) {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}


/*
 * BACKUP
 */
function aereaGenericEnsureBackup_(
  source,
  sha
) {
  const folder =
    aereaGenericBackupFolder_();

  const item =
    source.item;

  const normalizedSha =
    String(sha)
      .toUpperCase();

  const extension =
    item.extension
      ? "." +
        item.extension
      : "";

  /*
   * El historial se identifica por CONTENIDO (SHA),
   * no por el Drive ID del archivo de origen.
   *
   * También reconoce backups de v1.0-v1.2, cuyos nombres
   * incluían el Drive ID, y los reutiliza.
   */
  const allFiles =
    folder.getFiles();

  while (
    allFiles.hasNext()
  ) {
    const existing =
      allFiles.next();

    const existingName =
      existing.getName();

    if (
      existingName
        .toUpperCase()
        .includes(
          normalizedSha
        )
    ) {
      return {
        id:
          existing.getId(),

        name:
          existingName,

        created:
          false
      };
    }
  }

  /*
   * Desde v1.3 los backups nuevos usan un nombre estable
   * por SHA. Si el mismo contenido vuelve a aparecer con
   * otro Drive ID, reutilizamos esta misma copia.
   */
  const name =
    "GENERIC_" +
    normalizedSha +
    extension;

  const copy =
    folder.createFile(
      source.file
        .getBlob()
        .setName(name)
    );

  console.log(
    "Backup genérico nuevo: " +
      name
  );

  return {
    id:
      copy.getId(),

    name:
      copy.getName(),

    created:
      true
  };
}

function aereaGenericBackupFolder_() {
  const root =
    DriveApp.getFolderById(
      AEREA_GENERIC
        .AEREA_FOLDER_ID
    );

  const folders =
    root.getFoldersByName(
      AEREA_GENERIC
        .BACKUP_FOLDER_NAME
    );

  if (folders.hasNext()) {
    return folders.next();
  }

  return root.createFolder(
    AEREA_GENERIC
      .BACKUP_FOLDER_NAME
  );
}


/*
 * CACHE
 */
function aereaGenericReadAo3State_() {
  const text =
    aereaGenericReadTextFile_(
      AEREA_GENERIC
        .AO3_STATE_FILE_NAME
    );

  if (!text) {
    return {
      schema_version:
        1,
      files:
        {}
    };
  }

  try {
    return JSON.parse(
      text.replace(
        /^\uFEFF/,
        ""
      )
    );
  } catch (error) {
    console.log(
      "Aviso: no pude leer el cache AO3; usaré inspección normal."
    );

    return {
      schema_version:
        1,
      files:
        {}
    };
  }
}


function aereaGenericReadState_() {
  const text =
    aereaGenericReadTextFile_(
      AEREA_GENERIC
        .STATE_FILE_NAME
    );

  if (!text) {
    return {
      schema_version:
        1,
      files:
        {}
    };
  }

  return JSON.parse(
    text.replace(
      /^\uFEFF/,
      ""
    )
  );
}


function aereaGenericSaveState_(
  state
) {
  const current =
    aereaGenericReadState_();

  if (
    aereaSameFileState_(
      current,
      state
    )
  ) {
    console.log(
      "Cache genérico sin cambios; no se reescribe."
    );
    return false;
  }

  const root =
    DriveApp.getFolderById(
      AEREA_GENERIC
        .AEREA_FOLDER_ID
    );

  const text =
    JSON.stringify(
      state,
      null,
      2
    );

  const files =
    root.getFilesByName(
      AEREA_GENERIC
        .STATE_FILE_NAME
    );

  if (files.hasNext()) {
    files
      .next()
      .setContent(
        text
      );

    return true;
  }

  root.createFile(
    AEREA_GENERIC
      .STATE_FILE_NAME,
    text,
    MimeType.PLAIN_TEXT
  );

  return true;
}


function aereaGenericReadTextFile_(
  name
) {
  const root =
    DriveApp.getFolderById(
      AEREA_GENERIC
        .AEREA_FOLDER_ID
    );

  const files =
    root.getFilesByName(
      name
    );

  if (!files.hasNext()) {
    return null;
  }

  return files
    .next()
    .getBlob()
    .getDataAsString(
      "UTF-8"
    );
}


/*
 * PRIVATE CONTENT PUBLISHER
 *
 * Publishes only new or changed content. fetchAll sends independent items in
 * parallel, and failed items remain pending for the next scheduled run.
 */
function aereaGenericPublishPending_(
  items
) {
  const token =
    ScriptApp.getOAuthToken();

  const requests = [];
  const validItems = [];
  const warnings = [];

  (
    Array.isArray(items)
      ? items
      : []
  ).forEach(function(item) {
    if (
      !item ||
      !item.drive_file_id ||
      !aereaGenericValidSha_(
        item.sha256
      )
    ) {
      warnings.push({
        drive_file_id:
          item &&
          item.drive_file_id
            ? item.drive_file_id
            : null,
        warning: {
          error:
            "INVALID_PUBLISH_ITEM"
        }
      });
      return;
    }

    validItems.push(item);
    requests.push({
      url:
        AEREA_GENERIC
          .PUBLISH_URL,
      method:
        "post",
      contentType:
        "application/json",
      headers: {
        Authorization:
          "Bearer " +
          token
      },
      payload:
        JSON.stringify({
          drive_file_id:
            item.drive_file_id,
          sha256:
            String(
              item.sha256
            ).toUpperCase(),
          metadata: {
            filename:
              item.filename,
            title:
              item.title,
            author:
              item.author,
            kind:
              item.kind,
            mime_type:
              item.mime_type,
            extension:
              item.extension,
            size_bytes:
              item.size_bytes,
            source_modified_at:
              item.source_modified_at
          }
        }),
      muteHttpExceptions:
        true
    });
  });

  if (requests.length === 0) {
    return {
      published_items:
        0,
      published_drive_file_ids:
        [],
      warnings:
        warnings,
      destructive_operations:
        0
    };
  }

  const responses =
    UrlFetchApp.fetchAll(
      requests
    );

  const publishedIds = [];

  responses.forEach(
    function(response, index) {
      const item =
        validItems[index];
      const status =
        response
          .getResponseCode();
      const text =
        response
          .getContentText();

      let body = {};
      try {
        body =
          text
            ? JSON.parse(text)
            : {};
      } catch (error) {
        body = {
          error:
            "INVALID_PUBLISH_RESPONSE"
        };
      }

      if (
        status >= 200 &&
        status < 300
      ) {
        publishedIds.push(
          item.drive_file_id
        );
        return;
      }

      warnings.push({
        drive_file_id:
          item.drive_file_id,
        status:
          status,
        warning:
          body
      });
    }
  );

  return {
    published_items:
      publishedIds.length,
    published_drive_file_ids:
      publishedIds,
    warnings:
      warnings,
    destructive_operations:
      0
  };
}


function aereaGenericMarkPublished_(
  state,
  result
) {
  const published =
    new Set(
      result
        .published_drive_file_ids ||
      []
    );

  published.forEach(
    function(driveId) {
      const file =
        state.files[
          driveId
        ];
      if (file) {
        file.published_sha256 =
          String(
            file.sha256
          ).toUpperCase();
      }
    }
  );
}


/*
 * Kept temporarily for safe rollback while the optimized publisher is
 * validated against the live Apps Script project.
 */
function aereaGenericPublishCurrent_(
  items
) {
  const token =
    ScriptApp.getOAuthToken();

  const results = [];

  (
    Array.isArray(items)
      ? items
      : []
  ).forEach(
    function(item) {
      if (
        !item ||
        !item.drive_file_id ||
        !aereaGenericValidSha_(
          item.sha256
        )
      ) {
        results.push({
          ok:
            false,
          drive_file_id:
            item &&
            item.drive_file_id
              ? item.drive_file_id
              : null,
          warning: {
            error:
              "INVALID_PUBLISH_ITEM"
          }
        });

        return;
      }

      try {
        const response =
          UrlFetchApp.fetch(
            AEREA_GENERIC
              .PUBLISH_URL,
            {
              method:
                "post",

              contentType:
                "application/json",

              headers: {
                Authorization:
                  "Bearer " +
                  token
              },

              payload:
                JSON.stringify({
                  drive_file_id:
                    item.drive_file_id,

                  sha256:
                    String(
                      item.sha256
                    ).toUpperCase(),

                  metadata: {
                    filename:
                      item.filename,
                    title:
                      item.title,
                    author:
                      item.author,
                    kind:
                      item.kind,
                    mime_type:
                      item.mime_type,
                    extension:
                      item.extension,
                    size_bytes:
                      item.size_bytes,
                    source_modified_at:
                      item.source_modified_at
                  }
                }),

              muteHttpExceptions:
                true
            }
          );

        const status =
          response
            .getResponseCode();

        const text =
          response
            .getContentText();

        let body = {};

        try {
          body =
            text
              ? JSON.parse(text)
              : {};
        } catch (error) {
          body = {
            error:
              "INVALID_PUBLISH_RESPONSE"
          };
        }

        if (
          status >= 200 &&
          status < 300
        ) {
          results.push({
            ok:
              true,
            drive_file_id:
              item.drive_file_id,
            result:
              body
          });

          return;
        }

        results.push({
          ok:
            false,
          drive_file_id:
            item.drive_file_id,
          status:
            status,
          warning:
            body
        });
      } catch (error) {
        results.push({
          ok:
            false,
          drive_file_id:
            item.drive_file_id,
          warning: {
            error:
              "PUBLISH_REQUEST_FAILED",
            message:
              error &&
              error.message
                ? error.message
                : String(error)
          }
        });
      }
    }
  );

  return {
    published_items:
      results.filter(
        function(result) {
          return result.ok;
        }
      ).length,

    warnings:
      results.filter(
        function(result) {
          return !result.ok;
        }
      ),

    destructive_operations:
      0
  };
}


function aereaGenericLogPublish_(
  result
) {
  console.log("");
  console.log(
    "--- Publicación privada genérica ---"
  );

  console.log(
    "Contenido listo: " +
      result.published_items
  );

  console.log(
    "Warnings: " +
      result.warnings.length
  );

  console.log(
    "Operaciones destructivas: " +
      result.destructive_operations
  );

  if (
    result.warnings.length
  ) {
    console.log(
      JSON.stringify(
        result.warnings,
        null,
        2
      )
    );
  }
}


/*
 * HTTP
 */
function aereaGenericCall_(
  url,
  payload
) {
  const response =
    UrlFetchApp.fetch(
      url,
      {
        method:
          "post",

        contentType:
          "application/json",

        headers: {
          Authorization:
            "Bearer " +
            ScriptApp
              .getOAuthToken()
        },

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true
      }
    );

  const status =
    response
      .getResponseCode();

  const text =
    response
      .getContentText();

  let body;

  try {
    body =
      JSON.parse(text);
  } catch (error) {
    throw new Error(
      "Respuesta inválida HTTP " +
        status +
        ": " +
        text
    );
  }

  if (
    status < 200 ||
    status >= 300
  ) {
    throw new Error(
      "HTTP " +
        status +
        ": " +
        JSON.stringify(
          body
        )
    );
  }

  return body;
}


/*
 * HELPERS
 */
function aereaGenericSha256_(
  file
) {
  const digest =
    Utilities.computeDigest(
      Utilities
        .DigestAlgorithm
        .SHA_256,

      file
        .getBlob()
        .getBytes()
    );

  return digest
    .map(
      function(byte) {
        const value =
          byte < 0
            ? byte + 256
            : byte;

        return value
          .toString(16)
          .padStart(2, "0");
      }
    )
    .join("")
    .toUpperCase();
}


function aereaGenericValidSha_(
  value
) {
  return (
    typeof value === "string" &&
    /^[A-Fa-f0-9]{64}$/
      .test(value)
  );
}


function aereaGenericExtension_(
  name
) {
  const m =
    String(name)
      .toLowerCase()
      .match(
        /\.([a-z0-9]+)$/
      );

  return m
    ? m[1]
    : "";
}


function aereaGenericKind_(
  ext
) {
  if (ext === "pdf") {
    return "pdf";
  }

  if (ext === "epub") {
    return "epub";
  }

  if (
    [
      "doc",
      "docx",
      "txt",
      "rtf"
    ].includes(ext)
  ) {
    return "document";
  }

  return "file";
}


function aereaGenericTitleFromFilename_(
  name
) {
  return String(name)
    .replace(
      /\.[^.]+$/,
      ""
    )
    .replace(
      /[_]+/g,
      " "
    )
    .trim();
}


/*
 * LOGS
 */
function aereaGenericLogScan_(
  scan
) {
  console.log("--- Drive genérico ---");

  console.log(
    "Archivos genéricos reconocidos: " +
      scan.stats.supported
  );

  console.log(
    "EPUB AO3 omitidos: " +
      scan.stats.skipped_ao3
  );

  console.log(
    "Cache reutilizado: " +
      scan.stats.reused
  );

  console.log(
    "SHA calculados ahora: " +
      scan.stats.hashed
  );
}


function aereaGenericLogPreview_(
  result
) {
  console.log("--- Supabase generic preview ---");

  console.log(
    "Items genéricos en Supabase: " +
      result.database_items
  );

  console.log(
    "Sin cambios: " +
      result.unchanged_items
  );

  console.log(
    "Nuevos: " +
      result.new_items
  );

  console.log(
    "Actualizados: " +
      result.updated_items
  );

  console.log(
    "Cambios de metadata: " +
      result.metadata_updates
  );

  console.log(
    "Ausentes de Drive ignorados: " +
      result.missing_from_drive_ignored
  );

  console.log(
    "Warnings: " +
      result.warnings.length
  );

  console.log(
    "Operaciones destructivas: " +
      result.destructive_operations
  );

  if (
    result.warnings.length
  ) {
    console.log(
      JSON.stringify(
        result.warnings,
        null,
        2
      )
    );
  }
}
