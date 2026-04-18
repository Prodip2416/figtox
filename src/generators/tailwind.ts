import type { StyleObject } from "../extractors/css.js";

const FONT_WEIGHT_MAP: Record<string, string> = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  "800": "font-extrabold",
  "900": "font-black",
};

const JUSTIFY_MAP: Record<string, string> = {
  "flex-start": "justify-start",
  center: "justify-center",
  "flex-end": "justify-end",
  "space-between": "justify-between",
};

const ALIGN_MAP: Record<string, string> = {
  "flex-start": "items-start",
  center: "items-center",
  "flex-end": "items-end",
  baseline: "items-baseline",
};

function arb(value: string): string {
  return `[${value.replace(/\s/g, "_")}]`;
}

export function styleObjectToTailwindClasses(style: StyleObject): string {
  const classes: string[] = [];

  if (style.width) classes.push(`w-${arb(style.width)}`);
  if (style.height) classes.push(`h-${arb(style.height)}`);

  if (style.backgroundColor) classes.push(`bg-${arb(style.backgroundColor)}`);
  if (style.color) classes.push(`text-${arb(style.color)}`);

  if (style.borderStyle) classes.push(`border-${style.borderStyle}`);
  if (style.borderWidth) classes.push(`border-${arb(style.borderWidth)}`);
  if (style.borderColor) classes.push(`border-${arb(style.borderColor)}`);
  if (style.borderRadius) classes.push(`rounded-${arb(style.borderRadius)}`);

  if (style.fontSize) classes.push(`text-${arb(style.fontSize)}`);
  if (style.fontWeight) {
    classes.push(FONT_WEIGHT_MAP[style.fontWeight] ?? `font-${arb(style.fontWeight)}`);
  }
  if (style.fontFamily) classes.push(`font-${arb(style.fontFamily)}`);
  if (style.lineHeight) classes.push(`leading-${arb(style.lineHeight)}`);
  if (style.letterSpacing) classes.push(`tracking-${arb(style.letterSpacing)}`);
  if (style.textAlign) classes.push(`text-${style.textAlign}`);
  if (style.fontStyle === "italic") classes.push("italic");
  if (style.textDecoration === "underline") classes.push("underline");
  if (style.textDecoration === "line-through") classes.push("line-through");

  if (style.opacity) {
    const pct = Math.round(parseFloat(style.opacity) * 100);
    classes.push(`opacity-${pct}`);
  }

  if (style.boxShadow) classes.push(`shadow-${arb(style.boxShadow)}`);

  if (style.display === "flex") {
    classes.push("flex");
    if (style.flexDirection) {
      classes.push(style.flexDirection === "row" ? "flex-row" : "flex-col");
    }
    if (style.justifyContent) {
      classes.push(JUSTIFY_MAP[style.justifyContent] ?? `justify-${arb(style.justifyContent)}`);
    }
    if (style.alignItems) {
      classes.push(ALIGN_MAP[style.alignItems] ?? `items-${arb(style.alignItems)}`);
    }
    if (style.gap) classes.push(`gap-${arb(style.gap)}`);
  }

  if (style.paddingTop) classes.push(`pt-${arb(style.paddingTop)}`);
  if (style.paddingRight) classes.push(`pr-${arb(style.paddingRight)}`);
  if (style.paddingBottom) classes.push(`pb-${arb(style.paddingBottom)}`);
  if (style.paddingLeft) classes.push(`pl-${arb(style.paddingLeft)}`);

  return classes.join(" ");
}
