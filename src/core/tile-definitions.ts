import { TileDefinition } from "./types";

// Import SVGs as URLs — Vite handles these in both dev and production builds
import room01 from "../assets/tiles/rooms/room-01.svg";
import room02 from "../assets/tiles/rooms/room-02.svg";
import room03 from "../assets/tiles/rooms/room-03.svg";
import room04 from "../assets/tiles/rooms/room-04.svg";
import room05 from "../assets/tiles/rooms/room-05.svg";
import hallway01 from "../assets/tiles/hallways/hallway-01.svg";
import hallway02 from "../assets/tiles/hallways/hallway-02.svg";
import hallway03 from "../assets/tiles/hallways/hallway-03.svg";
import hallway04 from "../assets/tiles/hallways/hallway-04.svg";

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
    shape: { outline: room01, fill: "" },
  },
  {
    id: "room-02",
    type: "room",
    doors: ["top"],
    shape: { outline: room02, fill: "" },
  },
  {
    id: "room-03",
    type: "room",
    doors: ["top", "left"],
    shape: { outline: room03, fill: "" },
  },
  {
    id: "room-04",
    type: "room",
    doors: ["top", "left", "right"],
    shape: { outline: room04, fill: "" },
  },
  {
    id: "room-05",
    type: "room",
    doors: ["top", "bottom", "left", "right"],
    shape: { outline: room05, fill: "" },
  },

  // --- Hallways ---
  {
    id: "hallway-01",
    type: "hallway",
    doors: ["top", "left"],
    shape: { outline: hallway01, fill: "" },
  },
  {
    id: "hallway-02",
    type: "hallway",
    doors: ["top", "bottom"],
    shape: { outline: hallway02, fill: "" },
  },
  {
    id: "hallway-03",
    type: "hallway",
    doors: ["top", "left", "right"],
    shape: { outline: hallway03, fill: "" },
  },
  {
    id: "hallway-04",
    type: "hallway",
    doors: ["top", "bottom", "left", "right"],
    shape: { outline: hallway04, fill: "" },
  },
];
