/**
 * Extract image File from paste event clipboardData.
 * Supports: direct image/*, clipboardData.files, and Excel/Office HTML with base64 images.
 * @param {ClipboardEvent} e - paste event
 * @returns {File|null} - Image file or null if no image found
 */
export function getImageFileFromClipboardEvent(e) {
  const dt = e?.clipboardData;
  if (!dt) return null;

  // 1. Try clipboardData.items for direct image types (browser, screenshots, etc.)
  for (let i = 0; i < dt.items.length; i++) {
    const item = dt.items[i];
    if (item.kind === "file" && item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  // 2. Try clipboardData.files (some browsers/sources put image here)
  if (dt.files?.length > 0) {
    for (let i = 0; i < dt.files.length; i++) {
      if (dt.files[i].type?.startsWith("image/")) {
        return dt.files[i];
      }
    }
  }

  // 3. Try text/html - Excel/Office embed images as base64 in <img src="data:...">
  const html = dt.getData("text/html");
  if (html) {
    const file = extractImageFromHtml(html);
    if (file) return file;
  }

  return null;
}

/**
 * Extract first base64 image from HTML string (Excel/Office paste format).
 * @param {string} html
 * @returns {File|null}
 */
function extractImageFromHtml(html) {
  try {
    // Match <img src="data:image/xxx;base64,..."> or src='data:...'
    const imgRegex = /<img[^>]+src\s*=\s*["'](data:image\/([a-z]+);base64,[^"']+)["']/gi;
    const match = imgRegex.exec(html);
    if (match) {
      const dataUrl = match[1];
      const mimeType = match[2] || "png"; // png, jpeg, gif, webp
      const file = dataUrlToFile(dataUrl, `pasted_image.${mimeType === "jpeg" ? "jpg" : mimeType}`);
      if (file) return file;
    }

    // Also try fragment with just the data URL
    const dataUrlRegex = /data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+/;
    const dataMatch = html.match(dataUrlRegex);
    if (dataMatch) {
      const ext = dataMatch[1].toLowerCase() === "jpeg" || dataMatch[1].toLowerCase() === "jpg" ? "jpg" : dataMatch[1];
      return dataUrlToFile(dataMatch[0], `pasted_image.${ext}`);
    }
  } catch (_) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Convert data URL to File.
 * @param {string} dataUrl - e.g. "data:image/png;base64,..."
 * @param {string} filename
 * @returns {File|null}
 */
function dataUrlToFile(dataUrl, filename) {
  try {
    const arr = dataUrl.split(",");
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  } catch (_) {
    return null;
  }
}

/**
 * Extract image File from async Clipboard API (navigator.clipboard.read).
 * Used for right-click context menu "Paste" - supports Excel/Office HTML format.
 * @returns {Promise<File|null>}
 */
export async function getImageFileFromClipboard() {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      // 1. Direct image types
      for (const type of item.types) {
        if (type.startsWith("image/")) {
          const blob = await item.getType(type);
          const ext = type.includes("png") ? "png" : type.includes("jpeg") || type.includes("jpg") ? "jpg" : "png";
          return new File([blob], `pasted_image.${ext}`, { type });
        }
      }

      // 2. text/html - Excel/Office embeds images as base64
      if (item.types.includes("text/html")) {
        const blob = await item.getType("text/html");
        const html = await blob.text();
        const file = extractImageFromHtml(html);
        if (file) return file;
      }
    }
  } catch (_) {
    // Permission denied or other error
  }
  return null;
}
