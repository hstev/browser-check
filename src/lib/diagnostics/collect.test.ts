import { describe, expect, it } from 'vitest';
import { generateDiagnosticId } from '../id';
import { findField } from '../report';
import { collectDiagnostics, formatUtcOffset, sanitizeUrl, testStorage } from './collect';
import type { DiagnosticReport, FieldId } from './types';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
  };
}

/** Builds a minimal fake `window`. Anything not provided is simply missing, like in a locked-down browser. */
function fakeWindow(overrides: Record<string, unknown> = {}, navOverrides: Record<string, unknown> = {}): Window {
  return {
    navigator: {
      userAgent: CHROME_UA,
      platform: 'Win32',
      language: 'es-CO',
      languages: ['es-CO', 'es', 'en'],
      cookieEnabled: true,
      onLine: true,
      maxTouchPoints: 0,
      hardwareConcurrency: 8,
      ...navOverrides,
    },
    screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24 },
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1.5,
    location: {
      href: 'https://diag.example.com/app/?token=secret#value=INC-1',
      origin: 'https://diag.example.com',
      protocol: 'https:',
    },
    document: {
      referrer: 'https://helpdesk.example.com/tickets/42?session=abc',
      createElement: () => ({ getContext: () => null }),
    },
    isSecureContext: true,
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    ...overrides,
  } as unknown as Window;
}

const get = (r: DiagnosticReport, id: FieldId) => findField(r, id)!;
const NOW = new Date('2026-10-28T15:30:00.000Z');

describe('collectDiagnostics', () => {
  it('collects detected values and marks UA-derived ones as estimates', async () => {
    const r = await collectDiagnostics(fakeWindow(), { now: NOW, appVersion: '1.2.3', diagnosticId: 'BC-TEST-0001' });

    expect(r.meta).toEqual({ diagnosticId: 'BC-TEST-0001', generatedAt: '2026-10-28T15:30:00.000Z', appVersion: '1.2.3' });
    expect(get(r, 'browserName')).toMatchObject({ value: 'Google Chrome', status: 'estimated' });
    expect(get(r, 'browserVersion')).toMatchObject({ value: '130.0.0.0', status: 'estimated' });
    expect(get(r, 'operatingSystem')).toMatchObject({ value: 'Windows 10 / 11', status: 'estimated' });
    expect(get(r, 'deviceType')).toMatchObject({ value: 'desktop', status: 'estimated' });
    expect(get(r, 'screenResolution')).toMatchObject({ value: '1920 × 1080', status: 'detected' });
    expect(get(r, 'availableScreen').value).toBe('1920 × 1040');
    expect(get(r, 'viewport').value).toBe('1280 × 720');
    expect(get(r, 'pixelRatio').value).toBe(1.5);
    expect(get(r, 'languages').value).toEqual(['es-CO', 'es', 'en']);
    expect(get(r, 'onlineStatus')).toMatchObject({ value: 'online', enumValue: true });
    expect(get(r, 'javascriptEnabled').value).toBe(true);
    expect(get(r, 'secureContext').value).toBe(true);
    expect(get(r, 'localStorage').value).toBe(true);
    expect(get(r, 'protocol').value).toBe('HTTPS');
    expect(get(r, 'userAgent')).toMatchObject({ value: CHROME_UA, advanced: true });
  });

  it('strips query strings and fragments from URLs', async () => {
    const r = await collectDiagnostics(fakeWindow(), { now: NOW });
    expect(get(r, 'pageUrl').value).toBe('https://diag.example.com/app/');
    expect(get(r, 'referrer').value).toBe('https://helpdesk.example.com/tickets/42');
  });

  it('prefers User-Agent Client Hints and reports them as detected', async () => {
    const userAgentData = {
      brands: [
        { brand: 'Not?A_Brand', version: '99' },
        { brand: 'Chromium', version: '130' },
        { brand: 'Microsoft Edge', version: '130' },
      ],
      mobile: false,
      platform: 'Windows',
      getHighEntropyValues: async () => ({
        platform: 'Windows',
        platformVersion: '15.0.0',
        fullVersionList: [
          { brand: 'Chromium', version: '130.0.6723.92' },
          { brand: 'Microsoft Edge', version: '130.0.2849.68' },
        ],
      }),
    };
    const r = await collectDiagnostics(fakeWindow({}, { userAgentData }), { now: NOW });
    expect(get(r, 'browserName')).toMatchObject({ value: 'Microsoft Edge', status: 'detected' });
    expect(get(r, 'browserVersion').value).toBe('130.0.2849.68');
    expect(get(r, 'operatingSystem')).toMatchObject({ value: 'Windows 11', status: 'detected' });
    expect(get(r, 'clientHintsBrands').value).toEqual(['Chromium 130', 'Microsoft Edge 130']);
  });

  it('survives a rejected high-entropy request', async () => {
    const userAgentData = {
      brands: [{ brand: 'Google Chrome', version: '130' }],
      mobile: true,
      platform: 'Android',
      getHighEntropyValues: () => Promise.reject(new Error('blocked')),
    };
    const r = await collectDiagnostics(fakeWindow({}, { userAgentData }), { now: NOW });
    expect(get(r, 'browserName').value).toBe('Google Chrome');
    expect(get(r, 'operatingSystem').value).toBe('Android');
    expect(get(r, 'deviceType').value).toBe('mobile');
  });

  it('marks missing APIs as unavailable without throwing', async () => {
    const throwingStorage = {
      setItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    const win = {
      navigator: { userAgent: '' },
      location: { href: '', origin: 'null', protocol: '' },
      document: { referrer: '', createElement: () => ({ getContext: () => null }) },
      localStorage: throwingStorage,
      get sessionStorage(): Storage {
        throw new DOMException('denied', 'SecurityError');
      },
    } as unknown as Window;

    const r = await collectDiagnostics(win, { now: NOW });
    for (const id of [
      'browserName',
      'browserVersion',
      'operatingSystem',
      'screenResolution',
      'viewport',
      'pixelRatio',
      'hardwareConcurrency',
      'deviceMemory',
      'onlineStatus',
      'pageUrl',
      'origin',
      'referrer',
      'protocol',
      'colorScheme',
    ] as FieldId[]) {
      expect(get(r, id), id).toMatchObject({ value: null, status: 'unavailable' });
    }
    expect(get(r, 'localStorage').value).toBe(false);
    expect(get(r, 'sessionStorage').value).toBe(false);
    expect(get(r, 'webgl').value).toBe(false);
  });

  it('reports offline status and device memory as an estimate', async () => {
    const r = await collectDiagnostics(fakeWindow({}, { onLine: false, deviceMemory: 8 }), { now: NOW });
    expect(get(r, 'onlineStatus').value).toBe('offline');
    expect(get(r, 'deviceMemory')).toMatchObject({ value: '8 GB', status: 'estimated' });
  });

  it('generates a new ID only when none is provided', async () => {
    const r = await collectDiagnostics(fakeWindow(), { now: NOW });
    expect(r.meta.diagnosticId).toMatch(/^BC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  });
});

describe('helpers', () => {
  it('formats UTC offsets', () => {
    expect(formatUtcOffset(300)).toBe('UTC-05:00');
    expect(formatUtcOffset(-330)).toBe('UTC+05:30');
    expect(formatUtcOffset(0)).toBe('UTC+00:00');
  });

  it('sanitizes URLs', () => {
    expect(sanitizeUrl('https://a.com/x?y=1#z')).toBe('https://a.com/x');
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('tests storage safely', () => {
    expect(testStorage(() => memoryStorage())).toBe(true);
    expect(testStorage(() => null)).toBe(false);
    expect(
      testStorage(() => {
        throw new Error('blocked');
      }),
    ).toBe(false);
  });

  it('generates unique, readable diagnostic IDs', () => {
    const ids = new Set(Array.from({ length: 200 }, generateDiagnosticId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).not.toMatch(/[ILOU]/);
  });
});
