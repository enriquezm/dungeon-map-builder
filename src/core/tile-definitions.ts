import { TileDefinition } from "./types";

/**
 * Default tile definitions for the Dungeon Map Builder.
 * Each tile references an SVG asset for rendering.
 */
export const defaultTileDefinitions: TileDefinition[] = [
  // --- Rooms ---
  {
    id: "room-01",
    type: "room",
    doors: ["top", "bottom"],
    shape: { outline: "/src/assets/tiles/rooms/room-01.svg", fill: "" },
  },
  {
    id: "room-02",
    type: "room",
    doors: ["top"],
    shape: { outline: "/src/assets/tiles/rooms/room-02.svg", fill: "" },
  },
  {
    id: "room-03",
    type: "room",
    doors: ["top", "left"],
    shape: { outline: "/src/assets/tiles/rooms/room-03.svg", fill: "" },
  },
  {
    id: "room-04",
    type: "room",
    doors: ["top", "left", "right"],
    shape: { outline: "/src/assets/tiles/rooms/room-04.svg", fill: "" },
  },
  {
    id: "room-05",
    type: "room",
    doors: ["top", "bottom", "left", "right"],
    shape: { outline: "/src/assets/tiles/rooms/room-05.svg", fill: "" },
  },

  // --- Hallways ---
  {
    id: "hallway-01",
    type: "hallway",
    doors: ["top", "left"],
    shape: { outline: "/src/assets/tiles/hallways/hallway-01.svg", fill: "" },
  },
  {
    id: "hallway-02",
    type: "hallway",
    doors: ["top", "bottom"],
    shape: { outline: "/src/assets/tiles/hallways/hallway-02.svg", fill: "" },
  },
  {
    id: "hallway-03",
    type: "hallway",
    doors: ["top", "left", "right"],
    shape: { outline: "/src/assets/tiles/hallways/hallway-03.svg", fill: "" },
  },
  {
    id: "hallway-04",
    type: "hallway",
    doors: ["top", "bottom", "left", "right"],
    shape: { outline: "/src/assets/tiles/hallways/hallway-04.svg", fill: "" },
  },
];
