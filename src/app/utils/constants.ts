export const C = {
  bg: "#111111",
  surface: "#1A1A1A",
  surfaceHover: "#222222",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  orange: "#D4622A",
  orangeDim: "#A34D20",
  text: "#F2EDE8",
  textMuted: "#888880",
  textDim: "#555550",
  white: "#FFFFFF",
  green: "#4CAF6A",
  red: "#CC3333",
};

export const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });