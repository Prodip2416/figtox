import type { StyleObject } from "../extractors/css.js";

const STYLE_PROP_MAP: Record<keyof StyleObject, string> = {
  position: "position",
  top: "top",
  left: "left",
  width: "width",
  height: "height",
  backgroundColor: "background-color",
  color: "color",
  borderColor: "border-color",
  borderWidth: "border-width",
  borderStyle: "border-style",
  borderRadius: "border-radius",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  textAlign: "text-align",
  fontStyle: "font-style",
  textDecoration: "text-decoration",
  opacity: "opacity",
  boxShadow: "box-shadow",
  display: "display",
  flexDirection: "flex-direction",
  justifyContent: "justify-content",
  alignItems: "align-items",
  gap: "gap",
  paddingTop: "padding-top",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
};

const CSS_RESET = `*, *::before, *::after {\n  box-sizing: border-box;\n}`;

export function styleObjectToCssDeclarations(style: StyleObject): string {
  return (Object.entries(style) as [keyof StyleObject, string][])
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${STYLE_PROP_MAP[k]}: ${v};`)
    .join("\n");
}

export function generateCssFile(
  rules: { selector: string; style: StyleObject }[],
): string {
  const body = rules
    .filter((r) => Object.keys(r.style).length > 0)
    .map((r) => `.${r.selector} {\n${styleObjectToCssDeclarations(r.style)}\n}`)
    .join("\n\n");
  return body ? `${CSS_RESET}\n\n${body}` : CSS_RESET;
}
