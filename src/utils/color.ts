import type { FigmaColor } from "../figma/types.js";

function toHex(n: number): string {
  return Math.round(n * 255)
    .toString(16)
    .padStart(2, "0");
}

export function figmaColorToHex(color: FigmaColor): string {
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  if (color.a < 1) {
    return `${hex}${toHex(color.a)}`;
  }
  return hex;
}

export function figmaColorToRgba(color: FigmaColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  if (color.a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}
