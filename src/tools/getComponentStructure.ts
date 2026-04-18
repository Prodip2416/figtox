import { z } from "zod";
import { parseFigmaUrl } from "../figma/url.js";
import { getFile, getNode } from "../figma/client.js";
import { extractStructure } from "../extractors/structure.js";

export const GetComponentStructureSchema = {
  figmaUrl: z.string().url().describe("Figma file or design URL"),
};

export type GetComponentStructureInput = z.infer<
  z.ZodObject<typeof GetComponentStructureSchema>
>;

export async function handleGetComponentStructure({
  figmaUrl,
}: GetComponentStructureInput) {
  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);

  const rootNode = nodeId
    ? await getNode(fileKey, nodeId)
    : (await getFile(fileKey)).document;

  const structure = extractStructure(rootNode);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(structure, null, 2),
      },
    ],
  };
}
