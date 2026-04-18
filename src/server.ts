import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  GetComponentStructureSchema,
  handleGetComponentStructure,
} from "./tools/getComponentStructure.js";
import {
  ConvertFigmaToCodeSchema,
  handleConvertFigmaToCode,
} from "./tools/convertFigmaToCode.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "figtox",
    version: "0.1.0",
  });

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health check — returns 'pong'.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: "pong" }],
    }),
  );

  server.registerTool(
    "parse_figma_url",
    {
      title: "Parse Figma URL",
      description:
        "Parse a Figma file or design URL and return its fileKey and nodeId.",
      inputSchema: {
        url: z.string().url().describe("A Figma file or design URL"),
      },
    },
    async ({ url }) => {
      const { parseFigmaUrl } = await import("./figma/url.js");
      const parsed = parseFigmaUrl(url);
      return {
        content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_component_structure",
    {
      title: "Get Component Structure",
      description:
        "Fetch a Figma file or node and return its component hierarchy.",
      inputSchema: GetComponentStructureSchema,
    },
    handleGetComponentStructure,
  );

  server.registerTool(
    "convert_figma_to_code",
    {
      title: "Convert Figma to Code",
      description:
        "Convert a Figma design into production-ready HTML + CSS (more frameworks coming soon).",
      inputSchema: ConvertFigmaToCodeSchema,
    },
    handleConvertFigmaToCode,
  );

  return server;
}
