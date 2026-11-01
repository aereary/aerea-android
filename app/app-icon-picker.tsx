"use client";


import { SheetPresence } from "./components/sheet-presence";
import { registerPlugin } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import assets from "./app-icon-assets.json";
import { useBackLayer } from "./use-back-layer";

const AppIcons = registerPlugin<{
  pickCustomImage(): Promise<{ image?: string; cancelled?: boolean }>;
  pinCustomIcon(options: { image: string }): Promise<{ status: string }>;
  getCurrent(): Promise<{ id: string }>;
  setIcon(options: { id: string }): Promise<{ id: string }>;
}>("AereaAppIcons");

export default function AppIconPicker() {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [customImage, setCustomImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ zoom: 1, x: 50, y: 50 });
  const preview = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = preview.current;
    if (!canvas || !customImage) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const size = Math.min(customImage.naturalWidth, customImage.naturalHeight) / crop.zoom;
    context.clearRect(0, 0, 512, 512);
    context.drawImage(customImage, (customImage.naturalWidth - size) * crop.x / 100, (customImage.naturalHeight - size) * crop.y / 100, size, size, 0, 0, 512, 512);
  }, [customImage, crop]);
  async function pickCustom() {
    setError(""); setMessage("");
    try {
      const result = await AppIcons.pickCustomImage();
      if (!result.image) return;
      const image = new Image();
      image.onload = () => { setCrop({ zoom: 1, x: 50, y: 50 }); setCustomImage(image); };
      image.onerror = () => setError("Couldn't open this image.");
      image.src = result.image;
    } catch { setError("Couldn't open the gallery. Custom shortcuts are available in the Android app."); }
  }
  async function pinCustom() {
    if (changing.current || !preview.current) return;
    changing.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const result = await AppIcons.pinCustomIcon({ image: preview.current.toDataURL("image/png") });
      setMessage(result.status === "updated" ? "Your custom home-screen shortcut was updated." : "Confirm Add in your launcher's prompt to place the icon on your home screen.");
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't add your custom icon."); }
    finally { changing.current = false; setBusy(false); }
  }
  const dialog = useRef<HTMLElement>(null);
  const changing = useRef(false);
  const options = [{ id: "original", label: "Original", image: assets.original }, ...assets.options];
  const label =
    options.find((icon) => icon.id === selected)?.label ?? "Your app icon";
  useBackLayer(open, () => setOpen(false), 80);

  useEffect(() => {
    let active = true;
    AppIcons.getCurrent()
      .then(({ id }) => {
        if (active) setSelected(id);
      })
      .catch(() => {
        if (active)
          setError(
            "Couldn't load the current icon. Open the picker to try again.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    void AppIcons.getCurrent()
      .then(({ id }) => {
        setSelected(id);
        setError("");
      })
      .catch(() =>
        setError(
          "Couldn't load the current icon. You can still choose one below.",
        ),
      );
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  async function choose(id: string) {
    if (changing.current || id === selected) return;
    changing.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await AppIcons.setIcon({ id });
      if (result.id !== id) throw new Error("Icon change was not applied");
      setSelected(result.id);
      setMessage(
        "App icon updated. Your home screen may take a moment to refresh.",
      );
    } catch {
      setError("Couldn't change the app icon. Please try again.");
    } finally {
      changing.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <section className="app-update-settings" aria-label="App icon">
        <div>
          <p className="tiny-label">A LITTLE PERSONAL TOUCH</p>
          <h3>App icon</h3>
          <p>{label} · choose the icon on this device.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)}>
          Choose app icon
        </button>
        {!open && error && <p role="alert">{error}</p>}
      </section>
      <SheetPresence>{open && (
        <div
          className="app-icon-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="app-icon-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-icon-title"
            aria-describedby="app-icon-description"
            tabIndex={-1}
            ref={dialog}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const buttons = Array.from(
                dialog.current?.querySelectorAll<HTMLElement>(
                  "button:not(:disabled), input:not(:disabled)",
                ) ?? [],
              );
              const first = buttons[0],
                last = buttons.at(-1);
              if (
                event.shiftKey &&
                (document.activeElement === first ||
                  document.activeElement === dialog.current)
              ) {
                event.preventDefault();
                last?.focus();
              } else if (
                !event.shiftKey &&
                (document.activeElement === last ||
                  document.activeElement === dialog.current)
              ) {
                event.preventDefault();
                first?.focus();
              }
            }}
          >
            <header>
              <div>
                <p className="tiny-label">MAKE IT YOURS</p>
                <h2 id="app-icon-title">Choose your app icon</h2>
              </div>
              <button
                type="button"
                aria-label="Close app icon picker"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>
            <p id="app-icon-description">
              A tiny favorite for your home screen and the next time you open
              aérea.
            </p>
            <div
              className="app-icon-grid"
              aria-label="Available app icons"
              aria-busy={busy}
            >
              {options.map((icon) => (
                <button
                  type="button"
                  key={icon.id}
                  data-app-icon={icon.id}
                  aria-pressed={icon.id === selected}
                  disabled={busy}
                  onClick={() => void choose(icon.id)}
                >
                  {icon.image ? (
                    <img src={`data:image/png;base64,${icon.image}`} alt="" />
                  ) : (
                    <span className="app-icon-original" aria-hidden="true">
                      á
                    </span>
                  )}
                  <span>{icon.label}</span>
                  <small>{icon.id === selected ? "Selected" : "Choose"}</small>
                </button>
              ))}
            </div>
            <section className="custom-icon-editor" aria-label="Custom home-screen icon">
              <h3>Your own image</h3>
              <p>Add a custom home-screen shortcut. Android keeps the selected built-in icon in the app drawer and on the opening screen.</p>
              <button type="button" disabled={busy} onClick={() => void pickCustom()}>Choose from gallery</button>
              {customImage && <>
                <canvas ref={preview} width={512} height={512} aria-label="Custom icon crop preview" />
                <label>Zoom<input type="range" min="1" max="3" step="0.05" value={crop.zoom} onChange={(event) => setCrop((current) => ({ ...current, zoom: Number(event.target.value) }))} /></label>
                <label>Horizontal position<input type="range" min="0" max="100" value={crop.x} onChange={(event) => setCrop((current) => ({ ...current, x: Number(event.target.value) }))} /></label>
                <label>Vertical position<input type="range" min="0" max="100" value={crop.y} onChange={(event) => setCrop((current) => ({ ...current, y: Number(event.target.value) }))} /></label>
                <button type="button" disabled={busy} onClick={() => void pinCustom()}>Add to home screen</button>
              </>}
            </section>
            <p role="status" aria-live="polite">
              {busy ? "Changing app icon…" : message}
            </p>
            {error && (
              <p className="app-icon-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}</SheetPresence>
    </>
  );
}
