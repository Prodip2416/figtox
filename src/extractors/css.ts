import type { FigmaNode, FigmaPaint } from "../figma/types.js";
import { figmaColorToHex, figmaColorToRgba } from "../utils/color.js";

export interface StyleObject {
  width?: string;
  height?: string;
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  fontStyle?: string;
  textDecoration?: string;
  opacity?: string;
  boxShadow?: string;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

function firstVisibleSolid(paints?: FigmaPaint[]): string | undefined {
  if (!paints) return undefined;
  for (const p of paints) {
    if (p.visible === false) continue;
    if (p.type === "SOLID" && p.color) {
      const color = { ...p.color, a: p.color.a * (p.opacity ?? 1) };
      return figmaColorToHex(color);
    }
  }
  return undefined;
}

function mapJustifyContent(value?: string): string | undefined {
  switch (value) {
    case "MIN":
      return "flex-start";
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "SPACE_BETWEEN":
      return "space-between";
    default:
      return undefined;
  }
}

function mapAlignItems(value?: string): string | undefined {
  switch (value) {
    case "MIN":
      return "flex-start";
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "BASELINE":
      return "baseline";
    default:
      return undefined;
  }
}

export function extractCss(node: FigmaNode): StyleObject {
  const style: StyleObject = {};

  if (node.absoluteBoundingBox) {
    style.width = `${node.absoluteBoundingBox.width}px`;
    style.height = `${node.absoluteBoundingBox.height}px`;
  }

  const isText = node.type === "TEXT";

  if (isText) {
    const textColor = firstVisibleSolid(node.fills);
    if (textColor) style.color = textColor;
  } else {
    const bg = firstVisibleSolid(node.fills);
    if (bg) style.backgroundColor = bg;
  }

  if (node.strokes && node.strokes.length > 0) {
    const borderColor = firstVisibleSolid(node.strokes);
    if (borderColor) {
      style.borderColor = borderColor;
      style.borderStyle = "solid";
      if (node.strokeWeight) {
        style.borderWidth = `${node.strokeWeight}px`;
      }
    }
  }

  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
  } else if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    style.borderRadius = `${node.cornerRadius}px`;
  }

  if (node.style) {
    const t = node.style;
    if (t.fontFamily) style.fontFamily = `'${t.fontFamily}', sans-serif`;
    if (t.fontSize) style.fontSize = `${t.fontSize}px`;
    if (t.fontWeight) style.fontWeight = String(t.fontWeight);
    if (t.lineHeightPx) style.lineHeight = `${t.lineHeightPx}px`;
    if (t.letterSpacing) style.letterSpacing = `${t.letterSpacing}px`;
    if (t.textAlignHorizontal) {
      style.textAlign = t.textAlignHorizontal.toLowerCase().replace("justified", "justify");
    }
    if (t.italic) style.fontStyle = "italic";
    if (t.textDecoration && t.textDecoration !== "NONE") {
      style.textDecoration = t.textDecoration.toLowerCase().replace("_", "-");
    }
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    style.opacity = String(node.opacity);
  }

  if (node.effects && node.effects.length > 0) {
    const shadows = node.effects
      .filter((e) => e.visible !== false && e.type === "DROP_SHADOW" && e.color)
      .map((e) => {
        const x = e.offset?.x ?? 0;
        const y = e.offset?.y ?? 0;
        const blur = e.radius ?? 0;
        const spread = e.spread ?? 0;
        const color = figmaColorToRgba(e.color!);
        return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
      });
    if (shadows.length > 0) style.boxShadow = shadows.join(", ");
  }

  if (node.layoutMode && node.layoutMode !== "NONE") {
    style.display = "flex";
    style.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";

    const justify = mapJustifyContent(node.primaryAxisAlignItems);
    if (justify) style.justifyContent = justify;

    const align = mapAlignItems(node.counterAxisAlignItems);
    if (align) style.alignItems = align;

    if (node.itemSpacing) style.gap = `${node.itemSpacing}px`;
    if (node.paddingTop) style.paddingTop = `${node.paddingTop}px`;
    if (node.paddingRight) style.paddingRight = `${node.paddingRight}px`;
    if (node.paddingBottom) style.paddingBottom = `${node.paddingBottom}px`;
    if (node.paddingLeft) style.paddingLeft = `${node.paddingLeft}px`;
  }

  return style;
}
