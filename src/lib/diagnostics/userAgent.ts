/**
 * Best-effort parsing helpers. The User-Agent string can be frozen, reduced or
 * spoofed, so every result derived from it is reported as an *estimate*.
 * User-Agent Client Hints (Chromium only) are preferred when present.
 */

export interface ParsedBrowser {
  name: string | null;
  version: string | null;
  engine: string | null;
}

export interface ParsedOS {
  name: string | null;
  version: string | null;
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface BrowserRule {
  name: string;
  pattern: RegExp;
}

// Order matters: many browsers include "Chrome" and "Safari" tokens.
const BROWSER_RULES: BrowserRule[] = [
  { name: 'Microsoft Edge', pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
  { name: 'Opera', pattern: /(?:OPR|OPiOS|OPX)\/([\d.]+)/ },
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/([\d.]+)/ },
  { name: 'Vivaldi', pattern: /Vivaldi\/([\d.]+)/ },
  { name: 'Yandex Browser', pattern: /YaBrowser\/([\d.]+)/ },
  { name: 'Firefox', pattern: /(?:Firefox|FxiOS)\/([\d.]+)/ },
  { name: 'Google Chrome', pattern: /(?:CriOS)\/([\d.]+)/ },
  { name: 'Chromium', pattern: /Chromium\/([\d.]+)/ },
  { name: 'Google Chrome', pattern: /Chrome\/([\d.]+)/ },
  { name: 'Safari', pattern: /Version\/([\d.]+).*Safari\// },
];

export function parseBrowser(ua: string): ParsedBrowser {
  const engine = parseEngine(ua);
  for (const rule of BROWSER_RULES) {
    const match = rule.pattern.exec(ua);
    if (match) return { name: rule.name, version: match[1] ?? null, engine };
  }
  return { name: null, version: null, engine };
}

function parseEngine(ua: string): string | null {
  // Every browser on iOS/iPadOS must use WebKit.
  if (/iPhone|iPad|iPod/.test(ua)) return 'WebKit';
  if (/Gecko\/\d/.test(ua) && /Firefox\//.test(ua)) return 'Gecko';
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return 'Blink';
  if (/AppleWebKit\//.test(ua)) return 'WebKit';
  return null;
}

export function parseOS(ua: string, maxTouchPoints = 0): ParsedOS {
  let m: RegExpExecArray | null;

  if ((m = /Windows NT ([\d.]+)/.exec(ua))) {
    const map: Record<string, string> = {
      // Windows 11 also reports "10.0"; client hints are needed to tell them apart.
      '10.0': '10 / 11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    return { name: 'Windows', version: map[m[1]] ?? m[1] };
  }
  if ((m = /Android ([\d.]+)/.exec(ua))) return { name: 'Android', version: m[1] };
  if (/Android/.test(ua)) return { name: 'Android', version: null };
  if ((m = /(?:iPhone|iPod).*? OS ([\d_]+)/.exec(ua))) {
    return { name: 'iOS', version: m[1].replace(/_/g, '.') };
  }
  if ((m = /iPad.*? OS ([\d_]+)/.exec(ua))) {
    return { name: 'iPadOS', version: m[1].replace(/_/g, '.') };
  }
  if (/CrOS/.test(ua)) return { name: 'ChromeOS', version: null };
  if (/Macintosh|Mac OS X/.test(ua)) {
    // iPadOS 13+ requests the desktop site and pretends to be a Mac.
    if (maxTouchPoints > 1) return { name: 'iPadOS', version: null };
    // Browsers freeze the macOS version at 10.15.7, so it is not reported.
    return { name: 'macOS', version: null };
  }
  if (/Linux/.test(ua)) return { name: 'Linux', version: null };
  return { name: null, version: null };
}

export function guessDeviceType(ua: string, maxTouchPoints = 0): DeviceType {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua)) return 'tablet';
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'tablet';
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** Maps a Client Hints `platformVersion` to a Windows marketing version. */
export function windowsVersionFromPlatformVersion(platformVersion: string): string | null {
  const major = Number.parseInt(platformVersion.split('.')[0] ?? '', 10);
  if (Number.isNaN(major)) return null;
  if (major >= 13) return '11';
  if (major > 0) return '10';
  return null;
}

const GREASE_BRAND = /not.?a.?brand/i;

/** Picks the most specific brand from Client Hints, ignoring "GREASE" and generic entries. */
export function pickBrand(
  brands: ReadonlyArray<{ brand: string; version: string }>,
): { brand: string; version: string } | null {
  const real = brands.filter((b) => !GREASE_BRAND.test(b.brand));
  const specific = real.find((b) => b.brand !== 'Chromium');
  return specific ?? real[0] ?? null;
}
