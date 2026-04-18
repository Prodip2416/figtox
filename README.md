# Figtox

MCP server that converts Figma designs into production-ready front-end code.

## Setup

```bash
npm install
npm run build
```

Create `.env` from the example:

```bash
cp .env.example .env
# Add your Figma personal access token
```

Get a token: Figma → Settings → Security → Personal access tokens.

## Run

```bash
npm start        # stdio MCP server
npm run dev      # watch mode (tsx)
```

## Connect to Claude Desktop

Add to Claude Desktop MCP config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "figtox": {
      "command": "node",
      "args": ["/absolute/path/to/figtox/dist/index.js"],
      "env": {
        "FIGMA_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

## Tools

### `ping`
Health check. Returns `"pong"`.

### `parse_figma_url`
Parse a Figma URL into `fileKey` and `nodeId`.

**Input:**
```json
{ "url": "https://www.figma.com/design/ABC123/Name?node-id=1-2" }
```

**Output:**
```json
{ "fileKey": "ABC123", "nodeId": "1:2" }
```

### `get_component_structure`
Fetch a Figma node and return its component hierarchy.

**Input:**
```json
{ "figmaUrl": "https://www.figma.com/design/ABC123/Name?node-id=1-2" }
```

**Output:**
```json
{
  "id": "1:2",
  "name": "Frame",
  "type": "FRAME",
  "children": [
    { "id": "1:3", "name": "Button", "type": "COMPONENT" }
  ]
}
```

## Project Structure

```
src/
├── index.ts                      # Entry point, stdio transport
├── server.ts                     # MCP server + tool registration
├── figma/
│   ├── client.ts                 # Figma REST API (getFile, getNode)
│   ├── url.ts                    # Figma URL parser
│   └── types.ts                  # Figma node types
├── extractors/
│   └── structure.ts              # Node tree → component hierarchy
└── tools/
    └── getComponentStructure.ts  # get_component_structure handler
```

## Status

| Step | Status | Feature |
|------|--------|---------|
| 1 | ✅ | Project scaffold |
| 2 | ✅ | Minimal MCP server (stdio) |
| 3 | ✅ | Figma URL parser |
| 4 | ✅ | Figma REST client |
| 7 | ✅ | `get_component_structure` tool |
| 5–6 | ⏳ | CSS extractor + HTML/CSS generator |
| 8 | ⏳ | `convert_figma_to_code` (HTML/CSS) |
| 9–13 | ⏳ | Tailwind, React, Vue, Angular, Svelte |
| 14 | ⏳ | `extract_design_tokens` |
| 15 | ⏳ | Polish |
