/**
 * Toast notification system for displaying non-blocking messages to the user.
 * Normal toasts auto-dismiss after 5 seconds.
 * Critical toasts remain visible until manually dismissed.
 */

/** Duration in milliseconds before a normal toast auto-dismisses. */
const AUTO_DISMISS_MS = 5000;

/** ID for the toast container element. */
const CONTAINER_ID = "dungeon-toast-container";

/** ID for the injected style element. */
const STYLE_ID = "dungeon-toast-styles";

/** Options for configuring toast behavior. */
export interface ToastOptions {
  /** If true, the toast will not auto-dismiss and requires manual close. */
  critical?: boolean;
}

/**
 * Displays a non-blocking toast notification.
 *
 * Normal toasts auto-dismiss after 5 seconds.
 * Critical toasts (load failure, save failure) remain visible until the user clicks the close button.
 */
export function showToast(message: string, options?: ToastOptions): void {
  ensureStyles();
  const container = ensureContainer();
  const isCritical = options?.critical ?? false;

  const toast = document.createElement("div");
  toast.className = isCritical ? "dungeon-toast dungeon-toast--critical" : "dungeon-toast";
  toast.setAttribute("role", "alert");

  const messageSpan = document.createElement("span");
  messageSpan.className = "dungeon-toast__message";
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);

  if (isCritical) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "dungeon-toast__close";
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Dismiss notification");
    closeBtn.addEventListener("click", () => {
      removeToast(toast, container);
    });
    toast.appendChild(closeBtn);
  }

  container.appendChild(toast);

  // Trigger enter animation on next frame
  requestAnimationFrame(() => {
    toast.classList.add("dungeon-toast--visible");
  });

  if (!isCritical) {
    setTimeout(() => {
      removeToast(toast, container);
    }, AUTO_DISMISS_MS);
  }
}

/** Removes a toast element with a fade-out transition. */
function removeToast(toast: HTMLElement, container: HTMLElement): void {
  toast.classList.remove("dungeon-toast--visible");
  toast.classList.add("dungeon-toast--exiting");

  toast.addEventListener("transitionend", () => {
    if (toast.parentNode === container) {
      container.removeChild(toast);
    }
  });

  // Fallback removal in case transitionend doesn't fire
  setTimeout(() => {
    if (toast.parentNode === container) {
      container.removeChild(toast);
    }
  }, 400);
}

/** Ensures the toast container element exists in the DOM. */
function ensureContainer(): HTMLElement {
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

/** Injects toast CSS styles into the document head if not already present. */
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${CONTAINER_ID} {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .dungeon-toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border: 3px solid #1a1a1a;
      border-radius: 0;
      background-color: #a8e6cf;
      color: #1a1a1a;
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      box-shadow: 4px 4px 0 #1a1a1a;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: auto;
      max-width: 380px;
      word-wrap: break-word;
    }

    .dungeon-toast--visible {
      opacity: 1;
      transform: translateX(0);
    }

    .dungeon-toast--exiting {
      opacity: 0;
      transform: translateX(20px);
    }

    .dungeon-toast--critical {
      background-color: #ff6b6b;
      color: #1a1a1a;
    }

    .dungeon-toast__message {
      flex: 1;
    }

    .dungeon-toast__close {
      background: none;
      border: 2px solid #1a1a1a;
      color: #1a1a1a;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 8px;
      border-radius: 0;
      line-height: 1;
      transition: background-color 0.1s ease;
    }

    .dungeon-toast__close:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .dungeon-toast__close:focus {
      outline: 3px solid #1a1a1a;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}
