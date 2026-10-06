"use client";

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBackLayer } from "./use-back-layer";

type Release = { tag: string; version: string; versionCode: number; size: number };
type UpdateStatus = { installedVersion: string; installedCode: number; available: Release | null; ready: boolean };
type Phase = "idle" | "checking" | "downloading" | "installing";
interface UpdatesPlugin {
  getStatus(): Promise<UpdateStatus>;
  check(): Promise<UpdateStatus>;
  download(): Promise<UpdateStatus>;
  cancelDownload(): Promise<void>;
  install(): Promise<void>;
  addListener(event: "downloadProgress", listener: (data: { percent: number }) => void): Promise<PluginListenerHandle>;
}
const Updates = registerPlugin<UpdatesPlugin>("AereaUpdates");
const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

function UpdateDialog({ release, phase, progress, ready, error, onDismiss, onUpdate }: {
  release: Release; phase: Phase; progress: number; ready: boolean; error: string;
  onDismiss: () => void; onUpdate: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  useBackLayer(true, onDismiss, 100);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  const busy = phase === "downloading" || phase === "installing";
  return (
    <div className="app-update-backdrop" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onDismiss();
    }}>
      <section className="app-update-dialog" role="dialog" aria-modal="true"
        aria-labelledby="app-update-title" aria-describedby="app-update-description" tabIndex={-1}
        ref={dialog} onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
          const first = buttons[0]; const last = buttons.at(-1);
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
            event.preventDefault(); last?.focus();
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) {
            event.preventDefault(); first?.focus();
          }
        }}>
        <span className="app-update-symbol" aria-hidden="true">↥</span>
        <p className="app-update-eyebrow">A LITTLE UPDATE</p>
        <h2 id="app-update-title">A new version of aérea is here</h2>
        <p id="app-update-description">Version {release.version} · {(release.size / 1024 / 1024).toFixed(1)} MB</p>
        <p>Your notes, books and plans stay with you.</p>
        {phase === "downloading" && (
          <div className="app-update-progress" role="status" aria-live="polite">
            <progress max={100} value={progress} aria-label="Update download" />
            <span>{progress >= 100 ? "Verifying update…" : `Downloading… ${progress}%`}</span>
          </div>
        )}
        {phase === "installing" && <p role="status">Follow the Android installation screen.</p>}
        {error && <p className="app-update-error" role="alert">{error}</p>}
        <footer>
          <button type="button" onClick={onDismiss}>{phase === "downloading" ? "Cancel download" : "Later"}</button>
          <button type="button" className="app-update-primary" disabled={busy} onClick={onUpdate}>
            {ready ? "Install update" : "Download & install"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export function useAppUpdates(appReady: boolean) {
  const native = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const mounted = useRef(false);
  const lastCheck = useRef(0);
  const dismissedTag = useRef("");
  const cancelled = useRef(false);

  useEffect(() => {
    if (!native) return;
    mounted.current = true;
    let active = true;
    let listener: PluginListenerHandle | undefined;
    void Updates.getStatus().then((value) => { if (active) setStatus(value); }).catch(() => undefined);
    void Updates.addListener("downloadProgress", ({ percent }) => {
      if (active) setProgress(Math.max(0, Math.min(100, percent)));
    }).then((handle) => { if (active) listener = handle; else void handle.remove(); }).catch(() => undefined);
    return () => {
      active = false;
      mounted.current = false;
      if (listener) void listener.remove();
    };
  }, [native]);

  const check = useCallback(async (manual = false) => {
    if (!native || busy.current) return;
    busy.current = true;
    lastCheck.current = Date.now();
    setPhase("checking"); setError(""); setMessage("");
    try {
      const value = await Updates.check();
      if (!mounted.current) return;
      setStatus(value);
      if (value.available && (manual || value.available.tag !== dismissedTag.current)) setVisible(true);
      if (manual && !value.available) setMessage("You have the latest version.");
    } catch {
      if (mounted.current && manual) setMessage("Could not check for updates. Try again when you are online.");
      // Offline/rate-limited startup checks are silent; the planner stays usable.
    } finally {
      busy.current = false;
      if (mounted.current) setPhase("idle");
    }
  }, [native]);

  useEffect(() => {
    if (!native || !appReady) return;
    const timer = window.setTimeout(() => { void check(); }, 2500);
    const resume = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current >= CHECK_INTERVAL) void check();
    };
    document.addEventListener("visibilitychange", resume);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", resume); };
  }, [native, appReady, check]);

  const dismiss = useCallback(() => {
    dismissedTag.current = status?.available?.tag ?? "";
    setVisible(false); setError("");
    if (phase === "downloading") {
      cancelled.current = true;
      void Updates.cancelDownload().catch(() => undefined);
    }
  }, [phase, status]);

  const update = useCallback(async () => {
    if (busy.current || !status?.available) return;
    busy.current = true;
    cancelled.current = false;
    setError(""); setProgress(0);
    let downloaded = status.ready;
    try {
      if (!downloaded) {
        setPhase("downloading");
        const value = await Updates.download();
        if (!mounted.current || cancelled.current) return;
        setStatus(value);
        downloaded = true;
      }
      if (cancelled.current || !mounted.current) return;
      setPhase("installing");
      await Updates.install();
      if (mounted.current) setMessage("If you cancelled installation, you can try again here.");
    } catch (cause) {
      if (mounted.current && !cancelled.current) {
        const text = cause instanceof Error ? cause.message : "Could not update. Please try again.";
        setError(text);
        // Re-read ready state: Android may have discarded a temporary cache file.
        if (downloaded) {
          const value = await Updates.getStatus().catch(() => null);
          if (mounted.current && value) setStatus(value);
        }
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPhase("idle");
    }
  }, [status]);

  return {
    settings: native ? (
      <section className="app-update-settings" aria-label="App updates">
        <div><h3>App updates</h3><p>{status ? `Installed version ${status.installedVersion}` : "Check for a new version of aérea."}</p></div>
        <button type="button" disabled={phase !== "idle"} onClick={() => { void check(true); }}>
          {phase === "checking" ? "Checking…" : "Check for updates"}
        </button>
        {message && <p role="status">{message}</p>}
      </section>
    ) : null,
    dialog: native && visible && status?.available ? (
      <UpdateDialog release={status.available} phase={phase} progress={progress} ready={status.ready}
        error={error} onDismiss={dismiss} onUpdate={() => { void update(); }} />
    ) : null,
  };
}
