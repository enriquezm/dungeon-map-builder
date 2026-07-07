import { TileDefinition, ValidationResult, Side } from "./types";

const VALID_SIDES: Side[] = ["top", "right", "bottom", "left"];
const VALID_TYPES: TileDefinition["type"][] = ["room", "hallway"];

/**
 * Registry that holds validated tile definitions and provides lookup methods.
 * Invalid definitions are excluded at construction time with console errors logged.
 * Duplicate IDs are ignored with a console warning.
 */
export class TileRegistry {
  private definitions: TileDefinition[] = [];
  private byId: Map<string, TileDefinition> = new Map();

  constructor(definitions: TileDefinition[]) {
    for (const def of definitions) {
      const result = this.validate(def);

      if (!result.valid) {
        console.error(
          `TileRegistry: Excluding invalid tile definition (id="${def.id ?? "undefined"}"): ${result.errors.join(", ")}`
        );
        continue;
      }

      if (this.byId.has(def.id)) {
        console.warn(
          `TileRegistry: Duplicate tile id "${def.id}" ignored.`
        );
        continue;
      }

      this.definitions.push(def);
      this.byId.set(def.id, def);
    }
  }

  /** Returns all validated tile definitions in the registry. */
  getAll(): TileDefinition[] {
    return [...this.definitions];
  }

  /** Returns all definitions matching the given type. */
  getByType(type: "room" | "hallway"): TileDefinition[] {
    return this.definitions.filter((d) => d.type === type);
  }

  /** Returns a single definition by its unique id, or undefined if not found. */
  getById(id: string): TileDefinition | undefined {
    return this.byId.get(id);
  }

  /** Validates a (possibly partial) tile definition against registry rules. */
  validate(def: Partial<TileDefinition>): ValidationResult {
    const errors: string[] = [];

    // id must be a non-empty string
    if (typeof def.id !== "string" || def.id.trim() === "") {
      errors.push("id must be a non-empty string");
    }

    // type must be "room" or "hallway"
    if (!VALID_TYPES.includes(def.type as TileDefinition["type"])) {
      errors.push('type must be either "room" or "hallway"');
    }

    // doors must be a non-empty array of valid Side values
    if (!Array.isArray(def.doors) || def.doors.length === 0) {
      errors.push("doors must be a non-empty array of valid sides");
    } else {
      const invalidDoors = def.doors.filter(
        (d) => !VALID_SIDES.includes(d as Side)
      );
      if (invalidDoors.length > 0) {
        errors.push(
          `doors contains invalid values: ${invalidDoors.join(", ")}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
