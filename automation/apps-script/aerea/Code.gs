/*
 * ============================================================
 * AÉREA AO3 — DRIVE -> SUPABASE SYNC
 * CLEAN v1
 * ============================================================
 *
 * FUENTE ACTUAL:
 *   Drive/downloads/*.epub
 *
 * BACKUP INVISIBLE:
 *   Drive/downloads/_AEREA/versions/WORKID_SHA256.epub
 *
 * DESTINO:
 *   Supabase -> biblioteca de aérea
 *
 * REGLAS:
 * - Los EPUB normales mandan.
 * - _AEREA NO decide qué aparece en la app.
 * - _AEREA solo conserva versiones históricas.
 * - Nunca se borra nada de Drive ni de Supabase.
 * - Un archivo no-AO3 se ignora de forma segura por ahora.
 * - El primer arranque reutiliza el índice viejo de _AEREA
 *   para no volver a leer/hashar cientos de EPUB.
 */

const AEREA_DRIVE = {
  DOWNLOADS_FOLDER_ID:
    aereaRequiredProperty_("AEREA_DOWNLOADS_FOLDER_ID"),

  AEREA_FOLDER_ID:
    aereaRequiredProperty_("AEREA_FOLDER_ID"),

  VERSIONS_FOLDER_ID:
    aereaRequiredProperty_("AEREA_VERSIONS_FOLDER_ID"),

  LEGACY_INDEX_NAME:
    "AEREA_AO3_INDEX.json",

  STATE_FILE_NAME:
    "AEREA_DRIVE_SYNC_STATE.json",

  PREVIEW_URL:
    aereaFunctionUrl_("ao3-sync-preview"),

  APPLY_URL:
    aereaFunctionUrl_("ao3-sync-apply")
};


/*
 * ============================================================
 * PRIMERA PRUEBA — SOLO LECTURA
 * ============================================================
 *
 * No crea backups.
 * No escribe Supabase.
 * No crea/actualiza el state.
 */
function aereaDrivePreview() {
  console.log("====================================");
  console.log(" AEREA DRIVE -> SUPABASE | PREVIEW");
  console.log("====================================");
  console.log("Modo: SOLO LECTURA");
  console.log("");

  const scan =
    scanDriveLibrary_();

  logLocalScan_(scan);

  const result =
    callPreview_(scan.currentItems);

  console.log("");
  logServerPreview_(result);

  if (
    result.warnings.length === 0 &&
    result.destructive_operations === 0
  ) {
    console.log("");
    console.log("PREVIEW LIMPIO.");
  }

  return result;
}


/*
 * ============================================================
 * SYNC REAL
 * ============================================================
 *
 * 1. Escanea EPUB normales.
 * 2. Pregunta a Supabase qué cambió.
 * 3. Para new/updated:
 *    - crea backup invisible si SHA nuevo
 *    - lee metadata del EPUB actual
 * 4. Aplica a Supabase.
 * 5. Guarda cache de Drive.
 * 6. Verifica que ya no queden cambios.
 */
function aereaDriveSync() {
  return aereaWithScriptLock_(
    aereaDriveSyncUnlocked_
  );
}


function aereaDriveSyncUnlocked_() {
  console.log("====================================");
  console.log(" AEREA DRIVE -> SUPABASE | SYNC");
  console.log("====================================");
  console.log("");

  const scan =
    scanDriveLibrary_();

  logLocalScan_(scan);

  const preview =
    callPreview_(scan.currentItems);

  console.log("");
  logServerPreview_(preview);

  if (
    preview.warnings.length > 0 ||
    preview.destructive_operations !== 0
  ) {
    throw new Error(
      "Sync cancelado: el preview contiene advertencias."
    );
  }

  const changes =
    Array.isArray(preview.changes)
      ? preview.changes
      : [];

  if (changes.length === 0) {
    saveDriveState_(scan.nextState);

    console.log("");
    console.log(
      "No hay cambios de biblioteca."
    );
    console.log(
      "Cache de Drive actualizado."
    );
    console.log(
      "Operaciones destructivas: 0"
    );

    return preview;
  }

  console.log("");
  console.log(
    "Preparando " +
      changes.length +
      " cambio(s)..."
  );

  const payloadChanges = [];

  changes.forEach(function(change) {
    const fileInfo =
      scan.byDriveId[
        change.current_drive_file_id
      ];

    if (!fileInfo) {
      throw new Error(
        "No encontré el archivo Drive elegido para Work ID " +
          change.work_id
      );
    }

    const base = {
      action:
        change.action,

      work_id:
        change.work_id,

      previous_sha256:
        change.previous_sha256,

      sha256:
        change.sha256,

      current_drive_file_id:
        change.current_drive_file_id,

      current_filename:
        change.current_filename
    };

    if (change.action === "relinked") {
      payloadChanges.push(base);
      return;
    }

    const metadata =
      fileInfo.metadata ||
      readAo3MetadataFromEpub_(
        fileInfo.id
      );

    if (
      Number(metadata.work_id) !==
      Number(change.work_id)
    ) {
      throw new Error(
        "Work ID interno no coincide en " +
          fileInfo.name
      );
    }

    console.log(
      "Protegiendo versión: " +
        change.work_id +
        " · " +
        fileInfo.name
    );

    const backup =
      ensureBackupVersion_(
        fileInfo,
        change.sha256
      );

    payloadChanges.push(
      Object.assign(
        {},
        base,
        {
          snapshot_drive_file_id:
            backup.id,

          snapshot_filename:
            backup.name,

          size_bytes:
            fileInfo.size,

          captured_at:
            new Date().toISOString(),

          source_path:
            "Drive/downloads/" +
            fileInfo.name,

          metadata:
            metadata
        }
      )
    );
  });

  console.log("");
  console.log(
    "Aplicando lote en Supabase..."
  );

  const applied =
    callApply_(
      payloadChanges
    );

  console.log("");
  console.log("====================================");
  console.log(" RESULTADO");
  console.log("====================================");

  console.log(
    "Obras nuevas: " +
      applied.new_works
  );

  console.log(
    "Obras actualizadas: " +
      applied.updated_works
  );

  console.log(
    "Relinks: " +
      applied.relinked_works
  );

  console.log(
    "Snapshots nuevos: " +
      applied.inserted_snapshots
  );

  console.log(
    "ao3_works tocados: " +
      applied.touched_ao3_works
  );

  console.log(
    "ao3_epub_versions tocados: " +
      applied.touched_ao3_epub_versions
  );

  console.log(
    "Snapshots tocados: " +
      applied.touched_snapshots
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
      "Resultado inesperado después del apply."
    );
  }

  /*
   * Guardamos el cache SOLO después de que
   * Supabase confirmó la transacción.
   */
  saveDriveState_(scan.nextState);

  console.log("");
  console.log(
    "Verificando resultado..."
  );

  const verify =
    callPreview_(
      scan.currentItems
    );

  console.log(
    "Pendientes nuevas: " +
      verify.new_works
  );

  console.log(
    "Pendientes actualizadas: " +
      verify.updated_works
  );

  console.log(
    "Pendientes relink: " +
      verify.relinked_same_content
  );

  console.log(
    "Warnings: " +
      verify.warnings.length
  );

  if (
    verify.new_works !== 0 ||
    verify.updated_works !== 0 ||
    verify.relinked_same_content !== 0 ||
    verify.warnings.length !== 0
  ) {
    throw new Error(
      "El sync escribió, pero la verificación todavía detecta pendientes."
    );
  }

  console.log("");
  console.log("====================================");
  console.log(" AEREA DRIVE SYNC COMPLETADO");
  console.log("====================================");

  return applied;
}


/*
 * ============================================================
 * AUTOMATIZACIÓN
 * ============================================================
 *
 * Ejecutar SOLO después de que preview + sync manual
 * hayan pasado las pruebas.
 */
function aereaInstallAutoTrigger() {
  aereaRemoveAutoTrigger();

  ScriptApp
    .newTrigger(
      "aereaDriveSync"
    )
    .timeBased()
    .everyMinutes(10)
    .create();

  console.log(
    "Trigger instalado: cada 10 minutos."
  );
}


function aereaRemoveAutoTrigger() {
  const triggers =
    ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    if (
      trigger.getHandlerFunction() ===
      "aereaDriveSync"
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  console.log(
    "Triggers de aereaDriveSync eliminados."
  );
}


/*
 * ============================================================
 * ESCANEO DRIVE
 * ============================================================
 */
function scanDriveLibrary_() {
  const oldState =
    readDriveState_();

  const oldFiles =
    oldState.files || {};

  const bootstrap =
    Object.keys(oldFiles).length === 0;

  const legacy =
    bootstrap
      ? readLegacyIndex_()
      : {};

  const legacyByName = {};

  if (
    legacy &&
    Array.isArray(legacy.epubs)
  ) {
    legacy.epubs.forEach(
      function(row) {
        if (row && row.filename) {
          legacyByName[
            row.filename
          ] = row;
        }
      }
    );
  }

  const direct =
    aereaListFolderFiles_(
      AEREA_DRIVE
        .DOWNLOADS_FOLDER_ID
    ).filter(function(file) {
      return /\.epub$/i.test(file.name);
    });

  direct.sort(
    function(a, b) {
      return a.name.localeCompare(b.name);
    }
  );

  const currentItems = [];
  const byDriveId = {};
  const nextFiles = {};

  let reusedState = 0;
  let reusedLegacy = 0;
  let hashedNow = 0;
  let ignoredNonAo3 = 0;

  direct.forEach(function(fileMeta) {
    const id =
      fileMeta.id;

    const name =
      fileMeta.name;

    const size =
      Number(fileMeta.size);

    const modified =
      fileMeta.modified_time;

    let workId = null;
    let sha = null;
    let metadata = null;

    const cached =
      oldFiles[id];

    if (
      cached &&
      cached.name === name &&
      Number(cached.size) === size &&
      cached.modified_time === modified &&
      validWorkId_(cached.work_id) &&
      validSha_(cached.sha256)
    ) {
      workId =
        Number(cached.work_id);

      sha =
        String(cached.sha256)
          .toUpperCase();

      reusedState++;
    }

    /*
     * Solo durante bootstrap.
     * Nombre + tamaño deben coincidir.
     * Así reutilizamos los hashes ya comprobados
     * de los 474 EPUB actuales.
     */
    if (
      workId === null &&
      bootstrap
    ) {
      const old =
        legacyByName[name];

      if (
        old &&
        Number(old.size_bytes) === size &&
        validWorkId_(old.work_id) &&
        validSha_(old.sha256)
      ) {
        workId =
          Number(old.work_id);

        sha =
          String(old.sha256)
            .toUpperCase();

        reusedLegacy++;
      }
    }

    /*
     * Archivo nuevo o modificado:
     * acá sí leemos y hasheamos SOLO este EPUB.
     */
    if (workId === null) {
      try {
        const file =
          DriveApp.getFileById(id);

        metadata =
          readAo3MetadataFromEpub_(
            id
          );

        workId =
          Number(
            metadata.work_id
          );

        sha =
          sha256DriveFile_(
            file
          );

        hashedNow++;
      } catch (error) {
        /*
         * EPUB genérico/no-AO3:
         * por ahora no entra en ao3_works.
         */
        console.log(
          "IGNORADO (no AO3): " +
            name +
            " · " +
            error.message
        );

        ignoredNonAo3++;
        return;
      }
    }

    if (
      !validWorkId_(workId) ||
      !validSha_(sha)
    ) {
      throw new Error(
        "Identidad inválida para " +
          name
      );
    }

    const info = {
      id:
        id,

      name:
        name,

      size:
        size,

      modified_time:
        modified,

      work_id:
        workId,

      sha256:
        sha,

      metadata:
        metadata
    };

    byDriveId[id] = info;

    currentItems.push({
      work_id:
        workId,

      sha256:
        sha,

      current_drive_file_id:
        id,

      current_filename:
        name
    });

    nextFiles[id] = {
      name:
        name,

      size:
        size,

      modified_time:
        modified,

      work_id:
        workId,

      sha256:
        sha
    };
  });

  return {
    currentItems:
      currentItems,

    byDriveId:
      byDriveId,

    nextState: {
      schema_version:
        1,

      files:
        nextFiles
    },

    stats: {
      direct_epubs:
        direct.length,

      ao3_epubs:
        currentItems.length,

      reused_state:
        reusedState,

      reused_legacy:
        reusedLegacy,

      hashed_now:
        hashedNow,

      ignored_non_ao3:
        ignoredNonAo3
    }
  };
}


/*
 * ============================================================
 * BACKUP INVISIBLE _AEREA
 * ============================================================
 */
function ensureBackupVersion_(
  fileInfo,
  sha
) {
  const versions =
    DriveApp.getFolderById(
      AEREA_DRIVE
        .VERSIONS_FOLDER_ID
    );

  const name =
    String(fileInfo.work_id) +
    "_" +
    String(sha)
      .toUpperCase() +
    ".epub";

  const existing =
    versions.getFilesByName(
      name
    );

  if (existing.hasNext()) {
    const file =
      existing.next();

    return {
      id:
        file.getId(),

      name:
        file.getName(),

      created:
        false
    };
  }

  /*
   * ÚNICA escritura de archivo de biblioteca
   * que hace el script en Drive:
   * crear una copia histórica nueva.
   *
   * Nunca reemplaza ni elimina una vieja.
   */
  const source =
    DriveApp.getFileById(
      fileInfo.id
    );

  const blob =
    source
      .getBlob()
      .setName(
        name
      );

  const backup =
    versions.createFile(
      blob
    );

  console.log(
    "Backup nuevo: " +
      name
  );

  return {
    id:
      backup.getId(),

    name:
      backup.getName(),

    created:
      true
  };
}


/*
 * ============================================================
 * SUPABASE EDGE FUNCTIONS
 * ============================================================
 */
function callPreview_(
  currentItems
) {
  return callJson_(
    AEREA_DRIVE.PREVIEW_URL,
    {
      current_items:
        currentItems
    }
  );
}


function callApply_(
  changes
) {
  return callJson_(
    AEREA_DRIVE.APPLY_URL,
    {
      changes:
        changes
    }
  );
}


function callJson_(
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
 * ============================================================
 * CACHE / BOOTSTRAP
 * ============================================================
 */
function readDriveState_() {
  const text =
    readOptionalTextFile_(
      AEREA_DRIVE
        .AEREA_FOLDER_ID,

      AEREA_DRIVE
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

  const parsed =
    JSON.parse(
      text
        .replace(
          /^\uFEFF/,
          ""
        )
    );

  if (
    !parsed ||
    typeof parsed !== "object"
  ) {
    throw new Error(
      "State de Drive inválido."
    );
  }

  return parsed;
}


function saveDriveState_(
  state
) {
  const current =
    readDriveState_();

  if (
    aereaSameFileState_(
      current,
      state
    )
  ) {
    console.log(
      "Cache AO3 sin cambios; no se reescribe."
    );
    return false;
  }

  writeTextFile_(
    AEREA_DRIVE
      .AEREA_FOLDER_ID,

    AEREA_DRIVE
      .STATE_FILE_NAME,

    JSON.stringify(
      state,
      null,
      2
    )
  );

  return true;
}


function readLegacyIndex_() {
  const text =
    readOptionalTextFile_(
      AEREA_DRIVE
        .AEREA_FOLDER_ID,

      AEREA_DRIVE
        .LEGACY_INDEX_NAME
    );

  if (!text) {
    return {
      epubs:
        []
    };
  }

  return JSON.parse(
    text
      .replace(
        /^\uFEFF/,
        ""
      )
  );
}


function readOptionalTextFile_(
  folderId,
  name
) {
  const folder =
    DriveApp.getFolderById(
      folderId
    );

  const files =
    folder.getFilesByName(
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


function writeTextFile_(
  folderId,
  name,
  text
) {
  const folder =
    DriveApp.getFolderById(
      folderId
    );

  const files =
    folder.getFilesByName(
      name
    );

  if (files.hasNext()) {
    const file =
      files.next();

    file.setContent(
      text
    );

    return file;
  }

  return folder.createFile(
    name,
    text,
    MimeType.PLAIN_TEXT
  );
}


/*
 * ============================================================
 * HASH
 * ============================================================
 */
function sha256DriveFile_(
  file
) {
  const bytes =
    file
      .getBlob()
      .getBytes();

  const digest =
    Utilities.computeDigest(
      Utilities
        .DigestAlgorithm
        .SHA_256,

      bytes
    );

  return digest
    .map(function(byte) {
      const value =
        byte < 0
          ? byte + 256
          : byte;

      return value
        .toString(16)
        .padStart(2, "0");
    })
    .join("")
    .toUpperCase();
}


function validSha_(
  value
) {
  return (
    typeof value === "string" &&
    /^[A-Fa-f0-9]{64}$/
      .test(value)
  );
}


function validWorkId_(
  value
) {
  const number =
    Number(value);

  return (
    Number.isInteger(number) &&
    number > 0
  );
}


/*
 * ============================================================
 * LOGS
 * ============================================================
 */
function logLocalScan_(
  scan
) {
  console.log("--- Drive ---");

  console.log(
    "EPUB directos: " +
      scan.stats.direct_epubs
  );

  console.log(
    "EPUB AO3 reconocidos: " +
      scan.stats.ao3_epubs
  );

  console.log(
    "Cache nuevo reutilizado: " +
      scan.stats.reused_state
  );

  console.log(
    "Índice viejo reutilizado: " +
      scan.stats.reused_legacy
  );

  console.log(
    "SHA calculados ahora: " +
      scan.stats.hashed_now
  );

  console.log(
    "EPUB no-AO3 ignorados: " +
      scan.stats.ignored_non_ao3
  );
}


function logServerPreview_(
  result
) {
  console.log("--- Supabase preview ---");

  console.log(
    "Obras en Supabase: " +
      result.database_works
  );

  console.log(
    "Obras canónicas actuales: " +
      result.canonical_current_works
  );

  console.log(
    "Sin cambios: " +
      result.unchanged_works
  );

  console.log(
    "Actualizadas: " +
      result.updated_works
  );

  console.log(
    "Nuevas: " +
      result.new_works
  );

  console.log(
    "Relinks: " +
      result.relinked_same_content
  );

  console.log(
    "Alternativas ignoradas: " +
      result.alternative_items_ignored
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
    result.new_work_ids &&
    result.new_work_ids.length
  ) {
    console.log(
      "Work IDs nuevos: " +
        result.new_work_ids
          .join(", ")
    );
  }

  if (
    result.updated_work_ids &&
    result.updated_work_ids.length
  ) {
    console.log(
      "Work IDs actualizados: " +
        result.updated_work_ids
          .join(", ")
    );
  }

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



/* ============================================================
 * PARSER EPUB AO3 — ya probado anteriormente
 * ============================================================ */

function readAo3MetadataFromEpub_(fileId) {
  const file =
    DriveApp.getFileById(fileId);

  /*
   * Los EPUB de AO3 llegan desde Drive como
   * application/epub+zip.
   *
   * Utilities.unzip() exige application/zip,
   * así que cambiamos SOLO el Content-Type
   * del blob temporal en memoria.
   *
   * El archivo original de Drive NO se modifica.
   */
  const zipBlob =
    file
      .getBlob()
      .setContentType(
        "application/zip"
      );

  const blobs =
    Utilities.unzip(
      zipBlob
    );

  const byName = {};

  blobs.forEach(function(blob) {
    const name =
      normalizeZipPath_(
        blob.getName()
      );

    byName[name] = blob;
  });

  const opfPath =
    findOpfPath_(byName);

  if (!opfPath) {
    throw new Error(
      "El EPUB no contiene content.opf."
    );
  }

  const opfText =
    getBlobText_(byName[opfPath]);

  const opfMetadata =
    parseOpfMetadata_(opfText);

  const preface =
    findAo3Preface_(byName);

  if (!preface) {
    throw new Error(
      "No encontré el Preface de AO3 dentro del EPUB."
    );
  }

  const prefaceText =
    getBlobText_(preface.blob);

  const sourceUrlMatch =
    prefaceText.match(
      /https:\/\/archiveofourown\.org\/works\/(\d+)/
    );

  if (!sourceUrlMatch) {
    throw new Error(
      "No pude encontrar el Work ID de AO3."
    );
  }

  const workId =
    Number(sourceUrlMatch[1]);

  const sourceUrl =
    "https://archiveofourown.org/works/" +
    workId;

  const rating =
    extractTagSectionFirst_(
      prefaceText,
      "Rating"
    );

  const warnings =
    extractTagSection_(
      prefaceText,
      "Archive Warning"
    );

  const categories =
    extractTagSection_(
      prefaceText,
      "Category"
    );

  const fandoms =
    extractTagSection_(
      prefaceText,
      "Fandom"
    );

  const relationships =
    extractTagSection_(
      prefaceText,
      "Relationship"
    );

  const characters =
    extractTagSection_(
      prefaceText,
      "Characters"
    );

  const tags =
    extractTagSection_(
      prefaceText,
      "Additional Tags"
    );

  const series =
    extractSeries_(
      prefaceText
    );

  const stats =
    extractStats_(
      prefaceText
    );

  const chapters =
    stats.chapters || "";

  const complete =
    isCompleteFromChapters_(
      chapters
    );

  const updatedOn =
    stats.updated ||
    stats.published ||
    opfMetadata.date ||
    null;

  return {
    work_id: workId,

    title:
      opfMetadata.title || "",

    author:
      opfMetadata.author || "",

    summary:
      htmlToPlainText_(
        opfMetadata.description || ""
      ),

    fandoms: fandoms,
    warnings: warnings,
    characters: characters,
    relationships: relationships,
    tags: tags,
    categories: categories,

    words:
      stats.words,

    rating:
      rating,

    chapters:
      chapters,

    complete:
      complete,

    series:
      series,

    updated_on:
      updatedOn,

    source_url:
      sourceUrl
  };
}


function findOpfPath_(byName) {
  if (byName["content.opf"]) {
    return "content.opf";
  }

  const container =
    byName["META-INF/container.xml"];

  if (container) {
    const text =
      getBlobText_(container);

    const match =
      text.match(
        /full-path\s*=\s*["']([^"']+\.opf)["']/i
      );

    if (match) {
      const path =
        normalizeZipPath_(
          match[1]
        );

      if (byName[path]) {
        return path;
      }
    }
  }

  const names =
    Object.keys(byName);

  for (let i = 0; i < names.length; i++) {
    if (/\.opf$/i.test(names[i])) {
      return names[i];
    }
  }

  return null;
}


function parseOpfMetadata_(opfText) {
  const doc =
    XmlService.parse(opfText);

  const root =
    doc.getRootElement();

  const opfNs =
    root.getNamespace();

  const metadata =
    root.getChild(
      "metadata",
      opfNs
    );

  if (!metadata) {
    throw new Error(
      "content.opf no contiene metadata."
    );
  }

  const dcNs =
    XmlService.getNamespace(
      "dc",
      "http://purl.org/dc/elements/1.1/"
    );

  const titleEl =
    metadata.getChild(
      "title",
      dcNs
    );

  const creatorEl =
    metadata.getChild(
      "creator",
      dcNs
    );

  const descriptionEl =
    metadata.getChild(
      "description",
      dcNs
    );

  const dateEl =
    metadata.getChild(
      "date",
      dcNs
    );

  return {
    title:
      titleEl
        ? titleEl.getText()
        : "",

    author:
      creatorEl
        ? creatorEl.getText()
        : "",

    description:
      descriptionEl
        ? descriptionEl.getText()
        : "",

    date:
      dateEl
        ? String(dateEl.getText())
            .slice(0, 10)
        : null
  };
}


function findAo3Preface_(byName) {
  const names =
    Object.keys(byName);

  for (let i = 0; i < names.length; i++) {
    const name =
      names[i];

    if (
      !/\.(xhtml|html|htm)$/i.test(name)
    ) {
      continue;
    }

    const text =
      getBlobText_(
        byName[name]
      );

    if (
      text.indexOf(
        "Posted originally on the"
      ) !== -1 &&
      text.indexOf(
        "archiveofourown.org/works/"
      ) !== -1
    ) {
      return {
        name: name,
        blob: byName[name]
      };
    }
  }

  return null;
}


function extractTagSection_(
  html,
  label
) {
  const escaped =
    escapeRegex_(label);

  const regex =
    new RegExp(
      "<dt[^>]*>\\s*" +
        escaped +
        ":?\\s*</dt>\\s*" +
        "<dd[^>]*>([\\s\\S]*?)</dd>",
      "i"
    );

  const match =
    html.match(regex);

  if (!match) {
    return [];
  }

  const content =
    match[1];

  const values = [];

  const anchorRegex =
    /<a\b[^>]*>([\s\S]*?)<\/a>/gi;

  let anchorMatch;

  while (
    (anchorMatch =
      anchorRegex.exec(content)) !== null
  ) {
    const value =
      htmlToPlainText_(
        anchorMatch[1]
      ).trim();

    if (value) {
      values.push(value);
    }
  }

  if (values.length > 0) {
    return uniqueStrings_(values);
  }

  const plain =
    htmlToPlainText_(
      content
    );

  return uniqueStrings_(
    plain
      .split(",")
      .map(function(item) {
        return item.trim();
      })
      .filter(Boolean)
  );
}


function extractTagSectionFirst_(
  html,
  label
) {
  const values =
    extractTagSection_(
      html,
      label
    );

  return values.length
    ? values[0]
    : "";
}


function extractSeries_(html) {
  const escaped =
    escapeRegex_("Series");

  const regex =
    new RegExp(
      "<dt[^>]*>\\s*" +
        escaped +
        ":?\\s*</dt>\\s*" +
        "<dd[^>]*>([\\s\\S]*?)</dd>",
      "gi"
    );

  const result = [];

  let section;

  while (
    (section =
      regex.exec(html)) !== null
  ) {
    const content =
      section[1];

    const itemRegex =
      /Part\s+(\d+)\s+of\s+<a\b[^>]*>([\s\S]*?)<\/a>/gi;

    let item;

    while (
      (item =
        itemRegex.exec(content)) !== null
    ) {
      const part =
        Number(item[1]);

      const name =
        htmlToPlainText_(
          item[2]
        ).trim();

      if (
        Number.isInteger(part) &&
        part > 0 &&
        name
      ) {
        result.push({
          name: name,
          part: part,
          label:
            "Part " +
            part +
            " of " +
            name
        });
      }
    }
  }

  const seen = {};
  const deduped = [];

  result.forEach(function(item) {
    const key =
      item.name +
      "|" +
      item.part;

    if (!seen[key]) {
      seen[key] = true;
      deduped.push(item);
    }
  });

  return deduped;
}


function extractStats_(html) {
  const match =
    html.match(
      /<dt[^>]*>\s*Stats:\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i
    );

  if (!match) {
    return {
      published: null,
      updated: null,
      words: null,
      chapters: ""
    };
  }

  const plain =
    htmlToPlainText_(
      match[1]
    )
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();

  const publishedMatch =
    plain.match(
      /Published:\s*(\d{4}-\d{2}-\d{2})/i
    );

  const updatedMatch =
    plain.match(
      /Updated:\s*(\d{4}-\d{2}-\d{2})/i
    );

  const wordsMatch =
    plain.match(
      /Words:\s*([\d,]+)/i
    );

  const chaptersMatch =
    plain.match(
      /Chapters:\s*(\d+\s*\/\s*(?:\d+|\?))/i
    );

  return {
    published:
      publishedMatch
        ? publishedMatch[1]
        : null,

    updated:
      updatedMatch
        ? updatedMatch[1]
        : null,

    words:
      wordsMatch
        ? Number(
            wordsMatch[1]
              .replace(/,/g, "")
          )
        : null,

    chapters:
      chaptersMatch
        ? chaptersMatch[1]
            .replace(/\s+/g, "")
        : ""
  };
}


function isCompleteFromChapters_(
  chapters
) {
  const match =
    String(chapters)
      .match(
        /^(\d+)\/(\d+|\?)$/
      );

  if (!match) {
    return false;
  }

  if (match[2] === "?") {
    return false;
  }

  return (
    Number(match[1]) ===
    Number(match[2])
  );
}


function getBlobText_(blob) {
  return blob
    .getDataAsString("UTF-8")
    .replace(/^\uFEFF/, "");
}


function normalizeZipPath_(path) {
  return String(path)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}


function htmlToPlainText_(html) {
  let text =
    String(html || "");

  text =
    text.replace(
      /<(br|\/p|\/div|\/blockquote|\/li|\/h[1-6])\b[^>]*>/gi,
      "\n"
    );

  text =
    text.replace(
      /<[^>]+>/g,
      ""
    );

  text =
    decodeXmlEntities_(
      text
    );

  text =
    text
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  return text;
}


function decodeXmlEntities_(text) {
  let value =
    String(text || "");

  value =
    value
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'");

  value =
    value.replace(
      /&#(\d+);/g,
      function(_, number) {
        return String.fromCharCode(
          Number(number)
        );
      }
    );

  value =
    value.replace(
      /&#x([0-9a-f]+);/gi,
      function(_, hex) {
        return String.fromCharCode(
          parseInt(hex, 16)
        );
      }
    );

  return value;
}


function uniqueStrings_(items) {
  const seen = {};
  const result = [];

  items.forEach(function(item) {
    const value =
      String(item || "")
        .trim();

    if (
      value &&
      !seen[value]
    ) {
      seen[value] = true;
      result.push(value);
    }
  });

  return result;
}


function escapeRegex_(text) {
  return String(text)
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
}
