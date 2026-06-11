// DiceBear avatar styles available for users
export const AVATAR_STYLES = [
  "fun-emoji",
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "bottts-neutral",
  "croodles",
  "croodles-neutral",
  "dylan",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "notionists-neutral",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
  "thumbs",
  "toon-head",
  "glass",
  "icons",
  "shapes",
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

// Build a DiceBear avatar URL
export function buildAvatarUrl(style: AvatarStyle, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

// Check if image is a DiceBear URL
export function isDiceBear(value: string): boolean {
  return value.includes("api.dicebear.com");
}

// Check if a string is an emoji (not a URL)
export function isEmoji(value: string): boolean {
  return value.length <= 8 && !value.startsWith("http");
}
