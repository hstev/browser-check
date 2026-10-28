import { describe, expect, it } from 'vitest';
import { guessDeviceType, parseBrowser, parseOS, pickBrand, windowsVersionFromPlatformVersion } from './userAgent';

const UA = {
  chromeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.56',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  opera:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/115.0.0.0',
  chromeOS:
    'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};

describe('parseBrowser', () => {
  it.each([
    [UA.chromeWin, 'Google Chrome', '130.0.0.0', 'Blink'],
    [UA.edgeWin, 'Microsoft Edge', '130.0.2849.56', 'Blink'],
    [UA.firefoxLinux, 'Firefox', '132.0', 'Gecko'],
    [UA.safariMac, 'Safari', '18.1', 'WebKit'],
    [UA.safariIphone, 'Safari', '18.1', 'WebKit'],
    [UA.chromeIos, 'Google Chrome', '130.0.6723.90', 'WebKit'],
    [UA.samsung, 'Samsung Internet', '26.0', 'Blink'],
    [UA.opera, 'Opera', '115.0.0.0', 'Blink'],
  ])('parses %s', (ua, name, version, engine) => {
    expect(parseBrowser(ua)).toEqual({ name, version, engine });
  });

  it('returns nulls for unknown agents', () => {
    expect(parseBrowser('curl/8.0')).toEqual({ name: null, version: null, engine: null });
    expect(parseBrowser('')).toEqual({ name: null, version: null, engine: null });
  });
});

describe('parseOS', () => {
  it('cannot distinguish Windows 10 from 11 via the User-Agent', () => {
    expect(parseOS(UA.chromeWin)).toEqual({ name: 'Windows', version: '10 / 11' });
  });
  it('does not report the frozen macOS version', () => {
    expect(parseOS(UA.safariMac)).toEqual({ name: 'macOS', version: null });
  });
  it('detects iPadOS masquerading as macOS through touch points', () => {
    expect(parseOS(UA.safariMac, 5)).toEqual({ name: 'iPadOS', version: null });
  });
  it.each([
    [UA.safariIphone, 'iOS', '18.1'],
    [UA.ipad, 'iPadOS', '17.5'],
    [UA.chromeAndroid, 'Android', '14'],
    [UA.chromeOS, 'ChromeOS', null],
    [UA.firefoxLinux, 'Linux', null],
  ])('parses %s', (ua, name, version) => {
    expect(parseOS(ua)).toEqual({ name, version });
  });
});

describe('guessDeviceType', () => {
  it.each([
    [UA.chromeWin, 0, 'desktop'],
    [UA.safariIphone, 5, 'mobile'],
    [UA.chromeAndroid, 5, 'mobile'],
    [UA.androidTablet, 10, 'tablet'],
    [UA.ipad, 5, 'tablet'],
    [UA.safariMac, 5, 'tablet'],
    [UA.safariMac, 0, 'desktop'],
  ])('%s → %s', (ua, touch, expected) => {
    expect(guessDeviceType(ua, touch)).toBe(expected);
  });
});

describe('client hints helpers', () => {
  it('maps Windows platformVersion to 10 or 11', () => {
    expect(windowsVersionFromPlatformVersion('15.0.0')).toBe('11');
    expect(windowsVersionFromPlatformVersion('10.0.0')).toBe('10');
    expect(windowsVersionFromPlatformVersion('0.3.0')).toBeNull();
    expect(windowsVersionFromPlatformVersion('x')).toBeNull();
  });

  it('ignores GREASE and generic Chromium brands', () => {
    expect(
      pickBrand([
        { brand: 'Not)A;Brand', version: '99' },
        { brand: 'Chromium', version: '130' },
        { brand: 'Google Chrome', version: '130' },
      ]),
    ).toEqual({ brand: 'Google Chrome', version: '130' });
    expect(pickBrand([{ brand: 'Chromium', version: '130' }])).toEqual({ brand: 'Chromium', version: '130' });
    expect(pickBrand([])).toBeNull();
  });
});
