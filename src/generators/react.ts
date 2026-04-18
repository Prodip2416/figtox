import type { FigmaNode } from "../figma/types.js";
import { extractCss } from "../extractors/css.js";
import { generateCssFile } from "./css.js";
import { styleObjectToTailwindClasses } from "./tailwind.js";
import { toBemBlock, toBemElement } from "../utils/naming.js";
import { toPascalCase } from "../utils/naming.js";
import { formatTsx, formatCss } from "../utils/format.js";
import type { StyleObject } from "../extractors/css.js";

export type Styling = "css" | "tailwind";

interface Rule {
  selector: string;
  style: StyleObject;
}

function nodeToJsxTag(node: FigmaNode): string {
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
  rules: Rule[],
): string {
  if (node.visible === false) return "";

  const cls = depth === 0 ? blockClass : toBemElement(blockClass, node.name);
  rules.push({ selector: cls, style: extractCss(node) });

  const tag = nodeToJsxTag(node);
  const text = node.type === "TEXT" && node.characters ? node.characters : "";
  const inner =
    text ||
    (node.children ?? [])
      .map((c) => walkCss(c, blockClass, depth + 1, rules))
      .join("\n");

  if (!inner) return `<${tag} className={styles.${cls.replace(/-/g, "_")}} />`;
  return `<${tag} className={styles.${cls.replace(/-/g, "_")}}>${inner}</${tag}>`;
}

function walkTailwind(node: FigmaNode): string {
  if (node.visible === false) return "";

  const classes = styleObjectToTailwindClasses(extractCss(node));
  const tag = nodeToJsxTag(node);
  const text = node.type === "TEXT" && node.characters ? node.characters : "";
  const inner = text || (node.children ?? []).map(walkTailwind).join("\n");

  if (!inner) return `<${tag} className="${classes}" />`;
  return `<${tag} className="${classes}">${inner}</${tag}>`;
}

export async function generateReact(
  node: FigmaNode,
  styling: Styling = "css",
): Promise<{ tsx: string; css?: string }> {
  const componentName = toPascalCase(node.name) || "Component";

  if (styling === "tailwind") {
    const jsxBody = walkTailwind(node);
    const raw = `
interface ${componentName}Props {
  className?: string;
}

export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <div className={className}>
      ${jsxBody}
    </div>
  );
}
`;
    return { tsx: await formatTsx(raw) };
  }

  const blockClass = toBemBlock(node.name);
  const rules: Rule[] = [];
  const jsxBody = walkCss(node, blockClass, 0, rules);
  const rawCss = generateCssFile(rules);

  const raw = `
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  className?: string;
}

export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <div className={className}>
      ${jsxBody}
    </div>
  );
}
`;

  const [tsx, css] = await Promise.all([formatTsx(raw), formatCss(rawCss)]);
  return { tsx, css };
}
