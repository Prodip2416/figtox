import { z } from "zod";
import { parseFigmaUrl } from "../figma/url.js";
import { getFile, getNode } from "../figma/client.js";
import { extractTokens, type DesignTokens } from "../extractors/tokens.js";
import { formatCss } from "../utils/format.js";

export const ExtractDesignTokensSchema = {
  figmaUrl: z.string().url().describe("Figma file or design URL"),
  format: z
    .enum(["css", "tailwind"])
    .describe("Output format: CSS custom properties or Tailwind config snippet"),
};

export type ExtractDesignTokensInput = z.infer<
  z.ZodObject<typeof ExtractDesignTokensSchema>
>;

function tokensToCss(tokens: DesignTokens): string {
  const entries = [
    ...Object.entries(tokens.colors),
    ...Object.entries(tokens.fontSizes),
    ...Object.entries(tokens.fontWeights),
    ...Object.entries(tokens.fontFamilies),
    ...Object.entries(tokens.spacing),
  ];
  if (entries.length === 0) return ":root {}";
  const body = entries.map(([k, v]) => `  --${k}: ${v};`).join("\n");
  return `:root {\n${body}\n}`;
}

function tokensToTailwind(tokens: DesignTokens): string {
  const colors = Object.fromEntries(
    Object.entries(tokens.colors).map(([k, v]) => [k.replace("color-", ""), v]),
  );
  const fontSize = Object.fromEntries(
    Object.entries(tokens.fontSizes).map(([k, v]) => [k.replace("font-size-", ""), v]),
  );
  const fontWeight = Object.fromEntries(
    Object.entries(tokens.fontWeights).map(([k, v]) => [k.replace("font-weight-", ""), v]),
  );
  const fontFamily = Object.fromEntries(
    Object.entries(tokens.fontFamilies).map(([k, v]) => [k.replace("font-family-", ""), v]),
  );
  const spacing = Object.fromEntries(
    Object.entries(tokens.spacing).map(([k, v]) => [k.replace("spacing-", ""), v]),
  );

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: ${JSON.stringify({ colors, fontSize, fontWeight, fontFamily, spacing }, null, 6)},
  },
};`;
}

export async function handleExtractDesignTokens({
  figmaUrl,
  format,
}: ExtractDesignTokensInput) {
  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);

  const rootNode = nodeId
    ? await getNode(fileKey, nodeId)
    : (await getFile(fileKey)).document;

  const tokens = extractTokens(rootNode);
  const hasTokens =
    Object.keys(tokens.colors).length > 0 ||
    Object.keys(tokens.fontSizes).length > 0 ||
    Object.keys(tokens.spacing).length > 0;

  if (!hasTokens) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No design tokens found in this node. Try using the full file URL without a node-id.",
        },
      ],
    };
  }

  let output: string;
  if (format === "tailwind") {
    output = tokensToTailwind(tokens);
  } else {
    output = await formatCss(tokensToCss(tokens));
  }

  const ext = format === "tailwind" ? "tailwind.config.js" : "tokens.css";
  return {
    content: [
      {
        type: "text" as const,
        text: `### ${ext}\n\`\`\`\n${output}\n\`\`\``,
      },
    ],
  };
}
