import type { FigmaNode, FigmaPaint, FigmaBoundingBox } from "../figma/types.js";
import { figmaColorToHex, figmaColorToRgba } from "../utils/color.js";

export interface StyleObject {
  position?: string;
  top?: string;
  left?: string;
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

export interface ExtractCssOptions {
  parentBbox?: FigmaBoundingBox;
  inAbsoluteLayout?: boolean;
}

function px(n: number): string {
  return `${Math.round(n)}px`;
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
    case "MIN": return "flex-start";
    case "CENTER": return "center";
    case "MAX": return "flex-end";
    case "SPACE_BETWEEN": return "space-between";
    default: return undefined;
  }
}

function mapAlignItems(value?: string): string | undefined {
  switch (value) {
    case "MIN": return "flex-start";
    case "CENTER": return "center";
    case "MAX": return "flex-end";
    case "BASELINE": return "baseline";
    default: return undefined;
  }
}

export function extractCss(node: FigmaNode, opts: ExtractCssOptions = {}): StyleObject {
  const style: StyleObject = {};
  const bbox = node.absoluteBoundingBox;

  if (bbox) {
    style.width = px(bbox.width);
    style.height = px(bbox.height);

    if (opts.inAbsoluteLayout && opts.parentBbox) {
      style.position = "absolute";
      style.top = px(bbox.y - opts.parentBbox.y);
      style.left = px(bbox.x - opts.parentBbox.x);
    }
  }

  const hasLayout = node.layoutMode && node.layoutMode !== "NONE";
  const hasChildren = (node.children ?? []).length > 0;
  if (!hasLayout && hasChildren && !opts.inAbsoluteLayout) {
    style.position = "relative";
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
      if (node.strokeWeight) style.borderWidth = px(node.strokeWeight);
    }
  }

  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    style.borderRadius = `${px(tl)} ${px(tr)} ${px(br)} ${px(bl)}`;
  } else if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    style.borderRadius = px(node.cornerRadius);
  }

  if (node.style) {
    const t = node.style;
    if (t.fontFamily) style.fontFamily = `'${t.fontFamily}', sans-serif`;
    if (t.fontSize) style.fontSize = px(t.fontSize);
    if (t.fontWeight) style.fontWeight = String(t.fontWeight);
    if (t.lineHeightPx) style.lineHeight = px(t.lineHeightPx);
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
        const x = Math.round(e.offset?.x ?? 0);
        const y = Math.round(e.offset?.y ?? 0);
        const blur = Math.round(e.radius ?? 0);
        const spread = Math.round(e.spread ?? 0);
        return `${x}px ${y}px ${blur}px ${spread}px ${figmaColorToRgba(e.color!)}`;
      });
    if (shadows.length > 0) style.boxShadow = shadows.join(", ");
  }

  if (hasLayout) {
    style.display = "flex";
    style.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";
    const justify = mapJustifyContent(node.primaryAxisAlignItems);
    if (justify) style.justifyContent = justify;
    const align = mapAlignItems(node.counterAxisAlignItems);
    if (align) style.alignItems = align;
    if (node.itemSpacing) style.gap = px(node.itemSpacing);
    if (node.paddingTop) style.paddingTop = px(node.paddingTop);
    if (node.paddingRight) style.paddingRight = px(node.paddingRight);
    if (node.paddingBottom) style.paddingBottom = px(node.paddingBottom);
    if (node.paddingLeft) style.paddingLeft = px(node.paddingLeft);
  }

  return style;
}
