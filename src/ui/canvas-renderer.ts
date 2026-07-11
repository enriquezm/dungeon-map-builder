import { GridState, Side, PlacedTile, Orientation } from "../core/types";
import { TileRegistry } from "../core/tile-registry";
import { rotateDoors } from "../core/rotation";
import { getHallwayPaths } from "../core/tile-shapes";

/** Size of each grid cell in pixels. */
const CELL_SIZE = 36;

/** Colors used for rendering. */
const COLORS = {
  gridLine: "#d0d0d0",
  emptyBorder: "#666666",
  roomFill: "#8B6914",
  hallwayFill: "#999999",
  wallStroke: "#000000",
  doorFill: "#44cc44",
  hoverOverlay: "rgba(100, 150, 255, 0.3)",
  deniedFlash: "rgba(255, 50, 50, 0.4)",
  background: "#ffffff",
} as const;

/**
 * Renders the dungeon grid and placed tiles onto an HTML5 Canvas.
 * Supports panning via view offset and cell hover highlighting.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private viewOffset = { x: 0, y: 0 };
  private hoverCell: { col: number; row: number } | null = null;
  private flashCell: { col: number; row: number } | null = null;
  private flashActive = false;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private previewTileId: string | null = null;
  private previewOrientation: Orientation = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private gridState: GridState,
    private registry: TileRegistry
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get 2D rendering context from canvas");
    }
    this.ctx = ctx;
    this.preloadImages();
  }

  /** Preloads all tile SVG images into the cache. */
  private preloadImages(): void {
    const allTiles = this.registry.getAll();
    for (const tile of allTiles) {
      if (tile.shape.outline && (tile.shape.outline.endsWith(".svg") || tile.shape.outline.startsWith("data:"))) {
        const img = new Image();
        img.src = tile.shape.outline;
        img.onload = () => this.render();
        this.imageCache.set(tile.id, img);
      }
    }
  }

  /** Renders the full grid: background, grid lines, tiles, doors, walls, and hover overlay. */
  render(): void {
    const ctx = this.ctx;
    const config = this.gridState.getConfig();
    const { cols, rows } = config;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context and apply view offset
    ctx.save();
    ctx.translate(this.viewOffset.x, this.viewOffset.y);

    // Draw grid lines
    this.drawGridLines(cols, rows);

    // Draw empty cells with border outlines
    this.drawEmptyCells(cols, rows);

    // Draw placed tiles
    this.drawPlacedTiles();

    // Draw hover highlight
    if (this.hoverCell) {
      this.drawHoverHighlight(this.hoverCell.col, this.hoverCell.row);
    }

    // Draw denied flash overlay
    if (this.flashActive && this.flashCell) {
      this.drawDeniedFlash(this.flashCell.col, this.flashCell.row);
    }

    // Restore context
    ctx.restore();
  }

  /** Sets the view offset for panning/scrolling and re-renders. */
  setViewOffset(x: number, y: number): void {
    this.viewOffset = { x, y };
    this.render();
  }

  /** Returns the current view offset. */
  getViewOffset(): { x: number; y: number } {
    return { ...this.viewOffset };
  }

  /**
   * Converts screen (client) coordinates to grid cell position.
   * Returns null if the position is outside the grid bounds.
   */
  cellAtPoint(clientX: number, clientY: number): { col: number; row: number } | null {
    const rect = this.canvas.getBoundingClientRect();

    // Account for CSS scaling: the canvas display size may differ from its internal resolution
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX - this.viewOffset.x;
    const canvasY = (clientY - rect.top) * scaleY - this.viewOffset.y;

    const col = Math.floor(canvasX / CELL_SIZE);
    const row = Math.floor(canvasY / CELL_SIZE);

    const config = this.gridState.getConfig();
    if (col < 0 || col >= config.cols || row < 0 || row >= config.rows) {
      return null;
    }

    return { col, row };
  }

  /** Sets the hover cell and re-renders to show the highlight. */
  setHoverCell(col: number, row: number): void {
    this.hoverCell = { col, row };
    this.render();
  }

  /** Sets the tile to show as a ghost preview on hover. */
  setPreviewTile(tileId: string | null, orientation: Orientation = 0): void {
    this.previewTileId = tileId;
    this.previewOrientation = orientation;
  }

  /** Clears the hover cell and re-renders. */
  clearHover(): void {
    this.hoverCell = null;
    this.render();
  }

  /** Triggers a brief red flash on the specified cell to indicate denied placement. */
  flashDenied(col: number, row: number): void {
    this.flashCell = { col, row };
    this.flashActive = true;
    this.render();

    setTimeout(() => {
      this.flashActive = false;
      this.flashCell = null;
      this.render();
    }, 300);
  }

  // --- Private rendering methods ---

  private drawGridLines(cols: number, rows: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, rows * CELL_SIZE);
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(cols * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
    }
  }

  private drawEmptyCells(cols: number, rows: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.emptyBorder;
    ctx.lineWidth = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!this.gridState.getTile(c, r)) {
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }

  private drawPlacedTiles(): void {
    const tiles = this.gridState.getAllTiles();
    for (const tile of tiles) {
      this.drawTile(tile);
    }
  }

  private drawTile(tile: PlacedTile): void {
    const ctx = this.ctx;
    const x = tile.col * CELL_SIZE;
    const y = tile.row * CELL_SIZE;

    const definition = this.registry.getById(tile.definitionId);
    if (!definition) return;

    // Try to draw from SVG image cache
    const img = this.imageCache.get(tile.definitionId);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();

      // Apply rotation around center of cell
      if (tile.orientation !== 0) {
        ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        ctx.rotate((tile.orientation * Math.PI) / 180);
        ctx.translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
        ctx.drawImage(img, 0, 0, CELL_SIZE, CELL_SIZE);
      } else {
        ctx.drawImage(img, x, y, CELL_SIZE, CELL_SIZE);
      }

      ctx.restore();
      return;
    }

    // Fallback: procedural drawing if image not loaded
    const effectiveDoors = rotateDoors(definition.doors, tile.orientation);

    if (definition.type === "hallway") {
      this.currentTileBeingDrawn = tile;
      this.drawHallwayTile(x, y, effectiveDoors);
      this.currentTileBeingDrawn = null;
    } else {
      ctx.fillStyle = COLORS.roomFill;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      this.drawWallsAndDoors(x, y, effectiveDoors);
    }
  }

  private drawWallsAndDoors(x: number, y: number, doors: Side[]): void {
    const ctx = this.ctx;
    const doorSet = new Set(doors);
    const doorInset = CELL_SIZE * 0.25;
    const doorLength = CELL_SIZE * 0.5;

    const sides: Side[] = ["top", "right", "bottom", "left"];

    for (const side of sides) {
      if (doorSet.has(side)) {
        // Draw door as a colored opening (green gap) on this side
        this.drawDoor(x, y, side, doorInset, doorLength);
      } else {
        // Draw solid wall on this side
        this.drawWall(x, y, side);
      }
    }
  }

  private drawDoor(x: number, y: number, side: Side, inset: number, length: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.doorFill;
    ctx.strokeStyle = COLORS.wallStroke;
    ctx.lineWidth = 5;

    const doorThickness = 5;

    switch (side) {
      case "top":
        // Draw wall segments on either side of the door
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + inset, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + inset + length, y);
        ctx.lineTo(x + CELL_SIZE, y);
        ctx.stroke();
        // Draw the door opening
        ctx.fillRect(x + inset, y - doorThickness / 2, length, doorThickness);
        break;
      case "bottom":
        ctx.beginPath();
        ctx.moveTo(x, y + CELL_SIZE);
        ctx.lineTo(x + inset, y + CELL_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + inset + length, y + CELL_SIZE);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
        ctx.stroke();
        ctx.fillRect(x + inset, y + CELL_SIZE - doorThickness / 2, length, doorThickness);
        break;
      case "left":
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + inset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + inset + length);
        ctx.lineTo(x, y + CELL_SIZE);
        ctx.stroke();
        ctx.fillRect(x - doorThickness / 2, y + inset, doorThickness, length);
        break;
      case "right":
        ctx.beginPath();
        ctx.moveTo(x + CELL_SIZE, y);
        ctx.lineTo(x + CELL_SIZE, y + inset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + CELL_SIZE, y + inset + length);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
        ctx.stroke();
        ctx.fillRect(x + CELL_SIZE - doorThickness / 2, y + inset, doorThickness, length);
        break;
    }
  }

  private drawWall(x: number, y: number, side: Side): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.wallStroke;
    ctx.lineWidth = 5;

    ctx.beginPath();
    switch (side) {
      case "top":
        ctx.moveTo(x, y);
        ctx.lineTo(x + CELL_SIZE, y);
        break;
      case "bottom":
        ctx.moveTo(x, y + CELL_SIZE);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
        break;
      case "left":
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + CELL_SIZE);
        break;
      case "right":
        ctx.moveTo(x + CELL_SIZE, y);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
        break;
    }
    ctx.stroke();
  }

  /**
   * Draws a hallway tile using predefined SVG path data.
   * Paths are in normalized 0-1 coordinates and scaled to CELL_SIZE.
   * Rotation is handled by transforming the canvas context.
   */
  private drawHallwayTile(x: number, y: number, doors: Side[]): void {
    const ctx = this.ctx;
    const tile = this.currentTileBeingDrawn;
    if (!tile) return;

    const definition = this.registry.getById(tile.definitionId);
    if (!definition) return;

    const paths = getHallwayPaths(definition.id);
    if (paths.walls.length === 0) return;

    ctx.save();
    ctx.translate(x, y);

    // Apply rotation around center of cell
    if (tile.orientation !== 0) {
      ctx.translate(CELL_SIZE / 2, CELL_SIZE / 2);
      ctx.rotate((tile.orientation * Math.PI) / 180);
      ctx.translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 5;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    for (const pathStr of paths.walls) {
      const path2d = this.parseNormalizedPath(pathStr);
      ctx.stroke(path2d);
    }

    ctx.restore();
  }

  /** Reference to the tile currently being drawn (set during drawTile). */
  private currentTileBeingDrawn: PlacedTile | null = null;

  /**
   * Parses a normalized path string (coordinates 0-1) and returns
   * a Path2D scaled to CELL_SIZE.
   */
  private parseNormalizedPath(pathStr: string): Path2D {
    // Scale normalized coordinates to pixel coordinates
    const scaled = pathStr.replace(/(\d+\.?\d*)/g, (match) => {
      return String(parseFloat(match) * CELL_SIZE);
    });
    return new Path2D(scaled);
  }

  private drawHoverHighlight(col: number, row: number): void {
    const ctx = this.ctx;
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;

    // Draw ghost preview of the selected tile at reduced opacity
    if (this.previewTileId) {
      const img = this.imageCache.get(this.previewTileId);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.4;

        if (this.previewOrientation !== 0) {
          ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
          ctx.rotate((this.previewOrientation * Math.PI) / 180);
          ctx.translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
          ctx.drawImage(img, 0, 0, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.drawImage(img, x, y, CELL_SIZE, CELL_SIZE);
        }

        ctx.restore();
        return;
      }
    }

    // Fallback: simple highlight overlay
    ctx.fillStyle = COLORS.hoverOverlay;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  private drawDeniedFlash(col: number, row: number): void {
    const ctx = this.ctx;
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;

    ctx.fillStyle = COLORS.deniedFlash;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  }
}
