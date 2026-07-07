import { TileDefinition, Orientation, Side } from "../core/types";
import { TileRegistry } from "../core/tile-registry";
import { rotateDoors } from "../core/rotation";

/**
 * UI component that renders a tile palette with room and hallway sections.
 * Allows selecting tiles and rotating them before placement on the grid.
 */
export class TilePalette {
  private selectedTile: TileDefinition | null = null;
  private selectedOrientation: Orientation = 0;
  private selectionCallbacks: ((tile: TileDefinition | null) => void)[] = [];
  private selectedElement: HTMLElement | null = null;
  private tileElements: Map<string, HTMLElement> = new Map();
  private container: HTMLElement;
  private registry: TileRegistry;
  private eraserMode = false;
  private eraserElement: HTMLElement | null = null;

  constructor(container: HTMLElement, registry: TileRegistry) {
    this.container = container;
    this.registry = registry;
    this.render();
  }

  /** Returns the currently selected tile definition, or null if none selected. */
  getSelectedTile(): TileDefinition | null {
    return this.selectedTile;
  }

  /** Returns true if eraser mode is active. */
  isEraserActive(): boolean {
    return this.eraserMode;
  }

  /** Returns the current orientation for tile placement. */
  getSelectedOrientation(): Orientation {
    return this.selectedOrientation;
  }

  /** Sets the orientation directly. */
  setOrientation(orientation: Orientation): void {
    this.selectedOrientation = orientation;
    this.updateSelectedPreview();
  }

  /** Advances orientation by 90° clockwise (0→90→180→270→0). */
  rotateSelection(): void {
    this.selectedOrientation = ((this.selectedOrientation + 90) % 360) as Orientation;
    this.updateSelectedPreview();
  }

  /** Registers a callback that fires whenever the selection changes. */
  onSelectionChange(callback: (tile: TileDefinition | null) => void): void {
    this.selectionCallbacks.push(callback);
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.classList.add("tile-palette");

    // Eraser tool
    const toolsSection = document.createElement("div");
    toolsSection.classList.add("tile-palette-section");
    const toolsHeading = document.createElement("h3");
    toolsHeading.textContent = "Tools";
    toolsSection.appendChild(toolsHeading);

    const eraserEl = document.createElement("div");
    eraserEl.classList.add("tile-palette-item", "eraser-tool");
    eraserEl.style.width = "52px";
    eraserEl.style.height = "52px";
    eraserEl.style.position = "relative";
    eraserEl.style.border = "3px solid #1a1a1a";
    eraserEl.style.cursor = "pointer";
    eraserEl.style.boxSizing = "border-box";
    eraserEl.style.backgroundColor = "#ffffff";
    eraserEl.style.display = "flex";
    eraserEl.style.alignItems = "center";
    eraserEl.style.justifyContent = "center";
    eraserEl.style.fontSize = "20px";
    eraserEl.textContent = "🧹";
    eraserEl.title = "Eraser";
    eraserEl.addEventListener("click", () => this.toggleEraser(eraserEl));
    this.eraserElement = eraserEl;
    toolsSection.appendChild(eraserEl);
    this.container.appendChild(toolsSection);

    const rooms = this.registry.getByType("room");
    const hallways = this.registry.getByType("hallway");

    if (rooms.length > 0) {
      const roomSection = this.createSection("Rooms", rooms);
      this.container.appendChild(roomSection);
    }

    if (hallways.length > 0) {
      const hallwaySection = this.createSection("Hallways", hallways);
      this.container.appendChild(hallwaySection);
    }
  }

  private createSection(title: string, tiles: TileDefinition[]): HTMLElement {
    const section = document.createElement("div");
    section.classList.add("tile-palette-section");

    const heading = document.createElement("h3");
    heading.textContent = title;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.classList.add("tile-palette-grid");
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.gap = "8px";

    for (const tile of tiles) {
      const tileEl = this.createTileElement(tile);
      grid.appendChild(tileEl);
      this.tileElements.set(tile.id, tileEl);
    }

    section.appendChild(grid);
    return section;
  }

  private createTileElement(tile: TileDefinition): HTMLElement {
    const el = document.createElement("div");
    el.classList.add("tile-palette-item");
    el.style.width = "48px";
    el.style.height = "48px";
    el.style.position = "relative";
    el.style.border = "2px solid #666";
    el.style.cursor = "pointer";
    el.style.boxSizing = "border-box";
    el.style.backgroundColor = tile.type === "room" ? "#4a90d9" : "#7b68ee";

    el.dataset.tileId = tile.id;

    // Render door indicators at default orientation
    this.renderDoorIndicators(el, tile.doors);

    el.addEventListener("click", () => this.selectTile(tile, el));

    return el;
  }

  private renderDoorIndicators(el: HTMLElement, doors: Side[]): void {
    // Remove existing door indicators
    const existing = el.querySelectorAll(".door-indicator");
    existing.forEach((indicator) => indicator.remove());

    for (const side of doors) {
      const indicator = document.createElement("div");
      indicator.classList.add("door-indicator");
      indicator.style.position = "absolute";
      indicator.style.backgroundColor = "#ffd700";

      switch (side) {
        case "top":
          indicator.style.top = "0";
          indicator.style.left = "50%";
          indicator.style.transform = "translateX(-50%)";
          indicator.style.width = "12px";
          indicator.style.height = "4px";
          break;
        case "bottom":
          indicator.style.bottom = "0";
          indicator.style.left = "50%";
          indicator.style.transform = "translateX(-50%)";
          indicator.style.width = "12px";
          indicator.style.height = "4px";
          break;
        case "left":
          indicator.style.left = "0";
          indicator.style.top = "50%";
          indicator.style.transform = "translateY(-50%)";
          indicator.style.width = "4px";
          indicator.style.height = "12px";
          break;
        case "right":
          indicator.style.right = "0";
          indicator.style.top = "50%";
          indicator.style.transform = "translateY(-50%)";
          indicator.style.width = "4px";
          indicator.style.height = "12px";
          break;
      }

      el.appendChild(indicator);
    }
  }

  private selectTile(tile: TileDefinition, element: HTMLElement): void {
    // Deselect eraser if active
    if (this.eraserMode) {
      this.eraserMode = false;
      this.eraserElement?.classList.remove("selected");
    }

    // Deselect previous
    if (this.selectedElement) {
      this.selectedElement.classList.remove("selected");
    }

    // If clicking the same tile, deselect it
    if (this.selectedTile && this.selectedTile.id === tile.id) {
      this.selectedTile = null;
      this.selectedElement = null;
      this.selectedOrientation = 0;
      this.notifySelectionChange();
      return;
    }

    // Select new tile
    this.selectedTile = tile;
    this.selectedElement = element;
    this.selectedOrientation = 0;
    element.classList.add("selected");

    // Update preview to show door positions at current orientation
    this.updateSelectedPreview();
    this.notifySelectionChange();
  }

  private toggleEraser(element: HTMLElement): void {
    if (this.eraserMode) {
      // Deactivate eraser
      this.eraserMode = false;
      element.classList.remove("selected");
    } else {
      // Deselect any tile first
      if (this.selectedElement) {
        this.selectedElement.classList.remove("selected");
      }
      this.selectedTile = null;
      this.selectedElement = null;
      this.selectedOrientation = 0;

      // Activate eraser
      this.eraserMode = true;
      element.classList.add("selected");
      this.notifySelectionChange();
    }
  }

  private updateSelectedPreview(): void {
    if (!this.selectedTile || !this.selectedElement) {
      return;
    }

    // Render rotated doors on the selected tile element
    const effectiveDoors = rotateDoors(this.selectedTile.doors, this.selectedOrientation);
    this.renderDoorIndicators(this.selectedElement, effectiveDoors);
  }

  private notifySelectionChange(): void {
    for (const callback of this.selectionCallbacks) {
      callback(this.selectedTile);
    }
  }
}
