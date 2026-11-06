/** Independent, opt-in interface layouts; existing theme identities stay stable. */
export const NATIVE_THEME_IDS = ["samsungminimal", "samsungao3", "studio"] as const;
export type NativeThemeId = typeof NATIVE_THEME_IDS[number];
export function isNativeTheme(value: string): value is NativeThemeId {
  return (NATIVE_THEME_IDS as readonly string[]).includes(value);
}
export const NATIVE_THEMES = [
  {
    id: "studio", name: "aérea Studio",
    description: "Graphite panels, fine borders and quiet underlined tabs, inspired by BUG Clicker.",
    colors: ["#161616", "#212121", "#d0d0d0"] as [string, string, string],
    icon: "▤", art: "/assets/native-themes/studio.svg",
    accents: ["/assets/native-themes/studio.svg", "/assets/native-themes/studio.svg"] as [string, string],
    charm: "", showCharm: false, featured: true, interfaceIdea: "Studio panels · graphite",
  },
  {
    id: "samsungminimal", name: "Samsung Minimal",
    description: "Quiet black surfaces, compact grouped rows and simple line controls.",
    colors: ["#000000", "#171717", "#a294f9"] as [string, string, string],
    icon: "≡", art: "/assets/native-themes/samsungminimal.svg",
    accents: ["/assets/native-themes/samsungminimal.svg", "/assets/native-themes/samsungminimal.svg"] as [string, string],
    charm: "", showCharm: false, featured: true, interfaceIdea: "Grouped lists · minimal",
  },
  {
    id: "samsungao3", name: "Samsung AO3",
    description: "The same quiet layout with your pink, aqua, lavender, sage and amber palette.",
    colors: ["#131313", "#f4bfd7", "#9acbd1"] as [string, string, string],
    icon: "≡", art: "/assets/native-themes/samsungao3.svg",
    accents: ["/assets/native-themes/samsungao3.svg", "/assets/native-themes/samsungao3.svg"] as [string, string],
    charm: "", showCharm: false, featured: true, interfaceIdea: "Grouped lists · AO3 colors",
  },
] as const;
