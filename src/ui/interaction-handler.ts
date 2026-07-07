import { CanvasRenderer } from "./canvas-renderer";
import { TilePalette } from "./tile-palette";
import { GridStateImpl } from "../core/grid-state";
import { TileRegistry } from "../core/tile-registry";

/**
 * Coordinates user interactions on the dungeon canvas.
 * Wires mouse events (click, right-click, hover, middle-click)
 * and keyboard events (R key for rotation) to the appropriate actions.
 */
export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private gridState: GridStateImpl;
  private palette: TilePalette;
  private registry: TileRegistry;

  // Bound event handlers for cleanup
  private handleClick: (e: MouseEvent) => void;
  private handleContextMenu: (e: MouseEvent) => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleMouseDown: (e: MouseEvent) => void;
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: CanvasRenderer,
    gridState: GridStateImpl,
    palette: TilePalette,
    registry: TileRegistry
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.gridState = gridState;
    this.palette = palette;
    this.registry = registry;

    // Bind handlers
    this.handleClick = this.onClick.bind(this);
    this.handleContextMenu = this.onContextMenu.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleMouseDown = this.onMouseDown.bind(this);
    this.handleKeyDown = this.onKeyDown.bind(this);

    // Wire events
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  /** Removes all event listeners for cleanup. */
  destroy(): void {
    this.canvas.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  /** Left-click: place selected tile at clicked cell, or erase if eraser is active. */
  private onClick(e: MouseEvent): void {
    const cell = this.renderer.cellAtPoint(e.clientX, e.clientY);
    if (!cell) {
      return; // Out of bounds → ignore
    }

    // Eraser mode: remove tile on click
    if (this.palette.isEraserActive()) {
      this.gridState.removeTile(cell.col, cell.row);
      this.renderer.render();
      return;
    }

    const selectedTile = this.palette.getSelectedTile();
    if (!selectedTile) {
      return; // No tile selected → ignore (req 4.5)
    }

    const orientation = this.palette.getSelectedOrientation();
    const result = this.gridState.placeTile(cell.col, cell.row, selectedTile.id, orientation);

    if (result.success) {
      this.renderer.render();
    } else {
      // Occupied or invalid → flash denied (req 4.2)
      this.renderer.flashDenied(cell.col, cell.row);
    }
  }

  /** Right-click: remove tile from clicked cell. */
  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();

    const cell = this.renderer.cellAtPoint(e.clientX, e.clientY);
    if (!cell) {
      return;
    }

    this.gridState.removeTile(cell.col, cell.row);
    this.renderer.render();
  }

  /** Hover: highlight cell under cursor with tile preview. */
  private onMouseMove(e: MouseEvent): void {
    // Update preview tile based on current selection
    const selectedTile = this.palette.getSelectedTile();
    if (selectedTile) {
      this.renderer.setPreviewTile(selectedTile.id, this.palette.getSelectedOrientation());
    } else {
      this.renderer.setPreviewTile(null);
    }

    const cell = this.renderer.cellAtPoint(e.clientX, e.clientY);
    if (cell) {
      this.renderer.setHoverCell(cell.col, cell.row);
    } else {
      this.renderer.clearHover();
    }
  }

  /** Middle-click: rotate tile in-place. */
  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 1) {
      return; // Only handle middle click
    }

    e.preventDefault();

    const cell = this.renderer.cellAtPoint(e.clientX, e.clientY);
    if (!cell) {
      return;
    }

    const rotated = this.gridState.rotateTile(cell.col, cell.row);
    if (rotated) {
      this.renderer.render();
    }
  }

  /** "R" key: rotate selected tile before placement. */
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === "r" || e.key === "R") {
      this.palette.rotateSelection();
      // Update preview orientation immediately
      const selectedTile = this.palette.getSelectedTile();
      if (selectedTile) {
        this.renderer.setPreviewTile(selectedTile.id, this.palette.getSelectedOrientation());
        this.renderer.render();
      }
    }
  }
}
