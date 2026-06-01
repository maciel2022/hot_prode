// Vibrant colors inspired by the World Cup 2026 reference
export const GROUP_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#E63946", text: "#fff" },
  B: { bg: "#2A9D8F", text: "#fff" },
  C: { bg: "#457B9D", text: "#fff" },
  D: { bg: "#7B2D8E", text: "#fff" },
  E: { bg: "#E9C46A", text: "#1a1a1a" },
  F: { bg: "#F4A261", text: "#1a1a1a" },
  G: { bg: "#264653", text: "#fff" },
  H: { bg: "#06D6A0", text: "#1a1a1a" },
  I: { bg: "#EF476F", text: "#fff" },
  J: { bg: "#118AB2", text: "#fff" },
  K: { bg: "#8338EC", text: "#fff" },
  L: { bg: "#FF6B35", text: "#fff" },
};

export const KNOCKOUT_STAGES = [
  { key: "ROUND_OF_32", label: "roundOf32", bg: "#2A9D8F", text: "#fff" },
  { key: "ROUND_OF_16", label: "roundOf16", bg: "#E63946", text: "#fff" },
  { key: "QUARTER", label: "quarters", bg: "#8338EC", text: "#fff" },
  { key: "SEMI", label: "semis", bg: "#118AB2", text: "#fff" },
  { key: "THIRD_PLACE", label: "thirdPlace", bg: "#F4A261", text: "#1a1a1a" },
  { key: "FINAL", label: "final", bg: "#FFD700", text: "#1a1a1a" },
] as const;

export const STAGE_COLORS = Object.fromEntries(
  KNOCKOUT_STAGES.map((s) => [s.key, s.bg])
) as Record<string, string>;
