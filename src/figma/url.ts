import { z } from "zod";

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId?: string;
}

const FigmaUrlSchema = z.string().url();

/**
 * Parse a Figma URL into { fileKey, nodeId? }.
 *
 * Supports both legacy `/file/<key>/...` and current `/design/<key>/...`
 * formats. The node id is pulled from the `?node-id=` query param and
 * normalized from Figma's dashed form (`12-34`) to the API's colon form
 * (`12:34`).
 */
export function parseFigmaUrl(input: string): ParsedFigmaUrl {
  const raw = FigmaUrlSchema.parse(input);

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid Figma URL: ${raw}`);
  }

  if (!/(^|\.)figma\.com$/.test(parsed.hostname)) {
    throw new Error(`Not a figma.com URL: ${raw}`);
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  const kindIndex = segments.findIndex(
    (s) => s === "file" || s === "design" || s === "proto",
  );
  if (kindIndex === -1 || kindIndex + 1 >= segments.length) {
    throw new Error(
      `Unsupported Figma URL shape (expected /file|/design|/proto/<key>/...): ${raw}`,
    );
  }

  const fileKey = segments[kindIndex + 1];
  if (!fileKey) {
    throw new Error(`Missing fileKey in Figma URL: ${raw}`);
  }

  const rawNodeId = parsed.searchParams.get("node-id") ?? undefined;
  const nodeId = rawNodeId ? rawNodeId.replace(/-/g, ":") : undefined;

  return { fileKey, nodeId };
}
