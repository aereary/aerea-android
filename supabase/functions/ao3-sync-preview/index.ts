import { createClient } from "npm:@supabase/supabase-js@2";
import { googleEmailFromToken } from "../_shared/google-auth.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const H = { "content-type": "application/json; charset=utf-8" };
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: H });

function validSha(value: unknown): value is string {
  return typeof value === "string" && /^[A-Fa-f0-9]{64}$/.test(value);
}

function canonicalFilename(workId: number, filename: string) {
  return filename.startsWith(`${workId} `) || filename.startsWith(`${workId}_`);
}

function oneBy<T>(items: T[], pred: (x: T) => boolean): T | null {
  const m = items.filter(pred);
  return m.length === 1 ? m[0] : null;
}

function chooseAccepted(
  workId: number,
  candidates: any[],
  state: any,
  primary: any | undefined,
): any | null {
  if (!candidates.length) return null;

  const byStateDrive = oneBy(
    candidates,
    (x) => x.current_drive_file_id === state?.current_drive_file_id,
  );
  if (byStateDrive) return byStateDrive;

  const byPrimaryDrive = oneBy(
    candidates,
    (x) => x.current_drive_file_id === primary?.drive_file_id,
  );
  if (byPrimaryDrive) return byPrimaryDrive;

  const canonical = candidates.filter((x) =>
    canonicalFilename(workId, x.current_filename)
  );
  if (canonical.length === 1) return canonical[0];

  return candidates.length === 1 ? candidates[0] : null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });

  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return reply(401, { error: "Missing Google OAuth token" });

  const email = await googleEmailFromToken(m[1]);
  if (!email) return reply(403, { error: "Google token has no verified email" });

  const { data: ownerCheck, error: ownerError } = await db
    .from("ao3_works")
    .select("owner_email")
    .eq("owner_email", email)
    .limit(1);

  if (ownerError || !ownerCheck?.length) {
    return reply(403, { error: "This Google account is not an AO3 library owner" });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  const rawCurrent = Array.isArray(body?.current_items) ? body.current_items : [];
  if (rawCurrent.length > 5000) return reply(400, { error: "Too many current items" });

  const warnings: any[] = [];
  const current: any[] = [];

  for (const item of rawCurrent) {
    const workId = Number(item?.work_id);
    const sha = typeof item?.sha256 === "string" ? item.sha256.toUpperCase() : "";
    const driveId = typeof item?.current_drive_file_id === "string"
      ? item.current_drive_file_id
      : "";
    const filename = typeof item?.current_filename === "string"
      ? item.current_filename
      : "";

    if (!Number.isInteger(workId) || workId <= 0) {
      warnings.push({ type: "INVALID_WORK_ID", value: item?.work_id });
      continue;
    }
    if (!validSha(sha)) {
      warnings.push({ type: "INVALID_SHA256", work_id: workId });
      continue;
    }
    if (!driveId || !filename) {
      warnings.push({ type: "MISSING_CURRENT_DRIVE_FILE", work_id: workId });
      continue;
    }

    current.push({
      work_id: workId,
      sha256: sha,
      current_drive_file_id: driveId,
      current_filename: filename,
    });
  }

  const [
    { data: works, error: worksErr },
    { data: epubs, error: epubsErr },
    { data: states, error: statesErr },
    { data: snapshots, error: snapshotsErr },
  ] = await Promise.all([
    db.from("ao3_works").select("work_id").eq("owner_email", email),
    db.from("ao3_epub_versions")
      .select("work_id,drive_file_id,filename,is_primary")
      .eq("owner_email", email),
    db.from("ao3_work_sync_state")
      .select("work_id,current_sha256,current_drive_file_id,current_filename")
      .eq("owner_email", email),
    db.from("ao3_epub_snapshots")
      .select("work_id,sha256,drive_file_id")
      .eq("owner_email", email),
  ]);

  if (worksErr || epubsErr || statesErr || snapshotsErr) {
    return reply(500, { error: "Database read failed" });
  }

  const workIds = new Set<number>((works ?? []).map((w: any) => Number(w.work_id)));
  const stateByWork = new Map<number, any>();
  for (const s of states ?? []) stateByWork.set(Number(s.work_id), s);

  const primaryByWork = new Map<number, any>();
  for (const e of epubs ?? []) {
    if (e.is_primary) primaryByWork.set(Number(e.work_id), e);
  }

  const knownSnapshotShas = new Map<number, Set<string>>();
  for (const s of snapshots ?? []) {
    const wid = Number(s.work_id);
    const set = knownSnapshotShas.get(wid) ?? new Set<string>();
    if (typeof s.sha256 === "string") set.add(s.sha256.toUpperCase());
    knownSnapshotShas.set(wid, set);
  }

  const grouped = new Map<number, any[]>();
  for (const item of current) {
    const list = grouped.get(item.work_id) ?? [];
    list.push(item);
    grouped.set(item.work_id, list);
  }

  const changes: any[] = [];
  const unchanged: number[] = [];
  const updated: number[] = [];
  const relinked: number[] = [];
  const newWorks: number[] = [];
  const altCandidates: number[] = [];
  const historicalRegressionIds: number[] = [];
  const missingFromDrive: number[] = [];
  let knownAlternativesIgnored = 0;

  for (const workId of Array.from(workIds).sort((a, b) => a - b)) {
    const candidates = grouped.get(workId) ?? [];
    const state = stateByWork.get(workId);
    const primary = primaryByWork.get(workId);
    const snapshotSet = knownSnapshotShas.get(workId) ?? new Set<string>();

    if (!state) {
      warnings.push({ type: "WORK_WITHOUT_SYNC_STATE", work_id: workId });
      continue;
    }

    if (!candidates.length) {
      missingFromDrive.push(workId);
      unchanged.push(workId);
      continue;
    }

    const oldSha = String(state.current_sha256 || "").toUpperCase();
    const acceptedCandidates = candidates.filter((x) => x.sha256 === oldSha);
    const historicalKnown = candidates.filter((x) =>
      x.sha256 !== oldSha && snapshotSet.has(x.sha256)
    );
    const unknown = candidates.filter((x) =>
      x.sha256 !== oldSha && !snapshotSet.has(x.sha256)
    );

    const acceptedPick = chooseAccepted(workId, acceptedCandidates, state, primary);

    let updatePick: any | null = null;
    if (unknown.length) {
      updatePick = oneBy(
        unknown,
        (x) => x.current_drive_file_id === state.current_drive_file_id,
      );
      if (!updatePick) {
        updatePick = oneBy(
          unknown,
          (x) => x.current_drive_file_id === primary?.drive_file_id,
        );
      }
      if (!updatePick && !acceptedPick && unknown.length === 1) {
        updatePick = unknown[0];
      }
    }

    let historicalPrimaryPick: any | null = null;
    if (!acceptedPick && !updatePick && historicalKnown.length) {
      historicalPrimaryPick = oneBy(
        historicalKnown,
        (x) => x.current_drive_file_id === state.current_drive_file_id,
      );
      if (!historicalPrimaryPick) {
        historicalPrimaryPick = oneBy(
          historicalKnown,
          (x) => x.current_drive_file_id === primary?.drive_file_id,
        );
      }
    }

    knownAlternativesIgnored += Math.max(
      0,
      historicalKnown.length - (historicalPrimaryPick ? 1 : 0),
    );

    if (updatePick) {
      updated.push(workId);
      changes.push({
        action: "updated",
        work_id: workId,
        previous_sha256: oldSha,
        sha256: updatePick.sha256,
        current_drive_file_id: updatePick.current_drive_file_id,
        current_filename: updatePick.current_filename,
      });
    } else if (acceptedPick) {
      unchanged.push(workId);
      if (
        acceptedPick.current_drive_file_id !== state.current_drive_file_id ||
        acceptedPick.current_filename !== state.current_filename
      ) {
        relinked.push(workId);
        changes.push({
          action: "relinked",
          work_id: workId,
          previous_sha256: oldSha,
          sha256: oldSha,
          current_drive_file_id: acceptedPick.current_drive_file_id,
          current_filename: acceptedPick.current_filename,
        });
      }
    } else if (historicalPrimaryPick) {
      historicalRegressionIds.push(workId);
      updated.push(workId);
      changes.push({
        action: "updated",
        work_id: workId,
        previous_sha256: oldSha,
        sha256: historicalPrimaryPick.sha256,
        current_drive_file_id: historicalPrimaryPick.current_drive_file_id,
        current_filename: historicalPrimaryPick.current_filename,
        historical_regression: true,
      });
    } else if (historicalKnown.length) {
      unchanged.push(workId);
    }

    for (const item of unknown) {
      if (updatePick && item.current_drive_file_id === updatePick.current_drive_file_id) continue;
      altCandidates.push(workId);
      changes.push({
        action: "alternative",
        work_id: workId,
        previous_sha256: null,
        sha256: item.sha256,
        current_drive_file_id: item.current_drive_file_id,
        current_filename: item.current_filename,
      });
    }

    if (
      !acceptedPick &&
      !updatePick &&
      !historicalPrimaryPick &&
      !historicalKnown.length &&
      unknown.length > 1
    ) {
      warnings.push({
        type: "AMBIGUOUS_CURRENT_EPUB",
        work_id: workId,
        candidates: unknown.map((x) => x.current_filename),
      });
    }
  }

  for (const workId of Array.from(grouped.keys()).sort((a, b) => a - b)) {
    if (workIds.has(workId)) continue;

    const candidates = grouped.get(workId) ?? [];
    const canonical = candidates.filter((x) =>
      canonicalFilename(workId, x.current_filename)
    );
    let pick: any | null = null;
    if (canonical.length === 1) pick = canonical[0];
    else if (candidates.length === 1) pick = candidates[0];

    if (!pick) {
      warnings.push({
        type: "AMBIGUOUS_NEW_WORK_EPUB",
        work_id: workId,
        candidates: candidates.map((x) => x.current_filename),
      });
      continue;
    }

    newWorks.push(workId);
    changes.push({
      action: "new",
      work_id: workId,
      previous_sha256: null,
      sha256: pick.sha256,
      current_drive_file_id: pick.current_drive_file_id,
      current_filename: pick.current_filename,
    });

    for (const item of candidates) {
      if (item.current_drive_file_id === pick.current_drive_file_id) continue;
      altCandidates.push(workId);
      changes.push({
        action: "alternative",
        work_id: workId,
        previous_sha256: null,
        sha256: item.sha256,
        current_drive_file_id: item.current_drive_file_id,
        current_filename: item.current_filename,
      });
    }
  }

  return reply(200, {
    mode: "sync_preview_v4",
    owner: email,
    current_items_received: rawCurrent.length,
    valid_current_items: current.length,
    database_works: workIds.size,
    sync_states: stateByWork.size,
    canonical_current_works: workIds.size + newWorks.length,
    unchanged_works: unchanged.length,
    updated_works: updated.length,
    updated_work_ids: updated,
    historical_regressions_detected: historicalRegressionIds.length,
    historical_regression_work_ids: historicalRegressionIds,
    new_works: newWorks.length,
    new_work_ids: newWorks,
    relinked_same_content: relinked.length,
    relinked_work_ids: relinked,
    alternative_candidates: altCandidates.length,
    alternative_candidate_work_ids: altCandidates,
    alternative_items_ignored: knownAlternativesIgnored,
    missing_from_drive_works: missingFromDrive.length,
    missing_from_drive_work_ids: missingFromDrive,
    changes,
    warnings,
    touched_ao3_works: 0,
    touched_ao3_epub_versions: 0,
    touched_snapshots: 0,
    touched_sync_state: 0,
    destructive_operations: 0,
  });
});
