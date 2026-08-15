export type PageStyle = "grid" | "lined" | "dotted" | "cornell" | "plain";
export type SketchPageSizeId =
  | "letter"
  | "legal"
  | "oficio"
  | "a4"
  | "a5"
  | "tabloid"
  | "executive";
export type SketchPageOrientation = "portrait" | "landscape";

export type SketchPaperSettings = {
  style: PageStyle;
  color: string;
  size: SketchPageSizeId;
  orientation: SketchPageOrientation;
};

export const SKETCH_PAGE_SIZES: readonly {
  id: SketchPageSizeId;
  label: string;
  measurement: string;
  widthIn: number;
  heightIn: number;
}[] = [
  { id: "letter", label: "Letter / Carta", measurement: "8½ × 11 in", widthIn: 8.5, heightIn: 11 },
  { id: "legal", label: "Legal", measurement: "8½ × 14 in", widthIn: 8.5, heightIn: 14 },
  { id: "oficio", label: "Oficio", measurement: "8½ × 13 in", widthIn: 8.5, heightIn: 13 },
  { id: "a4", label: "A4", measurement: "210 × 297 mm", widthIn: 210 / 25.4, heightIn: 297 / 25.4 },
  { id: "a5", label: "A5", measurement: "148 × 210 mm", widthIn: 148 / 25.4, heightIn: 210 / 25.4 },
  { id: "tabloid", label: "Tabloid", measurement: "11 × 17 in", widthIn: 11, heightIn: 17 },
  { id: "executive", label: "Executive", measurement: "7¼ × 10½ in", widthIn: 7.25, heightIn: 10.5 },
] as const;

export const SKETCH_PAGE_COLORS = [
  { label: "White", value: "#fffefa" },
  { label: "Ivory", value: "#fff8e9" },
  { label: "Butter", value: "#fff3bf" },
  { label: "Blush", value: "#ffe7ec" },
  { label: "Lavender", value: "#eee9ff" },
  { label: "Mint", value: "#e9f7ed" },
  { label: "Sky", value: "#e8f4ff" },
  { label: "Soft gray", value: "#eef0f2" },
] as const;

export const DEFAULT_SKETCH_PAPER: SketchPaperSettings = {
  style: "grid",
  color: "#fffefa",
  size: "letter",
  orientation: "portrait",
};

const PAGE_DESCRIPTOR_PREFIX = "aerea-paper/v1/";
const pageStyles = new Set<PageStyle>(["grid", "lined", "dotted", "cornell", "plain"]);
const pageSizeIds = new Set<SketchPageSizeId>(SKETCH_PAGE_SIZES.map((page) => page.id));

export function normalizePaperColor(value: string | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : DEFAULT_SKETCH_PAPER.color;
}

export function encodeSketchPaper(settings: SketchPaperSettings) {
  return `${PAGE_DESCRIPTOR_PREFIX}${settings.style}/${normalizePaperColor(settings.color).slice(1)}/${settings.size}/${settings.orientation}`;
}

export function decodeSketchPaper(value: string | undefined): SketchPaperSettings {
  if (value && pageStyles.has(value as PageStyle)) {
    return { ...DEFAULT_SKETCH_PAPER, style: value as PageStyle };
  }
  if (!value?.startsWith(PAGE_DESCRIPTOR_PREFIX)) return { ...DEFAULT_SKETCH_PAPER };

  const [style, color, size, orientation] = value.slice(PAGE_DESCRIPTOR_PREFIX.length).split("/");
  return {
    style: pageStyles.has(style as PageStyle) ? (style as PageStyle) : DEFAULT_SKETCH_PAPER.style,
    color: normalizePaperColor(`#${color}`),
    size: pageSizeIds.has(size as SketchPageSizeId) ? (size as SketchPageSizeId) : DEFAULT_SKETCH_PAPER.size,
    orientation: orientation === "landscape" ? "landscape" : "portrait",
  };
}

export function isValidSketchPaperDescriptor(value: string) {
  if (pageStyles.has(value as PageStyle)) return true;
  if (!value.startsWith(PAGE_DESCRIPTOR_PREFIX)) return false;
  const parts = value.slice(PAGE_DESCRIPTOR_PREFIX.length).split("/");
  const [style, color, size, orientation] = parts;
  return (
    parts.length === 4 &&
    pageStyles.has(style as PageStyle) &&
    /^[0-9a-fA-F]{6}$/.test(color || "") &&
    pageSizeIds.has(size as SketchPageSizeId) &&
    (orientation === "portrait" || orientation === "landscape")
  );
}

export function getSketchPageSize(size: SketchPageSizeId) {
  return SKETCH_PAGE_SIZES.find((page) => page.id === size) ?? SKETCH_PAGE_SIZES[0];
}

export function getSketchPageDimensions(
  size: SketchPageSizeId,
  orientation: SketchPageOrientation,
) {
  const page = getSketchPageSize(size);
  return orientation === "landscape"
    ? { widthIn: page.heightIn, heightIn: page.widthIn }
    : { widthIn: page.widthIn, heightIn: page.heightIn };
}

function paperLuminance(color: string) {
  const normalized = normalizePaperColor(color).slice(1);
  const channels = [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255);
  return channels.reduce((total, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

export function sketchPaperInkColors(color: string) {
  const dark = paperLuminance(color) < 0.42;
  return dark
    ? { rule: "rgba(255,255,255,.23)", margin: "rgba(255,174,190,.42)" }
    : { rule: "rgba(83,126,157,.19)", margin: "rgba(224,116,139,.34)" };
}

export function drawSketchPaper(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: SketchPaperSettings,
) {
  const dimensions = getSketchPageDimensions(settings.size, settings.orientation);
  const dpi = width / dimensions.widthIn;
  const colors = sketchPaperInkColors(settings.color);
  const thinLine = Math.max(1, dpi / 150);

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.fillStyle = normalizePaperColor(settings.color);
  context.fillRect(0, 0, width, height);
  context.strokeStyle = colors.rule;
  context.fillStyle = colors.rule;
  context.lineWidth = thinLine;

  if (settings.style === "grid") {
    const spacing = dpi * 0.25;
    context.beginPath();
    for (let x = spacing; x < width; x += spacing) {
      context.moveTo(Math.round(x) + 0.5, 0);
      context.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = spacing; y < height; y += spacing) {
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(width, Math.round(y) + 0.5);
    }
    context.stroke();
  }

  if (settings.style === "lined" || settings.style === "cornell") {
    const spacing = dpi * 0.32;
    const top = settings.style === "cornell" ? dpi * 1.25 : dpi * 0.55;
    context.beginPath();
    for (let y = top; y < height; y += spacing) {
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(width, Math.round(y) + 0.5);
    }
    context.stroke();
    if (settings.style === "cornell") {
      context.strokeStyle = colors.margin;
      context.lineWidth = Math.max(thinLine, dpi / 90);
      context.beginPath();
      context.moveTo(width * 0.29, 0);
      context.lineTo(width * 0.29, height);
      context.moveTo(0, top);
      context.lineTo(width, top);
      context.stroke();
    }
  }

  if (settings.style === "dotted") {
    const spacing = dpi * 0.2;
    const radius = Math.max(1, dpi / 100);
    for (let y = spacing; y < height; y += spacing) {
      for (let x = spacing; x < width; x += spacing) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  context.restore();
}
