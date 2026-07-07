import { BlueprintJSON, FileLoadResult } from "../core/types";

/**
 * FileAdapter handles file-based persistence for dungeon blueprints.
 * - download(): triggers a JSON file download in the browser
 * - openFilePicker(): opens a file picker to load a JSON blueprint file
 */
export class FileAdapter {
  /**
   * Triggers a browser download of the blueprint as a JSON file.
   * @param data - The blueprint data to save
   * @param filename - The filename for the download (should follow "dungeon-blueprint-*.json" pattern)
   */
  download(data: BlueprintJSON, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  }

  /**
   * Opens a file picker dialog for the user to select a JSON blueprint file.
   * Parses the selected file and returns the result.
   * @returns A promise resolving to a FileLoadResult indicating success or failure
   */
  openFilePicker(): Promise<FileLoadResult> {
    return new Promise<FileLoadResult>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      let fileSelected = false;

      input.addEventListener("change", () => {
        fileSelected = true;

        const file = input.files?.[0];
        if (!file) {
          resolve({ success: false, error: "No file selected" });
          return;
        }

        const reader = new FileReader();

        reader.onload = () => {
          try {
            const content = reader.result as string;
            const parsed = JSON.parse(content) as BlueprintJSON;
            resolve({ success: true, data: parsed });
          } catch {
            resolve({ success: false, error: "Failed to parse file as JSON" });
          }
        };

        reader.onerror = () => {
          resolve({ success: false, error: "Failed to read file" });
        };

        reader.readAsText(file);
      });

      // Handle cancellation via focus return to window
      // When the file picker is dismissed without selection, the window regains focus
      const handleCancel = () => {
        // Small delay to allow 'change' event to fire first if a file was selected
        setTimeout(() => {
          if (!fileSelected) {
            resolve({ success: false, error: "File selection cancelled" });
          }
        }, 300);
        window.removeEventListener("focus", handleCancel);
      };

      window.addEventListener("focus", handleCancel);

      input.click();
    });
  }
}
