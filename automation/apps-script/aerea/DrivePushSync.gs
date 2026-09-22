/*
 * ============================================================
 * AÉREA — DRIVE PUSH SYNC
 * ============================================================
 *
 * Drive sends a small notification when something changes. A one-minute
 * trigger consumes the change feed and runs the existing safe synchronizer
 * only when a file belongs to one of aérea's configured library folders.
 *
 * This file never moves, renames, deletes, or edits Drive files or folders.
 */

const AEREA_DRIVE_PUSH = {
  SIGNAL_FUNCTION: "drive-change-signal",
  CHECK_HANDLER: "aereaDriveChangeCheck",
  RENEW_HANDLER: "aereaRenewDriveWatch",
  CHECK_EVERY_MINUTES: 1,
  WATCH_LIFETIME_MS: 6 * 24 * 60 * 60 * 1000,
  RENEW_BEFORE_MS: 36 * 60 * 60 * 1000,
  PROPERTY_PAGE_TOKEN: "AEREA_DRIVE_CHANGE_PAGE_TOKEN",
  PROPERTY_CHANNEL_ID: "AEREA_DRIVE_CHANGE_CHANNEL_ID",
  PROPERTY_RESOURCE_ID: "AEREA_DRIVE_CHANGE_RESOURCE_ID",
  PROPERTY_EXPIRATION: "AEREA_DRIVE_CHANGE_EXPIRATION",
  PROPERTY_LAST_CHECK: "AEREA_DRIVE_CHANGE_LAST_CHECK",
  PROPERTY_LAST_RELEVANT: "AEREA_DRIVE_CHANGE_LAST_RELEVANT",
  PROPERTY_LAST_ERROR: "AEREA_DRIVE_CHANGE_LAST_ERROR"
};


function aereaDriveApiJson_(url, options) {
  const request = Object.assign({}, options || {});
  request.headers = Object.assign(
    {},
    request.headers || {},
    { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  );
  request.muteHttpExceptions = true;

  const response = UrlFetchApp.fetch(url, request);
  const status = response.getResponseCode();
  const text = response.getContentText();

  if (status < 200 || status >= 300) {
    const error = new Error(
      "Drive API failed (" + status + "): " + text
    );
    error.statusCode = status;
    throw error;
  }

  return text ? JSON.parse(text) : {};
}


function aereaSignalJson_(body) {
  const response = UrlFetchApp.fetch(
    aereaFunctionUrl_(AEREA_DRIVE_PUSH.SIGNAL_FUNCTION),
    {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify(body || {}),
      muteHttpExceptions: true
    }
  );

  const status = response.getResponseCode();
  const text = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error(
      "Drive signal failed (" + status + "): " + text
    );
  }

  return text ? JSON.parse(text) : {};
}


function aereaDriveStartPageToken_() {
  const body = aereaDriveApiJson_(
    "https://www.googleapis.com/drive/v3/changes/startPageToken" +
      "?supportsAllDrives=true",
    { method: "get" }
  );

  if (!body.startPageToken) {
    throw new Error("Drive did not return a start page token.");
  }

  return String(body.startPageToken);
}


function aereaStopDriveChannel_(channelId, resourceId) {
  if (!channelId || !resourceId) return false;

  try {
    aereaDriveApiJson_(
      "https://www.googleapis.com/drive/v3/channels/stop",
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          id: channelId,
          resourceId: resourceId
        })
      }
    );
    return true;
  } catch (error) {
    console.warn(
      "Could not stop the previous Drive channel: " + String(error)
    );
    return false;
  }
}


function aereaRegisterDriveWatch_(force) {
  const props = PropertiesService.getScriptProperties();
  const currentExpiration = Number(
    props.getProperty(AEREA_DRIVE_PUSH.PROPERTY_EXPIRATION) || 0
  );

  if (
    !force &&
    currentExpiration - Date.now() > AEREA_DRIVE_PUSH.RENEW_BEFORE_MS
  ) {
    return {
      renewed: false,
      reason: "channel_still_healthy",
      expires_at: new Date(currentExpiration).toISOString()
    };
  }

  const oldChannelId = props.getProperty(
    AEREA_DRIVE_PUSH.PROPERTY_CHANNEL_ID
  );
  const oldResourceId = props.getProperty(
    AEREA_DRIVE_PUSH.PROPERTY_RESOURCE_ID
  );
  const pageToken = props.getProperty(
    AEREA_DRIVE_PUSH.PROPERTY_PAGE_TOKEN
  ) || aereaDriveStartPageToken_();

  const channelId = Utilities.getUuid();
  const channelToken = (
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "")
  );
  const requestedExpiration = Date.now() +
    AEREA_DRIVE_PUSH.WATCH_LIFETIME_MS;

  /* Register the secret before asking Drive to send its immediate sync ping. */
  aereaSignalJson_({
    action: "register",
    channel_id: channelId,
    channel_token: channelToken,
    channel_expires_at_ms: requestedExpiration
  });

  const watchUrl =
    "https://www.googleapis.com/drive/v3/changes/watch" +
    "?pageToken=" + encodeURIComponent(pageToken) +
    "&supportsAllDrives=true";
  const channel = aereaDriveApiJson_(watchUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      id: channelId,
      type: "web_hook",
      address: aereaFunctionUrl_(AEREA_DRIVE_PUSH.SIGNAL_FUNCTION),
      token: channelToken,
      expiration: requestedExpiration
    })
  });

  const actualExpiration = Number(channel.expiration || requestedExpiration);
  const resourceId = String(channel.resourceId || "");
  if (!resourceId) {
    throw new Error("Drive did not return a notification resource ID.");
  }

  aereaSignalJson_({
    action: "register",
    channel_id: channelId,
    channel_token: channelToken,
    resource_id: resourceId,
    channel_expires_at_ms: actualExpiration
  });

  props.setProperties({
    [AEREA_DRIVE_PUSH.PROPERTY_PAGE_TOKEN]: pageToken,
    [AEREA_DRIVE_PUSH.PROPERTY_CHANNEL_ID]: channelId,
    [AEREA_DRIVE_PUSH.PROPERTY_RESOURCE_ID]: resourceId,
    [AEREA_DRIVE_PUSH.PROPERTY_EXPIRATION]: String(actualExpiration)
  });

  if (oldChannelId && oldResourceId && oldChannelId !== channelId) {
    aereaStopDriveChannel_(oldChannelId, oldResourceId);
  }

  return {
    renewed: true,
    channel_id: channelId,
    expires_at: new Date(actualExpiration).toISOString(),
    destructive_operations: 0
  };
}


function aereaRelevantDriveChanges_() {
  const props = PropertiesService.getScriptProperties();
  let pageToken = props.getProperty(
    AEREA_DRIVE_PUSH.PROPERTY_PAGE_TOKEN
  );

  if (!pageToken) {
    pageToken = aereaDriveStartPageToken_();
    props.setProperty(
      AEREA_DRIVE_PUSH.PROPERTY_PAGE_TOKEN,
      pageToken
    );
    return { relevant: true, changes_seen: 0, token_recovered: true };
  }

  const folderIds = new Set([
    aereaRequiredProperty_("AEREA_DOWNLOADS_FOLDER_ID"),
    aereaRequiredProperty_("AEREA_FOLDER_ID"),
    aereaRequiredProperty_("AEREA_VERSIONS_FOLDER_ID")
  ]);
  let nextPageToken = pageToken;
  let newStartPageToken = "";
  let relevant = false;
  let changesSeen = 0;

  try {
    do {
      const url =
        "https://www.googleapis.com/drive/v3/changes" +
        "?pageToken=" + encodeURIComponent(nextPageToken) +
        "&pageSize=1000" +
        "&supportsAllDrives=true" +
        "&includeItemsFromAllDrives=true" +
        "&fields=" + encodeURIComponent(
          "nextPageToken,newStartPageToken," +
          "changes(fileId,removed,file(id,name,mimeType,parents,trashed))"
        );
      const body = aereaDriveApiJson_(url, { method: "get" });

      (body.changes || []).forEach(function(change) {
        changesSeen++;
        const file = change.file || {};
        const parents = Array.isArray(file.parents) ? file.parents : [];
        if (
          folderIds.has(String(change.fileId || "")) ||
          parents.some(function(parentId) { return folderIds.has(parentId); })
        ) {
          relevant = true;
        }
      });

      nextPageToken = body.nextPageToken || "";
      newStartPageToken = body.newStartPageToken || newStartPageToken;
    } while (nextPageToken);
  } catch (error) {
    if (Number(error && error.statusCode) !== 410) throw error;

    const recoveredToken = aereaDriveStartPageToken_();
    props.setProperty(
      AEREA_DRIVE_PUSH.PROPERTY_PAGE_TOKEN,
      recoveredToken
    );
    return {
      relevant: true,
      changes_seen: changesSeen,
      token_recovered: true
    };
  }

  if (newStartPageToken) {
    props.setProperty(
      AEREA_DRIVE_PUSH.PROPERTY_PAGE_TOKEN,
      newStartPageToken
    );
  }

  return {
    relevant: relevant,
    changes_seen: changesSeen,
    token_recovered: false
  };
}


function aereaDriveChangeCheck() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(
    AEREA_DRIVE_PUSH.PROPERTY_LAST_CHECK,
    new Date().toISOString()
  );

  const claim = aereaSignalJson_({ action: "claim" });
  if (!claim.should_sync) {
    return { checked: true, synced: false, reason: "no_pending_signal" };
  }

  const generation = Number(claim.generation);
  try {
    const changes = aereaRelevantDriveChanges_();
    let syncResult = null;

    if (changes.relevant) {
      props.setProperty(
        AEREA_DRIVE_PUSH.PROPERTY_LAST_RELEVANT,
        new Date().toISOString()
      );
      syncResult = aereaAutoSyncAll();
      if (syncResult && syncResult.skipped) {
        throw new Error("The scheduled fallback sync is already running.");
      }
    }

    const completion = aereaSignalJson_({
      action: "complete",
      generation: generation,
      success: true
    });
    props.deleteProperty(AEREA_DRIVE_PUSH.PROPERTY_LAST_ERROR);

    return {
      checked: true,
      synced: changes.relevant,
      changes: changes,
      sync: syncResult,
      notification_acknowledged: completion.acknowledged === true
    };
  } catch (error) {
    const message = error && error.stack
      ? String(error.stack)
      : String(error);
    props.setProperty(
      AEREA_DRIVE_PUSH.PROPERTY_LAST_ERROR,
      new Date().toISOString() + " | " + message
    );

    try {
      aereaSignalJson_({
        action: "complete",
        generation: generation,
        success: false,
        error: message
      });
    } catch (signalError) {
      console.error("Could not preserve the pending signal: " + signalError);
    }
    throw error;
  }
}


function aereaRenewDriveWatch() {
  return aereaRegisterDriveWatch_(false);
}


function aereaInstallDrivePushSync() {
  aereaRemoveDrivePushTriggers_();
  const channel = aereaRegisterDriveWatch_(true);

  ScriptApp
    .newTrigger(AEREA_DRIVE_PUSH.CHECK_HANDLER)
    .timeBased()
    .everyMinutes(AEREA_DRIVE_PUSH.CHECK_EVERY_MINUTES)
    .create();

  ScriptApp
    .newTrigger(AEREA_DRIVE_PUSH.RENEW_HANDLER)
    .timeBased()
    .everyHours(24)
    .create();

  return {
    installed: true,
    channel: channel,
    fallback: aereaAutoSyncStatus(),
    note: "Drive files and folders were not modified."
  };
}


function aereaRemoveDrivePushTriggers_() {
  const handlers = new Set([
    AEREA_DRIVE_PUSH.CHECK_HANDLER,
    AEREA_DRIVE_PUSH.RENEW_HANDLER
  ]);
  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (handlers.has(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  return deleted;
}


function aereaRemoveDrivePushSync() {
  const props = PropertiesService.getScriptProperties();
  const channelId = props.getProperty(
    AEREA_DRIVE_PUSH.PROPERTY_CHANNEL_ID
  );
  const resourceId = props.getProperty(
    AEREA_DRIVE_PUSH.PROPERTY_RESOURCE_ID
  );
  const triggersDeleted = aereaRemoveDrivePushTriggers_();
  const channelStopped = aereaStopDriveChannel_(channelId, resourceId);

  aereaSignalJson_({ action: "deactivate" });
  props.deleteProperty(AEREA_DRIVE_PUSH.PROPERTY_CHANNEL_ID);
  props.deleteProperty(AEREA_DRIVE_PUSH.PROPERTY_RESOURCE_ID);
  props.deleteProperty(AEREA_DRIVE_PUSH.PROPERTY_EXPIRATION);

  return {
    removed: true,
    triggers_deleted: triggersDeleted,
    channel_stopped: channelStopped,
    drive_files_modified: 0
  };
}


function aereaDrivePushStatus() {
  const props = PropertiesService.getScriptProperties();
  return {
    remote: aereaSignalJson_({ action: "status" }),
    local: {
      channel_id: props.getProperty(
        AEREA_DRIVE_PUSH.PROPERTY_CHANNEL_ID
      ),
      expires_at: props.getProperty(
        AEREA_DRIVE_PUSH.PROPERTY_EXPIRATION
      ),
      last_check: props.getProperty(
        AEREA_DRIVE_PUSH.PROPERTY_LAST_CHECK
      ),
      last_relevant_change: props.getProperty(
        AEREA_DRIVE_PUSH.PROPERTY_LAST_RELEVANT
      ),
      last_error: props.getProperty(
        AEREA_DRIVE_PUSH.PROPERTY_LAST_ERROR
      )
    },
    fallback: aereaAutoSyncStatus()
  };
}
