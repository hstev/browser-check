import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadJson } from './download';
import { buildFilename, buildJson, sanitizeFilenamePart } from './export';
import { sampleReport } from '../test/fixtures';

describe('buildJson', () => {
  it('exports raw values with their status and the custom identifier', () => {
    const json = buildJson(sampleReport, { label: 'Ticket de soporte', value: ' INC-2026-1042 ' }, 'Default');
    expect(json.schemaVersion).toBe(1);
    expect(json.diagnosticId).toBe('BC-AB12-CD34');
    expect(json.generatedAt).toBe('2026-10-28T15:30:00.000Z');
    expect(json.app).toEqual({ name: 'Browser Check', version: '1.0.0' });
    expect(json.customIdentifier).toEqual({ label: 'Ticket de soporte', value: 'INC-2026-1042' });
    expect(json.sections.browser.browserName).toEqual({ value: 'Firefox', status: 'estimated' });
    expect(json.sections.device.deviceMemory).toEqual({ value: null, status: 'unavailable' });
    expect(json.sections.browser.languages.value).toEqual(['es-ES', 'en']);
  });

  it('uses the default label and null when the identifier is empty', () => {
    const json = buildJson(sampleReport, { label: '', value: '   ' }, 'Identificador personalizado');
    expect(json.customIdentifier).toEqual({ label: 'Identificador personalizado', value: null });
  });

  it('round-trips through JSON.stringify', () => {
    const json = buildJson(sampleReport, { label: 'x', value: 'y' }, 'd');
    expect(JSON.parse(JSON.stringify(json))).toEqual(json);
  });
});

describe('sanitizeFilenamePart', () => {
  it.each([
    ['INC-2026-1042', 'INC-2026-1042'],
    ['Ticket #12345', 'Ticket-12345'],
    ['José Peña / caso: 7', 'Jose-Pena-caso-7'],
    ['../../etc/passwd', 'etc-passwd'],
    ['a<b>c:"d"|e?f*g\\h', 'a-b-c-d-e-f-g-h'],
    ['   ', ''],
    ['🔥🔥', ''],
    ['CON. ', 'CON'],
  ])('%j → %j', (input, expected) => {
    expect(sanitizeFilenamePart(input)).toBe(expected);
  });

  it('limits length without leaving trailing separators', () => {
    const out = sanitizeFilenamePart(`${'a'.repeat(59)} b`);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out).not.toMatch(/[-_.]$/);
  });
});

describe('buildFilename', () => {
  it('uses the identifier when present', () => {
    expect(buildFilename('INC-2026-1042', 'BC-AB12-CD34', 'json')).toBe('browser-check-INC-2026-1042.json');
  });
  it('falls back to the diagnostic ID', () => {
    expect(buildFilename('', 'BC-AB12-CD34', 'png')).toBe('browser-check-BC-AB12-CD34.png');
    expect(buildFilename('***', 'BC-AB12-CD34', 'png')).toBe('browser-check-BC-AB12-CD34.png');
  });
});

describe('downloadJson', () => {
  afterEach(() => vi.useRealTimers());

  it('creates a JSON blob and clicks a download link', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadJson({ hello: 'mundo' }, 'browser-check-x.json');

    expect(click).toHaveBeenCalledOnce();
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('browser-check-x.json');
    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe('application/json');
    expect(JSON.parse(await blob.text())).toEqual({ hello: 'mundo' });
    expect(document.querySelector('a[download]')).toBeNull();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
