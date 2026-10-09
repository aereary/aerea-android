"use client";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import type { StudyRecordingItem } from "./study-library";

export type ClassRecording = StudyRecordingItem & { classItemId?: string; nativeSessionId?: string };
type NativeSession = ClassRecording & { sessionId: string };
type Snapshot = { recording: boolean; seconds: number; pending?: NativeSession[]; error?: string };
type MicrophonePlugin = {
  status(): Promise<{ permission: "granted" | "denied" }>;
  requestPermissions(): Promise<{ permission: "granted" | "denied" }>;
  recordingStatus(): Promise<Snapshot>;
  startRecording(options: { className: string; classItemId?: string; name: string; notes: string }): Promise<Snapshot>;
  stopRecording(): Promise<Snapshot>;
  acknowledgeRecordings(options: { sessions: string[] }): Promise<void>;
  deleteRecording(options: { sessionId: string }): Promise<void>;
};
const microphone = registerPlugin<MicrophonePlugin>("AereaMicrophone");
export async function acknowledgeClassRecordings(recordings: ClassRecording[]) {
  await microphone.acknowledgeRecordings({ sessions: recordings.flatMap(item => item.nativeSessionId ? [item.nativeSessionId] : []) });
}
export async function deleteClassAudio(recording: ClassRecording) {
  if (Capacitor.isNativePlatform() && recording.nativeSessionId) await microphone.deleteRecording({ sessionId: recording.nativeSessionId });
}
export function classAudioSource(recording: StudyRecordingItem) {
  return recording.url?.startsWith("file://") ? Capacitor.convertFileSrc(recording.url) : recording.url;
}

export function useClassRecording(options: {
  ready: boolean; className: string; classItemId?: string; name: string; notes: string;
  onSaved(recording: ClassRecording): void; onFinished(): void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [recordingBusy, setRecordingBusy] = useState(false);
  const callbacks = useRef(options);
  const busy = useRef(false);
  const refreshing = useRef(false);
  const watching = useRef(false);
  const webRecorder = useRef<MediaRecorder | null>(null);
  const webStream = useRef<MediaStream | null>(null);
  const started = useRef(0);
  useEffect(() => { callbacks.current = options; });

  function accept(snapshot: Snapshot) {
    watching.current = snapshot.recording || Boolean(snapshot.pending?.length);
    setIsRecording(snapshot.recording);
    setRecordingSeconds(snapshot.recording ? snapshot.seconds : 0);
    if (snapshot.error) setRecordingError(snapshot.error);
    for (const item of snapshot.pending || []) {
      callbacks.current.onSaved({ id: item.id, className: item.className, classItemId: item.classItemId,
        name: item.name, notes: item.notes, duration: item.duration, url: item.url, nativeSessionId: item.sessionId });
    }
  }

  useEffect(() => {
    if (!options.ready || !Capacitor.isNativePlatform()) return;
    let cancelled = false;
    const refresh = async () => {
      if (busy.current || refreshing.current || document.visibilityState === "hidden") return;
      refreshing.current = true;
      try { const snapshot = await microphone.recordingStatus(); if (!cancelled && !busy.current) accept(snapshot); }
      catch (error) { if (!cancelled) setRecordingError(error instanceof Error ? error.message : "Could not check recording status."); }
      finally { refreshing.current = false; }
    };
    void refresh();
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(() => { if (watching.current) void refresh(); }, 1000);
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    // accept reads callbacks through a ref; polling must not restart on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.ready]);

  useEffect(() => {
    if (!isRecording || Capacitor.isNativePlatform()) return;
    const interval = window.setInterval(() => setRecordingSeconds(Math.max(0, Math.floor((Date.now() - started.current) / 1000))), 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    if (busy.current || isRecording) return;
    busy.current = true; setRecordingBusy(true); setRecordingError("");
    const session = { className: options.className, classItemId: options.classItemId, name: options.name, notes: options.notes };
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await microphone.status();
        const granted = permission.permission === "granted" ? permission : await microphone.requestPermissions();
        if (granted.permission !== "granted") throw new Error("Please allow microphone access to record a class.");
        accept(await microphone.startRecording(session));
      } else {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("Audio recording is not available in this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        webStream.current = stream;
        const recorder = new MediaRecorder(stream); const chunks: Blob[] = [];
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => setRecordingError("Recording was interrupted. Any captured audio will be saved.");
        recorder.onstop = () => {
          const duration = Math.max(0, Math.floor((Date.now() - started.current) / 1000));
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          if (blob.size) callbacks.current.onSaved({ ...session, id: Date.now(), duration, url: URL.createObjectURL(blob) });
          stream.getTracks().forEach(track => track.stop()); webStream.current = null; webRecorder.current = null;
          setIsRecording(false); setRecordingSeconds(0); callbacks.current.onFinished();
        };
        webRecorder.current = recorder; recorder.start(); started.current = Date.now(); setRecordingSeconds(0); setIsRecording(true);
      }
    } catch (error) {
      webStream.current?.getTracks().forEach(track => track.stop()); webStream.current = null;
      setRecordingError(error instanceof Error ? error.message : "Could not start recording.");
    } finally { busy.current = false; setRecordingBusy(false); }
  };
  const stopRecording = async () => {
    if (busy.current) return;
    busy.current = true; setRecordingBusy(true);
    try {
      if (Capacitor.isNativePlatform()) { accept(await microphone.stopRecording()); callbacks.current.onFinished(); }
      else if (webRecorder.current && webRecorder.current.state !== "inactive") webRecorder.current.stop();
    } catch (error) { setRecordingError(error instanceof Error ? error.message : "Could not stop recording. Try again."); }
    finally { busy.current = false; setRecordingBusy(false); }
  };
  return { isRecording, recordingSeconds, recordingError, recordingBusy, startRecording, stopRecording };
}
