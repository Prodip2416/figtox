import { z } from "zod";
import { parseFigmaUrl } from "../figma/url.js";
import { getFile, getNode } from "../figma/client.js";
import { generateHtml } from "../generators/html.js";

export const ConvertFigmaToCodeSchema = {
  figmaUrl: z.string().url().describe("Figma file or design URL"),
  framework: z
    .enum(["html", "react", "vue", "angular", "svelte"])
    .describe("Target framework"),
  styling: z.enum(["css", "tailwind"]).describe("Styling approach"),
};

export type ConvertFigmaToCodeInput = z.infer<
  z.ZodObject<typeof ConvertFigmaToCodeSchema>
>;

export interface OutputFile {
  path: string;
  contents: string;
}

export async function handleConvertFigmaToCode({
  figmaUrl,
  framework,
  styling,
}: ConvertFigmaToCodeInput) {
  if (framework !== "html" || styling !== "css") {
    throw new Error(
      `Not implemented: framework="${framework}" styling="${styling}". Only html + css is supported right now.`,
    );
  }

  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);

  const rootNode = nodeId
    ? await getNode(fileKey, nodeId)
    : (await getFile(fileKey)).document;

  const { html, css } = await generateHtml(rootNode);

  const files: OutputFile[] = [
    { path: "index.html", contents: html },
    { path: "styles.css", contents: css },
  ];

  const summary = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.contents}\n\`\`\``)
    .join("\n\n");

  return {
    content: [{ type: "text" as const, text: summary }],
  };
}
