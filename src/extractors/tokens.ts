import type { FigmaNode } from "../figma/types.js";
import { figmaColorToHex } from "../utils/color.js";
import { toKebabCase } from "../utils/naming.js";

export interface DesignTokens {
  colors: Record<string, string>;
  fontSizes: Record<string, string>;
  fontWeights: Record<string, string>;
  fontFamilies: Record<string, string>;
  spacing: Record<string, string>;
}

export function extractTokens(root: FigmaNode): DesignTokens {
  const colorSet = new Map<string, string>();
  const fontSizes = new Set<number>();
  const fontWeights = new Set<number>();
  const fontFamilies = new Set<string>();
  const spacingValues = new Set<number>();

  function walk(node: FigmaNode): void {
    if (node.visible === false) return;

    for (const fill of node.fills ?? []) {
      if (fill.type === "SOLID" && fill.visible !== false && fill.color) {
        const hex = figmaColorToHex(fill.color);
        if (!colorSet.has(hex)) colorSet.set(hex, node.name);
      }
    }

    if (node.type === "TEXT" && node.style) {
      if (node.style.fontSize) fontSizes.add(node.style.fontSize);
      if (node.style.fontWeight) fontWeights.add(node.style.fontWeight);
      if (node.style.fontFamily) fontFamilies.add(node.style.fontFamily);
    }

    if (node.layoutMode && node.layoutMode !== "NONE") {
      const vals = [
        node.itemSpacing,
        node.paddingTop,
        node.paddingRight,
        node.paddingBottom,
        node.paddingLeft,
      ];
      for (const v of vals) {
        if (v && v > 0) spacingValues.add(v);
      }
    }

    for (const child of node.children ?? []) walk(child);
  }

  walk(root);

  const colors: Record<string, string> = {};
  for (const [hex, nodeName] of colorSet) {
    const slug = toKebabCase(nodeName) || hex.slice(1);
    const key = `color-${slug}`;
    colors[colors[key] ? `color-${hex.slice(1)}` : key] = hex;
  }

  const fontSizeTokens: Record<string, string> = {};
  for (const s of [...fontSizes].sort((a, b) => a - b)) {
    fontSizeTokens[`font-size-${s}`] = `${s}px`;
  }

  const fontWeightTokens: Record<string, string> = {};
  for (const w of [...fontWeights].sort((a, b) => a - b)) {
    fontWeightTokens[`font-weight-${w}`] = String(w);
  }

  const fontFamilyTokens: Record<string, string> = {};
  for (const f of fontFamilies) {
    fontFamilyTokens[`font-family-${toKebabCase(f)}`] = `'${f}', sans-serif`;
  }

  const spacingTokens: Record<string, string> = {};
  for (const v of [...spacingValues].sort((a, b) => a - b)) {
    spacingTokens[`spacing-${v}`] = `${v}px`;
  }

  return {
    colors,
    fontSizes: fontSizeTokens,
    fontWeights: fontWeightTokens,
    fontFamilies: fontFamilyTokens,
    spacing: spacingTokens,
  };
}
