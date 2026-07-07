import { PlacedTile, Orientation, GridConfig, PlaceResult, GridState } from "./types";
import { TileRegistry } from "./tile-registry";

/**
 * Sparse Map-based implementation of the GridState interface.
 * Stores placed tiles in a Map keyed by "${col},${row}" for O(1) lookup.
 */
export class GridStateImpl implements GridState {
  private tiles: Map<string, PlacedTile> = new Map();
  private readonly config: GridConfig;
  private readonly registry: TileRegistry;
  private undoStack: Map<string, PlacedTile>[] = [];

  constructor(config: GridConfig, registry: TileRegistry) {
    this.registry = registry;
    this.config = {
      cols: clamp(config.cols, 20, 100),
      rows: clamp(config.rows, 20, 100),
    };
  }

  /** Saves a snapshot of the current state to the undo stack. */
  private saveSnapshot(): void {
    this.undoStack.push(new Map(this.tiles));
  }

  /** Restores the last saved state. Returns true if undo was performed. */
  undo(): boolean {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return false;
    this.tiles = snapshot;
    return true;
  }

  placeTile(
    col: number,
    row: number,
    definitionId: string,
    orientation: Orientation
  ): PlaceResult {
    if (col < 0 || col >= this.config.cols || row < 0 || row >= this.config.rows) {
      return { success: false, reason: "out-of-bounds" };
    }

    const key = toKey(col, row);
    if (this.tiles.has(key)) {
      return { success: false, reason: "occupied" };
    }

    if (!this.registry.getById(definitionId)) {
      return { success: false, reason: "invalid-definition" };
    }

    this.saveSnapshot();
    this.tiles.set(key, { definitionId, orientation, col, row });
    return { success: true };
  }

  removeTile(col: number, row: number): boolean {
    const key = toKey(col, row);
    if (!this.tiles.has(key)) return false;
    this.saveSnapshot();
    return this.tiles.delete(key);
  }

  rotateTile(col: number, row: number): boolean {
    const key = toKey(col, row);
    const tile = this.tiles.get(key);
    if (!tile) {
      return false;
    }

    this.saveSnapshot();
    tile.orientation = ((tile.orientation + 90) % 360) as Orientation;
    return true;
  }

  getTile(col: number, row: number): PlacedTile | null {
    return this.tiles.get(toKey(col, row)) ?? null;
  }

  getAllTiles(): PlacedTile[] {
    return [...this.tiles.values()];
  }

  clear(): void {
    this.tiles.clear();
  }

  getConfig(): GridConfig {
    return { ...this.config };
  }

  isEmpty(): boolean {
    return this.tiles.size === 0;
  }
}

function toKey(col: number, row: number): string {
  return `${col},${row}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
