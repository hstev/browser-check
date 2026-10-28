/**
 * Copies text using the async Clipboard API when possible, falling back to the
 * legacy `execCommand('copy')` (which also works on plain HTTP).
 * Resolves to `true` on success; never throws.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied, insecure context or document not focused: try the fallback.
  }
  return legacyCopy(text);
}

export function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  // Keep it out of view and avoid zooming on iOS (font-size >= 16px).
  textarea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;';
  document.body.appendChild(textarea);
  const previousFocus = document.activeElement as HTMLElement | null;
  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
    previousFocus?.focus?.();
  }
}

export function canCopyImage(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  );
}

/**
 * Copies a PNG. The blob is passed as a promise so Safari keeps the user
 * gesture while the image is still being generated.
 */
export async function copyImage(blob: Blob | Promise<Blob>): Promise<boolean> {
  if (!canCopyImage()) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': Promise.resolve(blob) })]);
    return true;
  } catch {
    return false;
  }
}
