import type { FigmaNode } from "../figma/types.js";
import { extractCss, type StyleObject } from "../extractors/css.js";
import { generateCssFile } from "./css.js";
import { toBemBlock, toBemElement } from "../utils/naming.js";
import { formatHtml, formatCss } from "../utils/format.js";

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

function walkNode(
  node: FigmaNode,
  blockClass: string,
  depth: number,
  rules: Rule[],
): string {
  if (node.visible === false) return "";

  const isRoot = depth === 0;
  const className = isRoot
    ? blockClass
    : toBemElement(blockClass, node.name);

  const style = extractCss(node);
  rules.push({ selector: className, style });

  const tag = nodeToTag(node);
  const content =
    node.type === "TEXT" && node.characters ? node.characters : "";

  const children = node.children ?? [];
  const inner =
    content ||
    children
      .map((child) => walkNode(child, blockClass, depth + 1, rules))
      .join("\n");

  return `<${tag} class="${className}">${inner}</${tag}>`;
}

export async function generateHtml(
  node: FigmaNode,
): Promise<{ html: string; css: string }> {
  const blockClass = toBemBlock(node.name);
  const rules: Rule[] = [];

  const rawHtml = walkNode(node, blockClass, 0, rules);
  const rawCss = generateCssFile(rules);

  const [html, css] = await Promise.all([
    formatHtml(rawHtml),
    formatCss(rawCss),
  ]);

  return { html, css };
}
