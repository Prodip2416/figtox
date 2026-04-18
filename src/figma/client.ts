import type { FigmaFile, FigmaNode, FigmaNodesResponse } from "./types.js";

const BASE_URL = "https://api.figma.com/v1";

function getToken(): string {
  const token = process.env["FIGMA_TOKEN"];
  if (!token) {
    throw new Error(
      "FIGMA_TOKEN environment variable is not set. " +
        "Get a token at: Figma → Settings → Personal access tokens.",
    );
  }
  return token;
}

async function figmaFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Figma API error ${res.status} ${res.statusText}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getFile(fileKey: string): Promise<FigmaFile> {
  return figmaFetch<FigmaFile>(`/files/${encodeURIComponent(fileKey)}`);
}

export async function getNode(
  fileKey: string,
  nodeId: string,
): Promise<FigmaNode> {
  const data = await figmaFetch<FigmaNodesResponse>(
    `/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}`,
  );

  const entry = data.nodes[nodeId];
  if (!entry) {
    throw new Error(`Node "${nodeId}" not found in file "${fileKey}".`);
  }
  return entry.document;
}
