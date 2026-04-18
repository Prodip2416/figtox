import { z } from "zod";
import { parseFigmaUrl } from "../figma/url.js";
import { getFile, getNode } from "../figma/client.js";
import { generateHtml } from "../generators/html.js";
import { generateReact } from "../generators/react.js";
import { generateVue } from "../generators/vue.js";
import { toPascalCase } from "../utils/naming.js";

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
  if (framework !== "html" && framework !== "react" && framework !== "vue") {
    throw new Error(
      `Not implemented: framework="${framework}". Supported: "html", "react", "vue".`,
    );
  }

  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);

  const rootNode = nodeId
    ? await getNode(fileKey, nodeId)
    : (await getFile(fileKey)).document;

  let files: OutputFile[];

  if (framework === "react") {
    const componentName = toPascalCase(rootNode.name) || "Component";
    const result = await generateReact(rootNode, styling);
    files = [{ path: `${componentName}.tsx`, contents: result.tsx }];
    if (result.css) {
      files.push({ path: `${componentName}.module.css`, contents: result.css });
    }
  } else if (framework === "vue") {
    const componentName = toPascalCase(rootNode.name) || "Component";
    const result = await generateVue(rootNode, styling);
    files = [{ path: `${componentName}.vue`, contents: result.vue }];
  } else {
    const result = await generateHtml(rootNode, styling);
    files = [{ path: "index.html", contents: result.html }];
    if (result.css) {
      files.push({ path: "styles.css", contents: result.css });
    }
  }

  const summary = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.contents}\n\`\`\``)
    .join("\n\n");

  return {
    content: [{ type: "text" as const, text: summary }],
  };
}
