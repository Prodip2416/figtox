import type { FigmaNode } from "../figma/types.js";

export interface ComponentNode {
  id: string;
  name: string;
  type: string;
  children?: ComponentNode[];
}

export function extractStructure(node: FigmaNode): ComponentNode {
  const result: ComponentNode = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (node.children && node.children.length > 0) {
    result.children = node.children
      .filter((child) => child.visible !== false)
      .map(extractStructure);
  }

  return result;
}
