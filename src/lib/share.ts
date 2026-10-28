export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export type ShareResult = 'shared' | 'cancelled' | 'failed';

/**
 * Opens the native share sheet with the text report. Only text is shared:
 * rendering an image first would consume the user gesture that Safari requires.
 */
export async function shareReport(data: { title: string; text: string }): Promise<ShareResult> {
  if (!canShare()) return 'failed';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (err) {
    // The user closed the share sheet: not an error worth reporting.
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}
