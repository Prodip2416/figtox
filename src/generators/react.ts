import type { FigmaNode, FigmaBoundingBox } from "../figma/types.js";
import { extractCss, type StyleObject } from "../extractors/css.js";
import { generateCssFile } from "./css.js";
import { styleObjectToTailwindClasses } from "./tailwind.js";
import { toBemBlock, toBemElement, toPascalCase, deduplicateChildNames } from "../utils/naming.js";
import { formatTsx, formatCss } from "../utils/format.js";
import { escapeJsx } from "../utils/escape.js";

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
  nodeName: string,
  rules: Rule[],
  parentBbox?: FigmaBoundingBox,
  parentHasLayout?: boolean,
): string {
  if (node.visible === false) return "";

  const cls = depth === 0 ? blockClass : toBemElement(blockClass, nodeName);
  rules.push({ selector: cls, style: extractCss(node, { parentBbox, inAbsoluteLayout: depth > 0 && !parentHasLayout }) });

  const tag = nodeToJsxTag(node);
  const text = node.type === "TEXT" && node.characters ? escapeJsx(node.characters) : "";
  const hasLayout = !!(node.layoutMode && node.layoutMode !== "NONE");
  const children = node.children ?? [];
  const childNames = deduplicateChildNames(children.map((c) => c.name));

  const inner =
    text ||
    children
      .map((c, i) => walkCss(c, blockClass, depth + 1, childNames[i], rules, node.absoluteBoundingBox, hasLayout))
      .join("\n");

  const ref = `styles.${cls.replace(/-/g, "_")}`;
  if (!inner) return `<${tag} className={${ref}} />`;
  return `<${tag} className={${ref}}>${inner}</${tag}>`;
}

function walkTailwind(
  node: FigmaNode,
  parentBbox?: FigmaBoundingBox,
  parentHasLayout?: boolean,
): string {
  if (node.visible === false) return "";

  const classes = styleObjectToTailwindClasses(extractCss(node, { parentBbox, inAbsoluteLayout: !!parentBbox && !parentHasLayout }));
  const tag = nodeToJsxTag(node);
  const text = node.type === "TEXT" && node.characters ? escapeJsx(node.characters) : "";
  const hasLayout = !!(node.layoutMode && node.layoutMode !== "NONE");

  const inner = text || (node.children ?? []).map((c) => walkTailwind(c, node.absoluteBoundingBox, hasLayout)).join("\n");

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
interface ${componentName}Props { className?: string; }

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
  const jsxBody = walkCss(node, blockClass, 0, node.name, rules);
  const rawCss = generateCssFile(rules);

  const raw = `
import styles from './${componentName}.module.css';

interface ${componentName}Props { className?: string; }

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
