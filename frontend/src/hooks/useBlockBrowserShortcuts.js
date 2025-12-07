// useBlockBrowserShortcuts.js
import { useEffect, useRef } from "react";

/**
 * useBlockBrowserShortcuts
 * - blockedCombos: optional array of strings like "Ctrl+R", "Ctrl+W", "F5"
 * - customHandlers: Map-like object where key is normalized combo string -> handler(e)
 * - options:
 *    - enabled (default true)
 *    - allowInInputs (default false) - when true, blocking happens even inside inputs
 *
 * Combo normalization: e.g. Ctrl+Shift+S, Meta+S, Alt+F4, F5, Tab, Enter
 *
 * NOTE: Some combos cannot be fully blocked in some browsers. We attempt preventDefault() for many.
 */
export default function useBlockBrowserShortcuts({
  blockedCombos = [
    "Ctrl+R",
    "Ctrl+Shift+R",
    "F5",
    "Ctrl+W",
    "Ctrl+N",
    "Ctrl+T",
    "Ctrl+Shift+T",
    "Ctrl+F",
    "Ctrl+G",
    "Ctrl+H",
    "Ctrl+Shift+N",
    "Alt+Left",
    "Alt+Right",
    "Backspace", // prevent back navigation when not in input
    "Ctrl+Tab"
  ],
  customHandlers = {},
  options = { enabled: true, allowInInputs: false },
}) {
  const handlersRef = useRef(customHandlers);
  handlersRef.current = customHandlers;

  useEffect(() => {
    if (!options.enabled) return;

    function isEditingElement(target) {
      if (!target) return false;
      const name = target.tagName;
      if (!name) return false;
      const editable =
        target.isContentEditable ||
        name === "INPUT" ||
        name === "TEXTAREA" ||
        target.getAttribute("role") === "textbox";
      return !!editable;
    }

    function normalizeEvent(e) {
      const parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.metaKey) parts.push("Meta");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      // Use `key` where functions like F1..F12 come as 'F5'
      let key = e.key;

      // normalize common keys
      if (key === " ") key = "Space";
      if (key === "Esc") key = "Escape";
      // For Arrow keys
      if (key === "ArrowLeft") key = "Left";
      if (key === "ArrowRight") key = "Right";
      if (key === "ArrowUp") key = "Up";
      if (key === "ArrowDown") key = "Down";

      // Avoid including modifier key alone
      if (!["Shift", "Control", "Alt", "Meta"].includes(key)) {
        // Some browsers report "Control" / "Meta" in e.key; normalize to main string if needed
        // Do not add duplicate if key already included in parts
        parts.push(key.length === 1 ? key.toUpperCase() : key);
      }
      return parts.join("+");
    }

    function shouldBlock(combo, e) {
      // If currently editing an input and allowInInputs is false => don't block
      if (isEditingElement(e.target) && !options.allowInInputs) return false;
      // Block if combo in blockedCombos
      if (blockedCombos.includes(combo)) return true;
      return false;
    }

    function onKeyDown(e) {
      const combo = normalizeEvent(e);

      // first, check custom handlers (exact match)
      const handler = handlersRef.current[combo] || handlersRef.current[combo.toLowerCase()];
      if (handler) {
        try {
          e.preventDefault();
        } catch (err) {}
        // call handler and exit (do not allow browser default)
        handler(e);
        return;
      }

      // if combo is in blocked list attempt to prevent it
      if (shouldBlock(combo, e)) {
        try {
          e.preventDefault();
          e.stopImmediatePropagation();
        } catch (err) {}
        // Additionally attempt to stop other listeners
        return false;
      }

      // Additionally: block some single-key defaults (Backspace when not in input)
      if (e.key === "Backspace" && !isEditingElement(e.target) && blockedCombos.includes("Backspace")) {
        try {
          e.preventDefault();
          e.stopImmediatePropagation();
        } catch (err) {}
        return false;
      }
    }

    // contextmenu blocking if needed (right-click)
    function onContextMenu(e) {
      // optional: block context menu when not in input
      if (!options.allowInInputs && !isEditingElement(e.target)) {
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("contextmenu", onContextMenu, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("contextmenu", onContextMenu, { capture: true });
    };
  }, [blockedCombos, options.enabled, options.allowInInputs]);
}
