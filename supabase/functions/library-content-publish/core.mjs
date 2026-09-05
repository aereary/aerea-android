export class PublishError extends Error {
  constructor(code, status, details = {}) {
    super(code);
    this.name = "PublishError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function normalizeSha256(value) {
  const sha = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-F0-9]{64}$/.test(sha)) {
    throw new PublishError("INVALID_SHA256", 400);
  }
  return sha;
}

export function safeExtension(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^\./, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
}

export function buildContentObjectPath(ownerUserId, itemId, sha256, extension) {
  const suffix = safeExtension(extension);
  return `${ownerUserId}/current/${itemId}/${sha256}${suffix ? `.${suffix}` : ""}`;
}

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function requireDriveFileId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{10,200}$/.test(value)) {
    throw new PublishError("INVALID_DRIVE_FILE_ID", 400);
  }
  return value;
}

function requireToken(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PublishError("MISSING_GOOGLE_OAUTH_TOKEN", 401);
  }
  return value.trim();
}

async function verifiedStoredObject(dependencies, path, expectedSha) {
  const storedBytes = await dependencies.readContentObject(path);
  if (storedBytes === null) return false;
  const storedSha = await sha256Hex(storedBytes);
  if (storedSha !== expectedSha) {
    throw new PublishError("STORAGE_OBJECT_SHA_MISMATCH", 409, {
      content_object_path: path,
    });
  }
  return true;
}

export async function publishLibraryContent(input, dependencies) {
  const googleOAuthToken = requireToken(input?.googleOAuthToken);
  const driveFileId = requireDriveFileId(input?.driveFileId);
  const expectedSha = normalizeSha256(input?.expectedSha256);

  const verifiedEmail = await dependencies.googleEmailFromToken(googleOAuthToken);
  if (!verifiedEmail) {
    throw new PublishError("GOOGLE_EMAIL_NOT_VERIFIED", 403);
  }
  const ownerEmail = verifiedEmail.trim().toLowerCase();

  if (!(await dependencies.libraryOwnerExists(ownerEmail))) {
    throw new PublishError("UNKNOWN_LIBRARY_OWNER", 403);
  }

  const item = await dependencies.findLibraryItem(ownerEmail, driveFileId);
  if (!item || item.ownerEmail.toLowerCase() !== ownerEmail) {
    throw new PublishError("LIBRARY_ITEM_NOT_OWNED", 403);
  }

  const databaseSha = normalizeSha256(item.sha256);
  if (databaseSha !== expectedSha) {
    throw new PublishError("EXPECTED_SHA_DOES_NOT_MATCH_LIBRARY_ITEM", 409);
  }

  const driveBytes = await dependencies.downloadDriveFile(
    driveFileId,
    googleOAuthToken,
  );
  const downloadedSha = await sha256Hex(driveBytes);
  if (downloadedSha !== databaseSha) {
    throw new PublishError("DRIVE_SHA_MISMATCH", 409, {
      expected_sha256: databaseSha,
      downloaded_sha256: downloadedSha,
    });
  }

  const contentObjectPath = buildContentObjectPath(
    item.ownerUserId,
    item.id,
    databaseSha,
    item.extension,
  );

  let objectAlreadyExisted = await verifiedStoredObject(
    dependencies,
    contentObjectPath,
    databaseSha,
  );

  if (!objectAlreadyExisted) {
    const uploadResult = await dependencies.uploadContentObject(
      contentObjectPath,
      driveBytes,
      item.mimeType || "application/octet-stream",
    );

    if (uploadResult === "already-exists") {
      objectAlreadyExisted = await verifiedStoredObject(
        dependencies,
        contentObjectPath,
        databaseSha,
      );
      if (!objectAlreadyExisted) {
        throw new PublishError("STORAGE_OBJECT_RACE_FAILED", 409);
      }
    }
  }

  const versionLinksUpdated = await dependencies.saveContentObjectPath({
    ownerUserId: item.ownerUserId,
    itemId: item.id,
    sha256: databaseSha,
    contentObjectPath,
  });

  return {
    ok: true,
    owner_user_id: item.ownerUserId,
    library_item_id: item.id,
    drive_file_id: driveFileId,
    sha256: databaseSha,
    content_object_path: contentObjectPath,
    object: objectAlreadyExisted ? "already_present" : "uploaded",
    version_links_updated: versionLinksUpdated,
    destructive_operations: 0,
  };
}
