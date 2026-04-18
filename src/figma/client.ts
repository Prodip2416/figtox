import type { FigmaFile, FigmaNode, FigmaNodesResponse } from "./types.js";

const BASE_URL = "https://api.figma.com/v1";
const FETCH_TIMEOUT_MS = 30_000;
const CACHE_MAX = 100;
const cache = new Map<string, unknown>();

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
  if (cache.has(path)) return cache.get(path) as T;

  const token = getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "X-Figma-Token": token },
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Figma API request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Figma API error ${res.status} ${res.statusText}: ${body}`);
  }

  const data = (await res.json()) as T;

  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(path, data);
  return data;
}

export async function getFile(fileKey: string): Promise<FigmaFile> {
  return figmaFetch<FigmaFile>(`/files/${encodeURIComponent(fileKey)}`);
}

export async function getNode(fileKey: string, nodeId: string): Promise<FigmaNode> {
  const data = await figmaFetch<FigmaNodesResponse>(
    `/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}`,
  );

  const entry = data.nodes[nodeId];
  if (!entry) {
    throw new Error(`Node "${nodeId}" not found in file "${fileKey}".`);
  }
  return entry.document;
}
