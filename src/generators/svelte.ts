import type { FigmaNode, FigmaBoundingBox } from "../figma/types.js";
import { extractCss, type StyleObject } from "../extractors/css.js";
import { generateCssFile } from "./css.js";
import { styleObjectToTailwindClasses } from "./tailwind.js";
import { toBemBlock, toBemElement, deduplicateChildNames } from "../utils/naming.js";
import { formatTsx, formatCss } from "../utils/format.js";
import { escapeHtml } from "../utils/escape.js";

export type Styling = "css" | "tailwind";

interface Rule {
  selector: string;
  style: StyleObject;
}

function nodeToTag(node: FigmaNode): string {
  if (node.type === "TEXT") {
    const size = node.style?.fontSize ?? 16;
    if (size >= 32) return "h1";
    if (size >= 24) return "h2";
    if (size >= 20) return "h3";
    if (size >= 16) return "p";
    return "span";
  }
  return "div";
}

function walkCss(
  node: FigmaNode,
  blockClass: string,
  depth: number,
  nodeName: string,
  rules: Rule[],
  parentBbox?: FigmaBoundingBox,
  parentHasLayout?: boolean,
  indent = "",
): string {
  if (node.visible === false) return "";

  const cls = depth === 0 ? blockClass : toBemElement(blockClass, nodeName);
  rules.push({ selector: cls, style: extractCss(node, { parentBbox, inAbsoluteLayout: depth > 0 && !parentHasLayout }) });

  const tag = nodeToTag(node);
  const text = node.type === "TEXT" && node.characters ? escapeHtml(node.characters) : "";
  const hasLayout = !!(node.layoutMode && node.layoutMode !== "NONE");
  const children = node.children ?? [];
  const childNames = deduplicateChildNames(children.map((c) => c.name));
  const childIndent = indent + "  ";

  const inner =
    text ||
    children
      .map((c, i) => walkCss(c, blockClass, depth + 1, childNames[i], rules, node.absoluteBoundingBox, hasLayout, childIndent))
      .filter(Boolean)
      .join("\n");

  if (!inner) return `${indent}<${tag} class="${cls}"></${tag}>`;
  const multiline = inner.includes("\n");
  if (multiline) return `${indent}<${tag} class="${cls}">\n${inner}\n${indent}</${tag}>`;
  return `${indent}<${tag} class="${cls}">${inner.trim()}</${tag}>`;
}

function walkTailwind(
  node: FigmaNode,
  parentBbox?: FigmaBoundingBox,
  parentHasLayout?: boolean,
  indent = "",
): string {
  if (node.visible === false) return "";

  const classes = styleObjectToTailwindClasses(extractCss(node, { parentBbox, inAbsoluteLayout: !!parentBbox && !parentHasLayout }));
  const tag = nodeToTag(node);
  const text = node.type === "TEXT" && node.characters ? escapeHtml(node.characters) : "";
  const hasLayout = !!(node.layoutMode && node.layoutMode !== "NONE");
  const childIndent = indent + "  ";

  const inner =
    text ||
    (node.children ?? [])
      .map((c) => walkTailwind(c, node.absoluteBoundingBox, hasLayout, childIndent))
      .filter(Boolean)
      .join("\n");

  if (!inner) return `${indent}<${tag} class="${classes}"></${tag}>`;
  const multiline = inner.includes("\n");
  if (multiline) return `${indent}<${tag} class="${classes}">\n${inner}\n${indent}</${tag}>`;
  return `${indent}<${tag} class="${classes}">${inner.trim()}</${tag}>`;
}

export async function generateSvelte(
  node: FigmaNode,
  styling: Styling = "css",
): Promise<{ svelte: string }> {
  const scriptRaw = `export let className: string | undefined = undefined;`;
  const formattedScript = await formatTsx(`function _() { ${scriptRaw} }`).then((s) =>
    s.replace(/^function _\(\) \{\n/, "").replace(/\}\n?$/, "").trim(),
  );

  if (styling === "tailwind") {
    const body = walkTailwind(node, undefined, undefined, "  ");
    const svelte = [
      `<script lang="ts">`,
      `  ${formattedScript}`,
      `</script>`,
      ``,
      `<div class={className}>`,
      body,
      `</div>`,
    ].join("\n");
    return { svelte };
  }

  const blockClass = toBemBlock(node.name);
  const rules: Rule[] = [];
  const body = walkCss(node, blockClass, 0, node.name, rules, undefined, undefined, "  ");
  const rawCss = generateCssFile(rules);
  const formattedCss = await formatCss(rawCss);

  const svelte = [
    `<script lang="ts">`,
    `  ${formattedScript}`,
    `</script>`,
    ``,
    `<div class={className}>`,
    body,
    `</div>`,
    ``,
    `<style>`,
    formattedCss.trim(),
    `</style>`,
  ].join("\n");

  return { svelte };
}
