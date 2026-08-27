export const NATIVE_APPEARANCE_KEY = "aerea-native-appearance-v1";

export type NativeCustomTheme = {
  accent: string;
  background: string;
  highlight: string;
  art: string;
};

export type NativeAppearance = {
  appTheme: string;
  colorMode: "light" | "dark";
  customTheme?: NativeCustomTheme;
  background: string;
  themeColor: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readCustomTheme(value: unknown): NativeCustomTheme | undefined {
  if (!isRecord(value)) return undefined;
  const fields = ["accent", "background", "highlight", "art"] as const;
  if (fields.some((field) => typeof value[field] !== "string")) return undefined;
  return Object.fromEntries(fields.map((field) => [field, value[field]])) as NativeCustomTheme;
}

export function readNativeAppearance(): NativeAppearance | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(NATIVE_APPEARANCE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      typeof value.appTheme !== "string" ||
      (value.colorMode !== "light" && value.colorMode !== "dark") ||
      typeof value.background !== "string" ||
      !value.background.trim() ||
      typeof value.themeColor !== "string" ||
      !value.themeColor.trim()
    ) {
      return null;
    }
    const customTheme = readCustomTheme(value.customTheme);
    if (value.appTheme === "custom" && !customTheme) return null;
    return {
      appTheme: value.appTheme,
      colorMode: value.colorMode,
      ...(customTheme ? { customTheme } : {}),
      background: value.background,
      themeColor: value.themeColor,
    };
  } catch {
    return null;
  }
}

export function writeNativeAppearance(appearance: NativeAppearance): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      NATIVE_APPEARANCE_KEY,
      JSON.stringify({
        appTheme: appearance.appTheme,
        colorMode: appearance.colorMode,
        ...(appearance.appTheme === "custom" && appearance.customTheme
          ? { customTheme: appearance.customTheme }
          : {}),
        background: appearance.background,
        themeColor: appearance.themeColor,
      }),
    );
  } catch {
    // The authoritative AereaStorage state remains available if WebView storage fails.
  }
}
