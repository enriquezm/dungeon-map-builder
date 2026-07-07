import { Side, Orientation } from "./types";

/**
 * Rotates an array of door sides by the given orientation.
 * Uses clockwise mapping: top→right, right→bottom, bottom→left, left→top.
 * The mapping is applied (orientation / 90) times.
 */
export function rotateDoors(doors: Side[], orientation: Orientation): Side[] {
  const rotationMap: Record<Side, Side> = {
    top: "right",
    right: "bottom",
    bottom: "left",
    left: "top",
  };

  const steps = orientation / 90;
  let rotated = [...doors];
  for (let i = 0; i < steps; i++) {
    rotated = rotated.map((side) => rotationMap[side]);
  }
  return rotated;
}
