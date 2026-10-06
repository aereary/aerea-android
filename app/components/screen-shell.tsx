"use client";

export function ScreenIntro({
  label,
  title,
  copy,
  sticker,
  onStickerClick,
}: {
  label: string;
  title: string;
  copy: string;
  sticker: string;
  onStickerClick?: () => void;
}) {
  return (
    <header className="screen-intro">
      <div>
        <p className="tiny-label">{label}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <span
        className="screen-sticker"
        role={onStickerClick ? "button" : undefined}
        tabIndex={onStickerClick ? 0 : undefined}
        aria-label={onStickerClick ? "Open daily health routine" : undefined}
        onClick={onStickerClick}
        onKeyDown={(event) => {
          if (
            onStickerClick &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            onStickerClick();
          }
        }}
      >
        {sticker}
      </span>
    </header>
  );
}

export function SpaceCard({
  title,
  subtitle,
  color,
  icon,
  note,
  onClick,
}: {
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button className={`space-card ${color}`} onClick={onClick}>
      <span className="space-icon">{icon}</span>
      <span className="space-copy">
        <small>{subtitle}</small>
        <strong>{title}</strong>
        <i>{note}</i>
      </span>
      <span className="space-arrow">→</span>
    </button>
  );
}

export function InnerHeader({
  label,
  title,
  onBack,
}: {
  label: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="inner-header">
      <button onClick={onBack}>←</button>
      <div>
        <p className="tiny-label">{label}</p>
        <h2>{title}</h2>
      </div>
    </header>
  );
}
