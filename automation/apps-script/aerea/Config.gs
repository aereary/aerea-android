/*
 * Runtime configuration for the AÉREA Drive synchronizer.
 *
 * Required Script Properties:
 * - AEREA_DOWNLOADS_FOLDER_ID
 * - AEREA_FOLDER_ID
 * - AEREA_VERSIONS_FOLDER_ID
 * - AEREA_SUPABASE_FUNCTIONS_BASE_URL
 */
function aereaRequiredProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value || !String(value).trim()) {
    throw new Error("Missing required Script Property: " + name);
  }
  return String(value).trim();
}

function aereaFunctionUrl_(slug) {
  const base = aereaRequiredProperty_(
    "AEREA_SUPABASE_FUNCTIONS_BASE_URL"
  ).replace(/\/+$/, "");

  if (!/^[a-z0-9-]+$/.test(String(slug))) {
    throw new Error("Invalid Edge Function slug.");
  }

  return base + "/" + slug;
}

var AEREA_FOLDER_INVENTORY_CACHE_ = {};

/*
 * DriveApp performs a remote call for each metadata getter. A single Drive v3
 * inventory request avoids hundreds of round trips on every scheduled run.
 */
function aereaListFolderFiles_(folderId) {
  if (AEREA_FOLDER_INVENTORY_CACHE_[folderId]) {
    return AEREA_FOLDER_INVENTORY_CACHE_[folderId];
  }

  const token = ScriptApp.getOAuthToken();
  const rows = [];
  let pageToken = "";

  do {
    const params = [
      "q=" + encodeURIComponent(
        "'" + folderId + "' in parents and trashed = false"
      ),
      "pageSize=1000",
      "supportsAllDrives=true",
      "includeItemsFromAllDrives=true",
      "fields=" + encodeURIComponent(
        "nextPageToken,files(id,name,size,modifiedTime,mimeType)"
      )
    ];

    if (pageToken) {
      params.push("pageToken=" + encodeURIComponent(pageToken));
    }

    const response = UrlFetchApp.fetch(
      "https://www.googleapis.com/drive/v3/files?" + params.join("&"),
      {
        method: "get",
        headers: {
          Authorization: "Bearer " + token
        },
        muteHttpExceptions: true
      }
    );

    const status = response.getResponseCode();
    const text = response.getContentText();
    if (status < 200 || status >= 300) {
      throw new Error("Drive inventory failed (" + status + "): " + text);
    }

    const body = JSON.parse(text || "{}");
    (body.files || []).forEach(function(file) {
      rows.push({
        id: String(file.id || ""),
        name: String(file.name || ""),
        size: Number(file.size || 0),
        modified_time: file.modifiedTime
          ? new Date(file.modifiedTime).toISOString()
          : "",
        mime_type: file.mimeType || null
      });
    });
    pageToken = body.nextPageToken || "";
  } while (pageToken);

  AEREA_FOLDER_INVENTORY_CACHE_[folderId] = rows;
  return rows;
}

function aereaSameFileState_(left, right) {
  return JSON.stringify((left && left.files) || {}) ===
    JSON.stringify((right && right.files) || {});
}

function aereaMetadataFile_(metadata) {
  let driveFile = null;
  function liveFile() {
    if (!driveFile) {
      driveFile = DriveApp.getFileById(metadata.id);
    }
    return driveFile;
  }

  return {
    getId: function() {
      return metadata.id;
    },
    getName: function() {
      return metadata.name;
    },
    getSize: function() {
      return metadata.size;
    },
    getLastUpdated: function() {
      return new Date(metadata.modified_time);
    },
    getMimeType: function() {
      return metadata.mime_type;
    },
    getBlob: function() {
      return liveFile().getBlob();
    }
  };
}

function aereaMetadataIterator_(rows) {
  let index = 0;
  return {
    hasNext: function() {
      return index < rows.length;
    },
    next: function() {
      if (index >= rows.length) {
        throw new Error("Drive metadata iterator exhausted.");
      }
      const row = rows[index];
      index += 1;
      return aereaMetadataFile_(row);
    }
  };
}

function aereaWithScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    throw new Error("AÉREA sync is already running.");
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}
