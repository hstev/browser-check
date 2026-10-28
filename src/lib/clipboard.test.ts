import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canCopyImage, copyImage, copyText } from './clipboard';

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

describe('copyText', () => {
  beforeEach(() => {
    // jsdom does not implement execCommand; define it so it can be spied on.
    document.execCommand = vi.fn(() => true);
  });

  it('uses the async Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    await expect(copyText('hola')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hola');
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) });
    await expect(copyText('hola')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    // The temporary textarea is cleaned up.
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back to execCommand when the Clipboard API is missing (HTTP)', async () => {
    setClipboard(undefined);
    await expect(copyText('hola')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports failure when every method fails', async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn(() => false);
    await expect(copyText('hola')).resolves.toBe(false);
  });

  it('never throws even if execCommand throws', async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn(() => {
      throw new Error('boom');
    });
    await expect(copyText('hola')).resolves.toBe(false);
  });
});

describe('copyImage', () => {
  it('is unavailable without ClipboardItem', async () => {
    setClipboard({ write: vi.fn() });
    vi.stubGlobal('ClipboardItem', undefined);
    expect(canCopyImage()).toBe(false);
    await expect(copyImage(new Blob())).resolves.toBe(false);
  });

  it('writes a PNG ClipboardItem when supported', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write });
    const items: unknown[] = [];
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public data: Record<string, Promise<Blob>>) {
          items.push(data);
        }
      },
    );
    expect(canCopyImage()).toBe(true);
    const blob = new Blob(['x'], { type: 'image/png' });
    await expect(copyImage(blob)).resolves.toBe(true);
    expect(write).toHaveBeenCalledOnce();
    await expect((items[0] as Record<string, Promise<Blob>>)['image/png']).resolves.toBe(blob);
  });

  it('returns false when the write is rejected', async () => {
    setClipboard({ write: vi.fn().mockRejectedValue(new Error('denied')) });
    vi.stubGlobal('ClipboardItem', class {});
    await expect(copyImage(new Blob())).resolves.toBe(false);
  });
});
