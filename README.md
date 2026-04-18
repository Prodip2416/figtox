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

### `get_component_structure`
Fetch a Figma node and return its component hierarchy.

**Input:**
```json
{ "figmaUrl": "https://www.figma.com/design/ABC123/Name?node-id=1-2" }
```

### `convert_figma_to_code`
Convert a Figma design into production-ready code.

**Input:**
```json
{
  "figmaUrl": "https://www.figma.com/design/ABC123/Name?node-id=1-2",
  "framework": "react",
  "styling": "tailwind"
}
```

- `framework`: `"html"` | `"react"` | `"vue"` | `"angular"` | `"svelte"`
- `styling`: `"css"` | `"tailwind"`

**Output files by framework:**

| Framework | CSS | Tailwind |
|-----------|-----|---------|
| html | `index.html` + `styles.css` | `index.html` |
| react | `Component.tsx` + `Component.module.css` | `Component.tsx` |
| vue | `Component.vue` (with `<style module>`) | `Component.vue` |
| angular | `Component.component.ts/html/css` | `Component.component.ts` (inline template) |
| svelte | `Component.svelte` (with `<style>`) | `Component.svelte` |

### `extract_design_tokens`
Extract colors, typography, and spacing tokens from a Figma file.

**Input:**
```json
{
  "figmaUrl": "https://www.figma.com/design/ABC123/Name",
  "format": "css"
}
```

- `format`: `"css"` → `:root { --color-...: ... }` | `"tailwind"` → `tailwind.config.js` snippet

## Project Structure

```
src/
├── index.ts
├── server.ts
├── figma/
│   ├── client.ts          # REST API with in-memory cache
│   ├── url.ts             # URL parser
│   └── types.ts           # Figma node types
├── extractors/
│   ├── css.ts             # Node → StyleObject
│   ├── structure.ts       # Node tree → component hierarchy
│   └── tokens.ts          # File → design tokens
├── generators/
│   ├── html.ts            # HTML5 + BEM
│   ├── react.ts           # React functional component + TS props
│   ├── vue.ts             # Vue 3 <script setup>
│   ├── angular.ts         # Angular standalone component
│   ├── svelte.ts          # Svelte SFC
│   ├── css.ts             # StyleObject → CSS declarations
│   └── tailwind.ts        # StyleObject → Tailwind classes
├── tools/
│   ├── convertFigmaToCode.ts
│   ├── extractDesignTokens.ts
│   └── getComponentStructure.ts
└── utils/
    ├── color.ts           # RGBA → hex/rgba
    ├── format.ts          # Prettier wrappers
    └── naming.ts          # BEM / PascalCase / kebab helpers
```

## Status

| Step | Status | Feature |
|------|--------|---------|
| 1 | ✅ | Project scaffold |
| 2 | ✅ | Minimal MCP server (stdio) |
| 3 | ✅ | Figma URL parser |
| 4 | ✅ | Figma REST client + in-memory cache |
| 5 | ✅ | CSS extractor |
| 6 | ✅ | HTML + raw CSS generator |
| 7 | ✅ | `get_component_structure` tool |
| 8 | ✅ | `convert_figma_to_code` (HTML/CSS) |
| 9 | ✅ | Tailwind styling |
| 10 | ✅ | React generator |
| 11 | ✅ | Vue 3 generator |
| 12 | ✅ | Angular standalone generator |
| 13 | ✅ | Svelte generator |
| 14 | ✅ | `extract_design_tokens` |
| 15 | ✅ | Polish |
