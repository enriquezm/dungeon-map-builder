/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TilePalette } from "../../src/ui/tile-palette";
import { TileRegistry } from "../../src/core/tile-registry";
import { defaultTileDefinitions } from "../../src/core/tile-definitions";
import { TileDefinition } from "../../src/core/types";

describe("TilePalette", () => {
  let container: HTMLElement;
  let registry: TileRegistry;
  let palette: TilePalette;

  beforeEach(() => {
    container = document.createElement("div");
    registry = new TileRegistry(defaultTileDefinitions);
    palette = new TilePalette(container, registry);
  });

  describe("rendering", () => {
    it("renders rooms and hallways sections with h3 headings", () => {
      const headings = container.querySelectorAll("h3");
      expect(headings.length).toBe(2);
      expect(headings[0].textContent).toBe("Rooms");
      expect(headings[1].textContent).toBe("Hallways");
    });

    it("renders all room tiles in the rooms section", () => {
      const sections = container.querySelectorAll(".tile-palette-section");
      const roomSection = sections[0];
      const roomTiles = roomSection.querySelectorAll(".tile-palette-item");
      expect(roomTiles.length).toBe(5);
    });

    it("renders all hallway tiles in the hallways section", () => {
      const sections = container.querySelectorAll(".tile-palette-section");
      const hallwaySection = sections[1];
      const hallwayTiles = hallwaySection.querySelectorAll(".tile-palette-item");
      expect(hallwayTiles.length).toBe(4);
    });

    it("renders door indicators on each tile", () => {
      const firstTile = container.querySelector(".tile-palette-item");
      const doorIndicators = firstTile?.querySelectorAll(".door-indicator");
      // room-1-top has 1 door
      expect(doorIndicators?.length).toBe(1);
    });
  });

  describe("selection", () => {
    it("starts with no tile selected", () => {
      expect(palette.getSelectedTile()).toBeNull();
    });

    it("selects a tile on click", () => {
      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click();
      expect(palette.getSelectedTile()).not.toBeNull();
      expect(palette.getSelectedTile()?.id).toBe("room-1-top");
    });

    it("adds selected class to clicked tile", () => {
      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click();
      expect(tileEl.classList.contains("selected")).toBe(true);
    });

    it("deselects previous tile when selecting a new one", () => {
      const tileEls = container.querySelectorAll(".tile-palette-item") as NodeListOf<HTMLElement>;
      tileEls[0].click();
      tileEls[1].click();

      expect(tileEls[0].classList.contains("selected")).toBe(false);
      expect(tileEls[1].classList.contains("selected")).toBe(true);
      expect(palette.getSelectedTile()?.id).toBe("room-2-top-right");
    });

    it("deselects current tile when clicking it again", () => {
      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click();
      tileEl.click();
      expect(palette.getSelectedTile()).toBeNull();
      expect(tileEl.classList.contains("selected")).toBe(false);
    });

    it("calls onSelectionChange callbacks when selection changes", () => {
      const callback = vi.fn();
      palette.onSelectionChange(callback);

      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: "room-1-top" }));
    });

    it("calls onSelectionChange with null when deselecting", () => {
      const callback = vi.fn();
      palette.onSelectionChange(callback);

      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click(); // select
      tileEl.click(); // deselect

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(null);
    });
  });

  describe("orientation", () => {
    it("starts with orientation 0", () => {
      expect(palette.getSelectedOrientation()).toBe(0);
    });

    it("rotateSelection advances orientation by 90", () => {
      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click();

      palette.rotateSelection();
      expect(palette.getSelectedOrientation()).toBe(90);

      palette.rotateSelection();
      expect(palette.getSelectedOrientation()).toBe(180);

      palette.rotateSelection();
      expect(palette.getSelectedOrientation()).toBe(270);

      palette.rotateSelection();
      expect(palette.getSelectedOrientation()).toBe(0);
    });

    it("setOrientation sets orientation directly", () => {
      palette.setOrientation(270);
      expect(palette.getSelectedOrientation()).toBe(270);
    });

    it("resets orientation to 0 when selecting a new tile", () => {
      const tileEls = container.querySelectorAll(".tile-palette-item") as NodeListOf<HTMLElement>;
      tileEls[0].click();
      palette.rotateSelection(); // now 90

      tileEls[1].click();
      expect(palette.getSelectedOrientation()).toBe(0);
    });

    it("updates door indicators when orientation changes", () => {
      // room-1-top has door on "top"; after 90° rotation, door should be on "right"
      const tileEl = container.querySelector(".tile-palette-item") as HTMLElement;
      tileEl.click();

      palette.rotateSelection(); // 90°

      const indicators = tileEl.querySelectorAll(".door-indicator");
      expect(indicators.length).toBe(1);
      // The indicator should now be positioned on the right side
      const indicator = indicators[0] as HTMLElement;
      expect(indicator.style.right).toBe("0px");
    });
  });
});
