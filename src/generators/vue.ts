import type { FigmaNode } from "../figma/types.js";
import { extractCss, type StyleObject } from "../extractors/css.js";
import { generateCssFile } from "./css.js";
import { styleObjectToTailwindClasses } from "./tailwind.js";
import { toBemBlock, toBemElement, toPascalCase } from "../utils/naming.js";
import { formatVue } from "../utils/format.js";

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
  rules: Rule[],
): string {
  if (node.visible === false) return "";

  const cls = depth === 0 ? blockClass : toBemElement(blockClass, node.name);
  rules.push({ selector: cls, style: extractCss(node) });

  const tag = nodeToTag(node);
  const text = node.type === "TEXT" && node.characters ? node.characters : "";
  const inner =
    text ||
    (node.children ?? [])
      .map((c) => walkCss(c, blockClass, depth + 1, rules))
      .join("\n");

  const styleRef = `$style['${cls}']`;
  if (!inner) return `<${tag} :class="${styleRef}" />`;
  return `<${tag} :class="${styleRef}">${inner}</${tag}>`;
}

function walkTailwind(node: FigmaNode): string {
  if (node.visible === false) return "";

  const classes = styleObjectToTailwindClasses(extractCss(node));
  const tag = nodeToTag(node);
  const text = node.type === "TEXT" && node.characters ? node.characters : "";
  const inner = text || (node.children ?? []).map(walkTailwind).join("\n");

  if (!inner) return `<${tag} class="${classes}" />`;
  return `<${tag} class="${classes}">${inner}</${tag}>`;
}

export async function generateVue(
  node: FigmaNode,
  styling: Styling = "css",
): Promise<{ vue: string }> {
  const componentName = toPascalCase(node.name) || "Component";

  if (styling === "tailwind") {
    const body = walkTailwind(node);
    const raw = `
<script setup lang="ts">
defineProps<{
  className?: string;
}>();
</script>

<template>
  <div :class="className">
    ${body}
  </div>
</template>
`;
    return { vue: await formatVue(raw) };
  }

  const blockClass = toBemBlock(node.name);
  const rules: Rule[] = [];
  const body = walkCss(node, blockClass, 0, rules);
  const cssContent = generateCssFile(rules);

  const raw = `
<script setup lang="ts">
defineProps<{
  className?: string;
}>();
</script>

<!-- ${componentName} -->
<template>
  <div :class="className">
    ${body}
  </div>
</template>

<style module>
${cssContent}
</style>
`;

  return { vue: await formatVue(raw) };
}
