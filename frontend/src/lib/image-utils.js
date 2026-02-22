/**
 * Build full URL for photo paths (relative, absolute, data URLs, or full URLs).
 * Used by packing list, invoice, loading sheets, and preview modals.
 */
export function getImageUrl(photoPath) {
  if (!photoPath || typeof photoPath !== 'string') return null;
  const trimmed = photoPath.trim();
  if (!trimmed) return null;

  // Already full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  // Data URL (base64) - return as-is
  if (trimmed.startsWith('data:')) return trimmed;

  // Relative path - normalize and encode
  // We split by '/' to encode each segment, then join back
  const parts = trimmed.split('/');
  const encodedParts = parts.map(part => {
    // If it's an empty part (like the first slash), keep it empty
    if (!part) return '';
    return encodeURIComponent(part);
  });

  const normalizedPath = (trimmed.startsWith('/') ? '' : '/') + encodedParts.filter((p, i) => p || i === 0).join('/');

  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '');
  return `${baseUrl}${normalizedPath}`;
}
