# Dungeon Map Builder

A web-based dungeon map blueprint tool for designing grid-based dungeon layouts. Built for planning Roblox dungeon games — place rooms and hallways on a 2D grid to create floor plans before implementing them in 3D.

## Features

- **Grid-based canvas** — Place tiles on a 30×30 grid (36px per cell)
- **Room tiles** — 5 room variations with different door configurations (1-door, 2-door, 3-door, 4-door)
- **Hallway tiles** — 4 hallway variations (straight, L-corner, T-intersection, 4-way crossroad)
- **Custom SVG tiles** — All tiles rendered from SVG assets for pixel-perfect visuals
- **Rotation** — Press `R` to rotate tiles in 90° increments before placement
- **Eraser tool** — Select the eraser from the palette and click to remove tiles
- **Ghost preview** — Semi-transparent preview shows what will be placed on hover
- **Undo** — Ctrl/Cmd+Z or click the Undo button to revert actions
- **Save/Load** — Persist layouts to browser localStorage
- **Export/Import** — Download layouts as JSON files and re-import them
- **Neo brutalist UI** — Bold, high-contrast design with thick borders and hard shadows

## Tech Stack

- **TypeScript** — Strict mode, ES2020 target
- **Vite** — Dev server and production bundler
- **HTML5 Canvas** — Grid rendering and tile drawing
- **Vitest + fast-check** — Unit tests and property-based testing

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Build

```bash
npm run build
```

Outputs to `dist/` — ready to deploy as a static site.

### Test

```bash
npm test
```

## Project Structure

```
src/
├── main.ts                  # Application entry point
├── assets/tiles/
│   ├── rooms/               # Room SVGs (room-01.svg through room-05.svg)
│   └── hallways/            # Hallway SVGs (hallway-01.svg through hallway-04.svg)
├── core/
│   ├── types.ts             # Shared type definitions
│   ├── tile-registry.ts     # Tile definition registry with validation
│   ├── tile-definitions.ts  # Default tile configurations
│   ├── tile-shapes.ts       # SVG path data for procedural fallback
│   ├── grid-state.ts        # Grid state manager (sparse Map storage)
│   ├── rotation.ts          # Door rotation logic
│   └── serializer.ts        # Blueprint JSON serialization/deserialization
├── ui/
│   ├── canvas-renderer.ts   # Canvas drawing (grid, tiles, hover, flash)
│   ├── tile-palette.ts      # Tile selection palette with eraser tool
│   ├── interaction-handler.ts # Mouse/keyboard event wiring
│   └── toast.ts             # Toast notification system
└── persistence/
    ├── local-storage-adapter.ts  # Browser localStorage save/load
    └── file-adapter.ts           # File download and file picker
```

## Controls

| Action | Input |
|--------|-------|
| Place tile | Left-click on grid cell |
| Remove tile | Right-click on grid cell |
| Rotate before placement | `R` key |
| Rotate placed tile | Middle-click |
| Undo | `Ctrl+Z` / `Cmd+Z` |
| Pan (future) | Scroll / drag |

## Adding Custom Tiles

1. Create a 36×36px SVG file
2. Place it in `src/assets/tiles/rooms/` or `src/assets/tiles/hallways/`
3. Add an entry to `src/core/tile-definitions.ts`:

```typescript
{
  id: "my-tile",
  type: "room",  // or "hallway"
  doors: ["top", "right"],  // which sides have openings
  shape: { outline: "/src/assets/tiles/rooms/my-tile.svg", fill: "" },
}
```

Door values: `"top"`, `"right"`, `"bottom"`, `"left"`

## Blueprint JSON Format

Exported layouts use this structure:

```json
{
  "version": 1,
  "grid": { "cols": 30, "rows": 30 },
  "tiles": [
    {
      "col": 5,
      "row": 3,
      "type": "room",
      "variationId": "room-01",
      "orientation": 90
    }
  ]
}
```

## Deployment

This is a static site — no backend required. Deploy anywhere that serves static files:

- **Render** — Build command: `npm run build`, Publish directory: `dist`
- **Vercel** / **Netlify** — Auto-detects Vite, zero config
- **GitHub Pages** — Push `dist/` to `gh-pages` branch

## License

MIT
