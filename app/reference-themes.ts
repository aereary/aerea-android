/** Four opt-in design systems. Existing theme IDs and palettes remain untouched. */
export const REFERENCE_THEME_IDS = [
  "astralnight", "blushcards", "pastellayers", "pasteljourney",
] as const;
export type ReferenceThemeId = typeof REFERENCE_THEME_IDS[number];
export function isReferenceTheme(value: string): value is ReferenceThemeId {
  return (REFERENCE_THEME_IDS as readonly string[]).includes(value);
}
export const REFERENCE_THEMES = [
  {
    id: "astralnight", name: "Astral Night",
    description: "A violet starfield, moonlit glass panels and delicate orbital controls.",
    colors: ["#292046", "#f5e8fc", "#bda1dc"] as [string, string, string],
    icon: "☾", art: "/assets/reference-themes/astralnight.svg",
    accents: ["/assets/reference-themes/astralnight.svg", "/assets/reference-themes/astralnight.svg"] as [string, string],
    charm: "moonlit days", showCharm: false, featured: true, interfaceIdea: "violet night · reference 1",
  },
  {
    id: "blushcards", name: "Blush Cards",
    description: "White space, blush card stacks, fine ink outlines and lavender pill actions.",
    colors: ["#e8aac8", "#ffffff", "#beb5e8"] as [string, string, string],
    icon: "◇", art: "/assets/reference-themes/blushcards.svg",
    accents: ["/assets/reference-themes/blushcards.svg", "/assets/reference-themes/blushcards.svg"] as [string, string],
    charm: "soft layers", showCharm: false, featured: true, interfaceIdea: "blush cards · reference 2",
  },
  {
    id: "pastellayers", name: "Pastel Layers",
    description: "Generous pink and lilac panels, stacked surfaces, circular shortcuts and flowing charts.",
    colors: ["#e99dc1", "#faf9ff", "#b8abe3"] as [string, string, string],
    icon: "▱", art: "/assets/reference-themes/pastellayers.svg",
    accents: ["/assets/reference-themes/pastellayers.svg", "/assets/reference-themes/pastellayers.svg"] as [string, string],
    charm: "your little layers", showCharm: false, featured: true, interfaceIdea: "color panels · reference 3",
  },
  {
    id: "pasteljourney", name: "Pastel Journey",
    description: "Illustrated pastel landscapes, editorial serif titles and sweeping curved surfaces.",
    colors: ["#ca85ad", "#fffafa", "#85c8e9"] as [string, string, string],
    icon: "⌁", art: "/assets/reference-themes/pasteljourney.svg",
    accents: ["/assets/reference-themes/pasteljourney.svg", "/assets/reference-themes/pasteljourney.svg"] as [string, string],
    charm: "a softer horizon", showCharm: false, featured: true, interfaceIdea: "landscape editorial · reference 4",
  },
] as const;
