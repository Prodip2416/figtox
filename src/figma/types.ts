export type NodeType =
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "TEXT"
  | "RECTANGLE"
  | "ELLIPSE"
  | "VECTOR"
  | "BOOLEAN_OPERATION"
  | "SECTION"
  | string;

export interface FigmaNode {
  id: string;
  name: string;
  type: NodeType;
  children?: FigmaNode[];
  visible?: boolean;
}

export interface FigmaFile {
  name: string;
  document: FigmaNode;
  schemaVersion: number;
}

export interface FigmaNodesResponse {
  nodes: Record<string, { document: FigmaNode } | null>;
}
