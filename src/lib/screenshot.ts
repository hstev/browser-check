import { toCanvas } from 'html-to-image';

/** Mobile Safari refuses to allocate canvases larger than ~16.7 MP. */
const MAX_CANVAS_PIXELS = 16_000_000;
/**
 * Render at 2× even on standard-density screens: the image is usually viewed
 * zoomed in, or on a support agent's high-DPI display, where 1× looks blurry.
 */
const MIN_PIXEL_RATIO = 2;
const MAX_PIXEL_RATIO = 3;

/** Picks a pixel ratio that keeps the image sharp without exceeding canvas limits. */
export function computePixelRatio(width: number, height: number, devicePixelRatio = 1): number {
  const desired = Math.min(MAX_PIXEL_RATIO, Math.max(MIN_PIXEL_RATIO, devicePixelRatio || 1));
  const area = Math.max(1, width * height);
  const maxByArea = Math.sqrt(MAX_CANVAS_PIXELS / area);
  return Math.max(0.5, Math.min(desired, maxByArea));
}

/** WebKit sometimes renders a blank first frame through foreignObject; a warm-up pass avoids it. */
function needsWarmUp(): boolean {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), 'image/png');
  });
}

function resolveBackground(node: HTMLElement): string {
  const own = getComputedStyle(node).backgroundColor;
  if (own && own !== 'rgba(0, 0, 0, 0)' && own !== 'transparent') return own;
  return getComputedStyle(document.body).backgroundColor || '#ffffff';
}

/**
 * Renders a DOM node (the printable report, not the browser window) to a PNG.
 * Elements marked with `data-capture-exclude` are left out.
 */
export async function renderNodeToPng(node: HTMLElement): Promise<Blob> {
  await document.fonts?.ready?.catch(() => undefined);

  const width = node.scrollWidth;
  const height = node.scrollHeight;
  const options = {
    backgroundColor: resolveBackground(node),
    pixelRatio: computePixelRatio(width, height, window.devicePixelRatio),
    width,
    height,
    cacheBust: true,
    // Only system fonts are used, so there is nothing to embed (and no network requests).
    skipFonts: true,
    filter: (el: Node) => !(el instanceof HTMLElement && el.dataset.captureExclude !== undefined),
  };

  if (needsWarmUp()) await toCanvas(node, { ...options, pixelRatio: 0.25 });
  const canvas = await toCanvas(node, options);
  return canvasToBlob(canvas);
}
