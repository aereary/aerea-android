"use client";

import { registerPlugin } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import assets from "./app-icon-assets.json";
import { useBackLayer } from "./use-back-layer";

const AppIcons = registerPlugin<{
  getCurrent(): Promise<{ id: string }>;
  setIcon(options: { id: string }): Promise<{ id: string }>;
}>("AereaAppIcons");

export default function AppIconPicker() {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
      {open && (
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
                dialog.current?.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
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
      )}
    </>
  );
}
