/**
 * Shared type definitions for the Dungeon Map Builder.
 */

/** A side of a tile where a door/opening can be positioned. */
export type Side = "top" | "right" | "bottom" | "left";

/** Valid tile orientations in degrees (clockwise). */
export type Orientation = 0 | 90 | 180 | 270;

/** Describes the visual appearance of a tile. */
export interface ShapeDescriptor {
  /** SVG path or canvas draw instructions for the tile shape. */
  outline: string;
  /** Fill color or pattern identifier. */
  fill: string;
}

/** Defines a tile variation available in the registry. */
export interface TileDefinition {
  /** Unique identifier, e.g. "room-1-door-top". */
  id: string;
  /** Category for palette grouping. */
  type: "room" | "hallway";
  /** Openings: subset of ["top", "right", "bottom", "left"]. */
  doors: Side[];
  /** Visual rendering description. */
  shape: ShapeDescriptor;
}

/** A tile that has been placed on the grid. */
export interface PlacedTile {
  /** Reference to TileDefinition.id. */
  definitionId: string;
  /** Orientation in degrees: 0, 90, 180, or 270. */
  orientation: Orientation;
  /** Zero-indexed column position. */
  col: number;
  /** Zero-indexed row position. */
  row: number;
}

/** Configuration for the grid dimensions. */
export interface GridConfig {
  /** Grid width in cells (20–100). */
  cols: number;
  /** Grid height in cells (20–100). */
  rows: number;
}

/** Result of attempting to place a tile on the grid. */
export type PlaceResult =
  | { success: true }
  | { success: false; reason: "occupied" | "out-of-bounds" | "invalid-definition" };

/** Result of validating a tile definition. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// --- Serialization Types ---

/** The JSON format for a serialized blueprint. */
export interface BlueprintJSON {
  version: number;
  grid: { cols: number; rows: number };
  tiles: SerializedTile[];
}

/** A single tile in the serialized blueprint format. */
export interface SerializedTile {
  col: number;
  row: number;
  type: "room" | "hallway";
  variationId: string;
  orientation: 0 | 90 | 180 | 270;
}

/** Result of deserializing a blueprint. */
export type DeserializeResult =
  | { success: true; state: GridState }
  | { success: false; error: string };

/** Result of saving data. */
export type SaveResult = { success: true } | { success: false; error: string };

/** Result of loading data from localStorage. */
export type LoadResult =
  | { success: true; data: BlueprintJSON }
  | { success: false; error: string };

/** Result of loading data from a file. */
export type FileLoadResult =
  | { success: true; data: BlueprintJSON }
  | { success: false; error: string };

/**
 * Forward declaration for GridState interface used in DeserializeResult.
 * The actual implementation will be in grid-state.ts.
 */
export interface GridState {
  placeTile(col: number, row: number, definitionId: string, orientation: Orientation): PlaceResult;
  removeTile(col: number, row: number): boolean;
  rotateTile(col: number, row: number): boolean;
  getTile(col: number, row: number): PlacedTile | null;
  getAllTiles(): PlacedTile[];
  clear(): void;
  getConfig(): GridConfig;
  isEmpty(): boolean;
}
