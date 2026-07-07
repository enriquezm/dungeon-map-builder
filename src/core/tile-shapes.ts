/**
 * SVG path definitions for rendering tiles on the canvas.
 * Each path is defined in a 0-1 normalized coordinate space
 * and will be scaled to CELL_SIZE when rendered.
 *
 * Hallway designs (matching the blueprint reference):
 * - Straight: Two parallel vertical lines (passage top-to-bottom)
 * - L-corner: Two L-shaped walls forming a right-angle passage (open top + right)
 * - T-intersection: Passage open on 3 sides (top, right, bottom), closed on left
 * - Crossroad: Passage open on all 4 sides, with corner stubs
 */

export interface TileShapePaths {
  /** Array of path strings in normalized 0-1 coordinates */
  walls: string[];
}

/**
 * Returns the wall paths for a hallway given its variation ID.
 * Paths are in normalized coordinates (0 to 1).
 * Each path string represents one continuous wall segment to be stroked.
 */
export function getHallwayPaths(variationId: string): TileShapePaths {
  switch (variationId) {
    case "hallway-straight":
      // Two parallel vertical lines (left wall and right wall)
      return {
        walls: [
          "M 0.25 0 L 0.25 1",   // left wall
          "M 0.75 0 L 0.75 1",   // right wall
        ],
      };

    case "hallway-l-corner":
      // L-corner: passage opens top and right
      // Outer wall: goes along bottom edge then up left edge
      // Inner wall: goes along inner bottom then up inner left, forming the corner
      return {
        walls: [
          // Outer L (bottom-left corner, at cell edges)
          "M 0.75 1 L 0 1 L 0 0.25",
          // Inner L (inset from outer, forming the corridor)
          "M 0.75 0.75 L 0.25 0.75 L 0.25 0.25",
        ],
      };

    case "hallway-t-intersection":
      // T-intersection: passage opens top, right, bottom (closed on left)
      // Left wall: two parallel vertical lines
      // Plus horizontal stubs extending right at top and bottom
      return {
        walls: [
          // Outer left wall (at cell edge, partial height)
          "M 0 0.25 L 0 0.75",
          // Inner left wall
          "M 0.25 0.25 L 0.25 0.75",
          // Top-left corner horizontal stub (outer)
          "M 0 0.25 L 0.75 0.25",
          // Top-right vertical stub going up to edge
          "M 0.75 0.25 L 0.75 0",
          // Bottom-left corner horizontal stub (outer)
          "M 0 0.75 L 0.75 0.75",
          // Bottom-right vertical stub going down to edge
          "M 0.75 0.75 L 0.75 1",
        ],
      };

    case "hallway-crossroad":
      // 4-way crossroad: all sides open, corner wall stubs
      return {
        walls: [
          // Top-left corner
          "M 0.25 0 L 0.25 0.25 L 0 0.25",
          // Top-right corner
          "M 0.75 0 L 0.75 0.25 L 1 0.25",
          // Bottom-left corner
          "M 0.25 1 L 0.25 0.75 L 0 0.75",
          // Bottom-right corner
          "M 0.75 1 L 0.75 0.75 L 1 0.75",
        ],
      };

    default:
      return { walls: [] };
  }
}
