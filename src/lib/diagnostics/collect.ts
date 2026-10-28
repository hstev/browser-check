import { generateDiagnosticId } from '../id';
import type {
  DiagnosticField,
  DiagnosticReport,
  DiagnosticSection,
  FieldId,
  FieldValue,
} from './types';
import {
  guessDeviceType,
  parseBrowser,
  parseOS,
  pickBrand,
  windowsVersionFromPlatformVersion,
} from './userAgent';

/** Subset of User-Agent Client Hints (not yet in lib.dom for every TS version). */
interface UADataBrand {
  brand: string;
  version: string;
}
interface UAHighEntropy {
  platform?: string;
  platformVersion?: string;
  fullVersionList?: UADataBrand[];
}
interface NavigatorUAData {
  brands: UADataBrand[];
  mobile: boolean;
  platform: string;
  getHighEntropyValues?: (hints: string[]) => Promise<UAHighEntropy>;
}
interface NetworkInformation {
  effectiveType?: string;
}
type ExtendedNavigator = Navigator & {
  userAgentData?: NavigatorUAData;
  deviceMemory?: number;
  connection?: NetworkInformation;
};

export interface CollectOptions {
  /** Keep an existing ID when re-collecting so the report stays traceable. */
  diagnosticId?: string;
  now?: Date;
  appVersion?: string;
}

/** Runs `fn`, returning `fallback` if it throws (privacy settings may block APIs). */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function field(id: FieldId, value: FieldValue | undefined, status: 'detected' | 'estimated' = 'detected', extra: Partial<DiagnosticField> = {}): DiagnosticField {
  const empty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'number' && !Number.isFinite(value));
  return empty
    ? { id, value: null, status: 'unavailable', ...extra }
    : { id, value, status, ...extra };
}

/** Writes and removes a probe key; storage may exist but throw (Safari private mode, blocked cookies). */
export function testStorage(getStorage: () => Storage | null | undefined): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    const key = '__bc_probe__';
    storage.setItem(key, '1');
    const ok = storage.getItem(key) === '1';
    storage.removeItem(key);
    return ok;
  } catch {
    return false;
  }
}

/** Formats a UTC offset like "UTC-05:00". `offsetMinutes` follows `Date#getTimezoneOffset` (inverted sign). */
export function formatUtcOffset(offsetMinutes: number): string {
  const total = -offsetMinutes;
  const sign = total >= 0 ? '+' : '-';
  const abs = Math.abs(total);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

/** Strips query string and fragment, which can contain tokens or personal data. */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return null;
  }
}

function hasWebGL(win: Window, kind: 'webgl' | 'webgl2'): boolean {
  return safe(() => {
    const canvas = win.document.createElement('canvas');
    const ctx = canvas.getContext(kind);
    const ok = !!ctx;
    // Free the context right away; browsers limit how many can be alive.
    (ctx as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  }, false);
}

function mediaMatches(win: Window, query: string): boolean | null {
  return safe(() => (typeof win.matchMedia === 'function' ? win.matchMedia(query).matches : null), null);
}

async function readHighEntropy(uaData: NavigatorUAData | undefined): Promise<UAHighEntropy | null> {
  if (!uaData?.getHighEntropyValues) return null;
  try {
    return await uaData.getHighEntropyValues(['platformVersion', 'fullVersionList']);
  } catch {
    return null;
  }
}

export async function collectDiagnostics(
  win: Window = window,
  options: CollectOptions = {},
): Promise<DiagnosticReport> {
  const now = options.now ?? new Date();
  const nav = safe(() => win.navigator as ExtendedNavigator, undefined);
  const ua = safe(() => nav?.userAgent ?? '', '');
  const maxTouchPoints = safe(() => nav?.maxTouchPoints ?? 0, 0);
  const uaData = safe(() => nav?.userAgentData, undefined);
  const highEntropy = await readHighEntropy(uaData);

  return {
    meta: {
      diagnosticId: options.diagnosticId ?? generateDiagnosticId(),
      generatedAt: now.toISOString(),
      appVersion: options.appVersion ?? __APP_VERSION__,
    },
    sections: [
      browserSection(nav, ua, uaData, highEntropy),
      deviceSection(win, nav, ua, maxTouchPoints, uaData, highEntropy),
      regionalSection(now),
      environmentSection(win),
      capabilitiesSection(win, nav),
    ],
  };
}

function browserSection(
  nav: ExtendedNavigator | undefined,
  ua: string,
  uaData: NavigatorUAData | undefined,
  highEntropy: UAHighEntropy | null,
): DiagnosticSection {
  const parsed = parseBrowser(ua);
  const hintBrand = pickBrand(highEntropy?.fullVersionList ?? uaData?.brands ?? []);

  const nameField = hintBrand
    ? field('browserName', hintBrand.brand)
    : field('browserName', parsed.name, 'estimated');
  const versionField = hintBrand
    ? field('browserVersion', hintBrand.version)
    : field('browserVersion', parsed.version, 'estimated');

  const brands = (uaData?.brands ?? [])
    .filter((b) => !/not.?a.?brand/i.test(b.brand))
    .map((b) => `${b.brand} ${b.version}`);

  return {
    id: 'browser',
    fields: [
      nameField,
      versionField,
      field('renderingEngine', parsed.engine, 'estimated'),
      field('platform', safe(() => uaData?.platform || nav?.platform, undefined)),
      field('language', safe(() => nav?.language, undefined)),
      field('languages', safe(() => [...(nav?.languages ?? [])], [])),
      field('cookiesEnabled', safe(() => nav?.cookieEnabled, undefined)),
      // If this code runs, JavaScript is enabled. index.html has a <noscript> fallback.
      field('javascriptEnabled', true),
      field('userAgent', ua, 'detected', { advanced: true }),
      field('clientHintsBrands', brands, 'detected', { advanced: true }),
    ],
  };
}

function deviceSection(
  win: Window,
  nav: ExtendedNavigator | undefined,
  ua: string,
  maxTouchPoints: number,
  uaData: NavigatorUAData | undefined,
  highEntropy: UAHighEntropy | null,
): DiagnosticSection {
  const os = parseOS(ua, maxTouchPoints);
  let osName = os.name;
  let osVersion = os.version;
  let osStatus: 'detected' | 'estimated' = 'estimated';

  const hintPlatform = highEntropy?.platform || uaData?.platform;
  if (hintPlatform) {
    osName = hintPlatform === 'Chrome OS' ? 'ChromeOS' : hintPlatform;
    osStatus = 'detected';
    const pv = highEntropy?.platformVersion?.replace(/_/g, '.');
    if (pv) {
      osVersion = hintPlatform === 'Windows' ? windowsVersionFromPlatformVersion(pv) : pv;
    } else if (hintPlatform !== os.name) {
      osVersion = null;
    }
  }
  const osLabel = osName ? [osName, osVersion].filter(Boolean).join(' ') : null;

  const deviceType = uaData?.mobile === true ? 'mobile' : guessDeviceType(ua, maxTouchPoints);

  const scr = safe(() => win.screen, undefined);
  const resolution = scr && scr.width && scr.height ? `${scr.width} × ${scr.height}` : null;
  const available = scr && scr.availWidth && scr.availHeight ? `${scr.availWidth} × ${scr.availHeight}` : null;
  const vw = safe(() => win.innerWidth, 0);
  const vh = safe(() => win.innerHeight, 0);
  const dpr = safe(() => win.devicePixelRatio, NaN);
  const orientation = safe(() => scr?.orientation?.type ?? null, null);

  const touch = maxTouchPoints > 0 || safe(() => 'ontouchstart' in win, false);
  const onLine = safe(() => nav?.onLine, undefined);

  return {
    id: 'device',
    fields: [
      field('operatingSystem', osLabel, osStatus),
      field('deviceType', deviceType, 'estimated', { enumValue: true }),
      field('screenResolution', resolution),
      field('availableScreen', available),
      field('viewport', vw && vh ? `${vw} × ${vh}` : null),
      field('pixelRatio', Number.isFinite(dpr) ? Math.round(dpr * 100) / 100 : null),
      field('colorDepth', safe(() => (scr?.colorDepth ? `${scr.colorDepth}-bit` : null), null)),
      field('orientation', orientation, 'detected', { enumValue: true }),
      field('touchSupport', touch),
      field('maxTouchPoints', maxTouchPoints, 'detected', { advanced: true }),
      field('hardwareConcurrency', safe(() => nav?.hardwareConcurrency, undefined)),
      // Rounded and capped by the browser (Chromium only), so it's approximate.
      field('deviceMemory', safe(() => (nav?.deviceMemory ? `${nav.deviceMemory} GB` : null), null), 'estimated'),
      field('onlineStatus', onLine === undefined ? null : onLine ? 'online' : 'offline', 'detected', { enumValue: true }),
      field('connectionType', safe(() => nav?.connection?.effectiveType ?? null, null), 'estimated', { advanced: true }),
    ],
  };
}

function regionalSection(now: Date): DiagnosticSection {
  const resolved = safe(() => Intl.DateTimeFormat().resolvedOptions(), null);
  const localDateTime = safe(
    () =>
      new Intl.DateTimeFormat(resolved?.locale, {
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(now),
    now.toString(),
  );
  return {
    id: 'regional',
    fields: [
      field('locale', resolved?.locale),
      field('timeZone', resolved?.timeZone),
      field('localDateTime', localDateTime),
      field('utcOffset', formatUtcOffset(now.getTimezoneOffset())),
    ],
  };
}

function environmentSection(win: Window): DiagnosticSection {
  const loc = safe(() => win.location, undefined);
  const protocol = loc?.protocol?.replace(/:$/, '').toUpperCase() || null;
  const referrer = safe(() => sanitizeUrl(win.document.referrer), null);

  return {
    id: 'environment',
    fields: [
      field('pageUrl', loc ? sanitizeUrl(loc.href) : null),
      field('origin', loc?.origin && loc.origin !== 'null' ? loc.origin : null),
      field('referrer', referrer),
      field('protocol', protocol),
      field('secureContext', safe(() => win.isSecureContext, undefined)),
      field('localStorage', testStorage(() => win.localStorage)),
      field('sessionStorage', testStorage(() => win.sessionStorage)),
      field('serviceWorker', safe(() => 'serviceWorker' in win.navigator, false)),
      field('webrtc', safe(() => typeof (win as unknown as Record<string, unknown>).RTCPeerConnection === 'function', false)),
    ],
  };
}

function capabilitiesSection(win: Window, nav: ExtendedNavigator | undefined): DiagnosticSection {
  const g = win as unknown as Record<string, unknown>;
  const dark = mediaMatches(win, '(prefers-color-scheme: dark)');
  const reduced = mediaMatches(win, '(prefers-reduced-motion: reduce)');

  return {
    id: 'capabilities',
    fields: [
      field('webgl', hasWebGL(win, 'webgl')),
      field('webgl2', hasWebGL(win, 'webgl2')),
      field('webassembly', typeof g.WebAssembly === 'object' && g.WebAssembly !== null),
      field('indexedDB', safe(() => !!win.indexedDB, false)),
      field('clipboardApi', safe(() => typeof nav?.clipboard?.writeText === 'function', false)),
      field('webShare', safe(() => typeof nav?.share === 'function', false)),
      field('notifications', typeof g.Notification === 'function'),
      field('pdfViewer', safe(() => nav?.pdfViewerEnabled, undefined)),
      field('colorScheme', dark === null ? null : dark ? 'dark' : 'light', 'detected', { enumValue: true }),
      field('reducedMotion', reduced),
    ].map((f) => ({ ...f, advanced: true })),
  };
}
