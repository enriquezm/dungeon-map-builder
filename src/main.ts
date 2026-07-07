import { TileRegistry } from "./core/tile-registry";
import { defaultTileDefinitions } from "./core/tile-definitions";
import { GridStateImpl } from "./core/grid-state";
import { BlueprintSerializer } from "./core/serializer";
import { CanvasRenderer } from "./ui/canvas-renderer";
import { TilePalette } from "./ui/tile-palette";
import { InteractionHandler } from "./ui/interaction-handler";
import { LocalStorageAdapter } from "./persistence/local-storage-adapter";
import { FileAdapter } from "./persistence/file-adapter";

/** Shows a toast notification message that auto-dismisses. */
function showToast(message: string, duration = 3000): void {
  const existing = document.querySelector(".toast-notification");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 20px";
  toast.style.backgroundColor = "#333";
  toast.style.color = "#fff";
  toast.style.borderRadius = "6px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  toast.style.transition = "opacity 0.3s";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Get DOM elements
  const canvas = document.getElementById("dungeon-canvas") as HTMLCanvasElement;
  const paletteContainer = document.getElementById("palette-container") as HTMLElement;
  const btnSave = document.getElementById("btn-save") as HTMLButtonElement;
  const btnLoad = document.getElementById("btn-load") as HTMLButtonElement;
  const btnExport = document.getElementById("btn-export") as HTMLButtonElement;
  const btnImport = document.getElementById("btn-import") as HTMLButtonElement;
  const btnUndo = document.getElementById("btn-undo") as HTMLButtonElement;

  // 2. Create TileRegistry
  const registry = new TileRegistry(defaultTileDefinitions);

  // 3. Create GridState
  const gridState = new GridStateImpl({ cols: 30, rows: 30 }, registry);

  // 4. Create CanvasRenderer
  const renderer = new CanvasRenderer(canvas, gridState, registry);

  // 5. Create TilePalette
  const palette = new TilePalette(paletteContainer, registry);

  // 6. Create InteractionHandler
  new InteractionHandler(canvas, renderer, gridState, palette, registry);

  // 7. Create persistence utilities
  const serializer = new BlueprintSerializer();
  const localStorageAdapter = new LocalStorageAdapter();
  const fileAdapter = new FileAdapter();

  // 8. Wire toolbar buttons

  // Save button → serialize state, save to localStorage
  btnSave.addEventListener("click", () => {
    const blueprint = serializer.serialize(gridState, registry);
    const result = localStorageAdapter.save(blueprint);
    if (result.success) {
      showToast("Layout saved successfully");
    } else {
      showToast(`Save failed: ${result.error}`);
    }
  });

  // Load button → confirm, load from localStorage, deserialize
  btnLoad.addEventListener("click", () => {
    if (!localStorageAdapter.hasSavedData()) {
      showToast("No saved layout found");
      return;
    }

    const confirmed = confirm("Load saved layout? This will replace the current canvas.");
    if (!confirmed) {
      return;
    }

    const loadResult = localStorageAdapter.load();
    if (!loadResult.success) {
      showToast(`Load failed: ${loadResult.error}`);
      return;
    }

    const deserializeResult = serializer.deserialize(loadResult.data, registry);
    if (!deserializeResult.success) {
      showToast(`Load failed: ${deserializeResult.error}`);
      return;
    }

    // Clear current state and apply loaded tiles
    gridState.clear();
    const loadedTiles = deserializeResult.state.getAllTiles();
    for (const tile of loadedTiles) {
      gridState.placeTile(tile.col, tile.row, tile.definitionId, tile.orientation);
    }
    renderer.render();
    showToast("Layout loaded successfully");
  });

  // Export button → serialize and download as file
  btnExport.addEventListener("click", () => {
    if (gridState.isEmpty()) {
      showToast("Layout is empty");
      return;
    }

    const blueprint = serializer.serialize(gridState, registry);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `dungeon-blueprint-${timestamp}.json`;
    fileAdapter.download(blueprint, filename);
  });

  // Import button → open file picker, deserialize, update state
  btnImport.addEventListener("click", () => {
    fileAdapter.openFilePicker().then((result) => {
      if (!result.success) {
        if (result.error !== "File selection cancelled") {
          showToast(`Import failed: ${result.error}`);
        }
        return;
      }

      const deserializeResult = serializer.deserialize(result.data, registry);
      if (!deserializeResult.success) {
        showToast(`Import failed: ${deserializeResult.error}`);
        return;
      }

      gridState.clear();
      const importedTiles = deserializeResult.state.getAllTiles();
      for (const tile of importedTiles) {
        gridState.placeTile(tile.col, tile.row, tile.definitionId, tile.orientation);
      }
      renderer.render();
      showToast("Layout imported successfully");
    });
  });

  // Undo button → revert last action
  btnUndo.addEventListener("click", () => {
    if (gridState.undo()) {
      renderer.render();
    } else {
      showToast("Nothing to undo");
    }
  });

  // Ctrl+Z keyboard shortcut for undo
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (gridState.undo()) {
        renderer.render();
      }
    }
  });

  // 9. Initial render
  renderer.render();
});
