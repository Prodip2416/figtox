import type { FigmaNode, FigmaBoundingBox } from "../figma/types.js";
import { extractCss, type StyleObject } from "../extractors/css.js";
import { generateCssFile } from "./css.js";
import { styleObjectToTailwindClasses } from "./tailwind.js";
import { toBemBlock, toBemElement, toKebabCase, toPascalCase, deduplicateChildNames } from "../utils/naming.js";
import { formatTsx, formatHtml, formatCss } from "../utils/format.js";
import { escapeHtml, escapeTemplateLiteral } from "../utils/escape.js";

export type Styling = "css" | "tailwind";

interface Rule {
  selector: string;
  style: StyleObject;
}

export interface AngularOutput {
  ts: string;
  html: string;
  css?: string;
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
): string {
  if (node.visible === false) return "";

  const cls = depth === 0 ? blockClass : toBemElement(blockClass, nodeName);
  rules.push({ selector: cls, style: extractCss(node, { parentBbox, inAbsoluteLayout: depth > 0 && !parentHasLayout }) });

  const tag = nodeToTag(node);
  const text = node.type === "TEXT" && node.characters ? escapeHtml(node.characters) : "";
  const hasLayout = !!(node.layoutMode && node.layoutMode !== "NONE");
  const children = node.children ?? [];
  const childNames = deduplicateChildNames(children.map((c) => c.name));

  const inner =
    text ||
    children
      .map((c, i) => walkCss(c, blockClass, depth + 1, childNames[i], rules, node.absoluteBoundingBox, hasLayout))
      .join("\n");

  if (!inner) return `<${tag} class="${cls}"></${tag}>`;
  return `<${tag} class="${cls}">${inner}</${tag}>`;
}

function walkTailwind(
  node: FigmaNode,
  parentBbox?: FigmaBoundingBox,
  parentHasLayout?: boolean,
): string {
  if (node.visible === false) return "";

  const classes = styleObjectToTailwindClasses(extractCss(node, { parentBbox, inAbsoluteLayout: !!parentBbox && !parentHasLayout }));
  const tag = nodeToTag(node);
  const text = node.type === "TEXT" && node.characters ? escapeHtml(node.characters) : "";
  const hasLayout = !!(node.layoutMode && node.layoutMode !== "NONE");

  const inner = text || (node.children ?? []).map((c) => walkTailwind(c, node.absoluteBoundingBox, hasLayout)).join("\n");

  if (!inner) return `<${tag} class="${classes}"></${tag}>`;
  return `<${tag} class="${classes}">${inner}</${tag}>`;
}

export async function generateAngular(
  node: FigmaNode,
  styling: Styling = "css",
): Promise<AngularOutput> {
  const componentName = toPascalCase(node.name) || "Component";
  const selector = `app-${toKebabCase(node.name) || "component"}`;
  const fileName = `${componentName}.component`;

  if (styling === "tailwind") {
    const body = walkTailwind(node);
    const template = escapeTemplateLiteral(`<div [class]="className">\n${body}\n</div>`);
    const rawTs = `
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: '${selector}',
  standalone: true,
  imports: [CommonModule],
  template: \`${template}\`,
})
export class ${componentName}Component {
  @Input() className?: string;
}
`;
    return { ts: await formatTsx(rawTs), html: "" };
  }

  const blockClass = toBemBlock(node.name);
  const rules: Rule[] = [];
  const body = walkCss(node, blockClass, 0, node.name, rules);
  const rawCss = generateCssFile(rules);
  const rawHtml = `<div [class]="className">\n${body}\n</div>`;

  const rawTs = `
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: '${selector}',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './${fileName}.html',
  styleUrls: ['./${fileName}.css'],
})
export class ${componentName}Component {
  @Input() className?: string;
}
`;

  const [ts, html, css] = await Promise.all([formatTsx(rawTs), formatHtml(rawHtml), formatCss(rawCss)]);
  return { ts, html, css };
}
