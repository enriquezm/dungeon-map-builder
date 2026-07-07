import { describe, it, expect, vi } from "vitest";
import { TileRegistry } from "../../src/core/tile-registry";
import { TileDefinition } from "../../src/core/types";

function makeDef(overrides: Partial<TileDefinition> = {}): TileDefinition {
  return {
    id: "room-1",
    type: "room",
    doors: ["top"],
    shape: { outline: "M0,0 L1,0 L1,1 L0,1 Z", fill: "#ccc" },
    ...overrides,
  };
}

describe("TileRegistry", () => {
  describe("constructor validation", () => {
    it("accepts valid definitions", () => {
      const reg = new TileRegistry([makeDef()]);
      expect(reg.getAll()).toHaveLength(1);
    });

    it("excludes definitions missing id and logs error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const def = makeDef({ id: "" });
      const reg = new TileRegistry([def]);
      expect(reg.getAll()).toHaveLength(0);
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it("excludes definitions with invalid type and logs error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const def = { ...makeDef(), type: "dungeon" as unknown as "room" };
      const reg = new TileRegistry([def]);
      expect(reg.getAll()).toHaveLength(0);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("excludes definitions with empty doors array and logs error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const def = makeDef({ doors: [] });
      const reg = new TileRegistry([def]);
      expect(reg.getAll()).toHaveLength(0);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("excludes definitions with invalid door values and logs error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const def = makeDef({ doors: ["north" as unknown as "top"] });
      const reg = new TileRegistry([def]);
      expect(reg.getAll()).toHaveLength(0);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("ignores duplicate IDs and logs warning", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const def1 = makeDef({ id: "dup" });
      const def2 = makeDef({ id: "dup", doors: ["bottom"] });
      const reg = new TileRegistry([def1, def2]);
      expect(reg.getAll()).toHaveLength(1);
      expect(reg.getById("dup")!.doors).toEqual(["top"]);
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });
  });

  describe("getAll()", () => {
    it("returns a copy of all valid definitions", () => {
      const defs = [makeDef({ id: "a" }), makeDef({ id: "b" })];
      const reg = new TileRegistry(defs);
      const all = reg.getAll();
      expect(all).toHaveLength(2);
      // Verify it's a copy
      all.pop();
      expect(reg.getAll()).toHaveLength(2);
    });
  });

  describe("getByType()", () => {
    it("filters definitions by type", () => {
      const defs = [
        makeDef({ id: "r1", type: "room" }),
        makeDef({ id: "h1", type: "hallway" }),
        makeDef({ id: "r2", type: "room" }),
      ];
      const reg = new TileRegistry(defs);
      expect(reg.getByType("room")).toHaveLength(2);
      expect(reg.getByType("hallway")).toHaveLength(1);
    });

    it("returns empty array when no definitions match", () => {
      const reg = new TileRegistry([makeDef({ id: "r1", type: "room" })]);
      expect(reg.getByType("hallway")).toEqual([]);
    });
  });

  describe("getById()", () => {
    it("returns the definition with matching id", () => {
      const def = makeDef({ id: "test-id" });
      const reg = new TileRegistry([def]);
      expect(reg.getById("test-id")).toEqual(def);
    });

    it("returns undefined for unknown id", () => {
      const reg = new TileRegistry([makeDef()]);
      expect(reg.getById("nonexistent")).toBeUndefined();
    });
  });

  describe("validate()", () => {
    it("returns valid for a correct definition", () => {
      const reg = new TileRegistry([]);
      const result = reg.validate(makeDef());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("reports missing id", () => {
      const reg = new TileRegistry([]);
      const result = reg.validate({ type: "room", doors: ["top"] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("id must be a non-empty string");
    });

    it("reports invalid type", () => {
      const reg = new TileRegistry([]);
      const result = reg.validate({ id: "x", type: "cave" as "room", doors: ["top"] });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("type"))).toBe(true);
    });

    it("reports missing doors", () => {
      const reg = new TileRegistry([]);
      const result = reg.validate({ id: "x", type: "room" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("doors"))).toBe(true);
    });

    it("reports multiple errors at once", () => {
      const reg = new TileRegistry([]);
      const result = reg.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
