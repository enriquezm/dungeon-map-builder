import {
  BlueprintJSON,
  DeserializeResult,
  GridState,
  Orientation,
  SerializedTile,
} from "./types";
import { TileRegistry } from "./tile-registry";
import { GridStateImpl } from "./grid-state";

const CURRENT_VERSION = 1;
const VALID_ORIENTATIONS: readonly number[] = [0, 90, 180, 270];
const VALID_TYPES: readonly string[] = ["room", "hallway"];
const MIN_GRID_SIZE = 20;
const MAX_GRID_SIZE = 100;

/**
 * Serializes GridState to BlueprintJSON and deserializes BlueprintJSON back to GridState.
 * Validates all fields during deserialization and returns descriptive errors on failure.
 */
export class BlueprintSerializer {
  /**
   * Serializes the current grid state into a BlueprintJSON object.
   * Iterates all placed tiles and looks up their type from the registry.
   */
  serialize(state: GridState, registry: TileRegistry): BlueprintJSON {
    const config = state.getConfig();
    const tiles = state.getAllTiles();

    const serializedTiles: SerializedTile[] = tiles.map((tile) => {
      const definition = registry.getById(tile.definitionId);
      const type = definition ? definition.type : "room";

      return {
        col: tile.col,
        row: tile.row,
        type,
        variationId: tile.definitionId,
        orientation: tile.orientation,
      };
    });

    return {
      version: CURRENT_VERSION,
      grid: { cols: config.cols, rows: config.rows },
      tiles: serializedTiles,
    };
  }

  /**
   * Deserializes unknown JSON input into a GridState.
   * Validates structure, field types, value ranges, and registry membership.
   * Returns a descriptive error on any validation failure.
   */
  deserialize(json: unknown, registry: TileRegistry): DeserializeResult {
    // 1. Validate json is an object
    if (json === null || typeof json !== "object" || Array.isArray(json)) {
      return { success: false, error: "Invalid JSON: expected an object" };
    }

    const data = json as Record<string, unknown>;

    // 2. Check version field
    if (!("version" in data)) {
      return { success: false, error: "Missing required field: version" };
    }
    if (typeof data.version !== "number") {
      return { success: false, error: "Field 'version' must be a number" };
    }
    if (data.version !== CURRENT_VERSION) {
      return {
        success: false,
        error: `Unsupported version: ${data.version}. Expected version ${CURRENT_VERSION}`,
      };
    }

    // 3. Check grid field
    if (!("grid" in data)) {
      return { success: false, error: "Missing required field: grid" };
    }
    if (data.grid === null || typeof data.grid !== "object" || Array.isArray(data.grid)) {
      return { success: false, error: "Field 'grid' must be an object with cols and rows" };
    }

    const grid = data.grid as Record<string, unknown>;

    if (typeof grid.cols !== "number") {
      return { success: false, error: "Field 'grid.cols' must be a number" };
    }
    if (typeof grid.rows !== "number") {
      return { success: false, error: "Field 'grid.rows' must be a number" };
    }
    if (grid.cols < MIN_GRID_SIZE || grid.cols > MAX_GRID_SIZE) {
      return {
        success: false,
        error: `Field 'grid.cols' must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}, got ${grid.cols}`,
      };
    }
    if (grid.rows < MIN_GRID_SIZE || grid.rows > MAX_GRID_SIZE) {
      return {
        success: false,
        error: `Field 'grid.rows' must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}, got ${grid.rows}`,
      };
    }

    // 4. Check tiles is an array
    if (!("tiles" in data)) {
      return { success: false, error: "Missing required field: tiles" };
    }
    if (!Array.isArray(data.tiles)) {
      return { success: false, error: "Field 'tiles' must be an array" };
    }

    // 5. Validate each tile
    const tiles = data.tiles as unknown[];
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      if (tile === null || typeof tile !== "object" || Array.isArray(tile)) {
        return { success: false, error: `Tile at index ${i}: must be an object` };
      }

      const t = tile as Record<string, unknown>;

      // col
      if (typeof t.col !== "number") {
        return { success: false, error: `Tile at index ${i}: 'col' must be a number` };
      }

      // row
      if (typeof t.row !== "number") {
        return { success: false, error: `Tile at index ${i}: 'row' must be a number` };
      }

      // type
      if (!VALID_TYPES.includes(t.type as string)) {
        return {
          success: false,
          error: `Tile at index ${i}: 'type' must be "room" or "hallway"`,
        };
      }

      // variationId
      if (typeof t.variationId !== "string" || t.variationId.trim() === "") {
        return {
          success: false,
          error: `Tile at index ${i}: 'variationId' must be a non-empty string`,
        };
      }

      // Check variationId exists in registry
      if (!registry.getById(t.variationId)) {
        return {
          success: false,
          error: `Tile at index ${i}: unknown variationId "${t.variationId}"`,
        };
      }

      // orientation
      if (!VALID_ORIENTATIONS.includes(t.orientation as number)) {
        return {
          success: false,
          error: `Tile at index ${i}: 'orientation' must be one of 0, 90, 180, 270`,
        };
      }
    }

    // 6. All valid — create GridStateImpl and place tiles
    const gridConfig = { cols: grid.cols as number, rows: grid.rows as number };
    const state = new GridStateImpl(gridConfig, registry);

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i] as Record<string, unknown>;
      const result = state.placeTile(
        t.col as number,
        t.row as number,
        t.variationId as string,
        t.orientation as Orientation
      );

      if (!result.success) {
        return {
          success: false,
          error: `Tile at index ${i}: placement failed (${result.reason})`,
        };
      }
    }

    return { success: true, state };
  }
}
