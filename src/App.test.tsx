import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toCanvas = vi.hoisted(() => vi.fn());
vi.mock('html-to-image', () => ({ toCanvas }));

import { App } from './App';
import { I18nProvider } from './i18n';
import { REPORT_SHEET_WIDTH } from './components/ReportSheet';

const LONG_VALUE = `INC-2026-1042 ${'Referencia-muy-larga-sin-espacios'.repeat(4)}`.slice(0, 150);

function renderApp() {
  return render(
    <I18nProvider initialLocale="es">
      <App />
    </I18nProvider>,
  );
}

/** Captures what the screenshot library receives, since jsdom cannot actually paint. */
function mockCanvas() {
  const captured: { node: HTMLElement; html: string; options: Record<string, unknown> }[] = [];
  toCanvas.mockImplementation(async (node: HTMLElement, options: Record<string, unknown>) => {
    captured.push({ node, html: node.outerHTML, options });
    return { toBlob: (cb: (b: Blob) => void) => cb(new Blob(['png'], { type: 'image/png' })) };
  });
  return captured;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
  document.documentElement.classList.remove('dark');
  window.location.hash = '';
});

describe('App', () => {
  it('shows the identifier field, summary and sections in Spanish', async () => {
    renderApp();
    expect(screen.getByLabelText('Identificador personalizado')).toHaveAttribute(
      'placeholder',
      'Ticket #12345, nombre del usuario o referencia del caso',
    );
    expect(await screen.findByRole('heading', { name: 'Tu dispositivo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Navegador', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Configuración regional' })).toBeInTheDocument();
    expect(screen.getByText('Información técnica avanzada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar información/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Capturar pantalla/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Descargar JSON/ })).toBeEnabled();
    expect(screen.getByText(/no se envían a ningún servidor/)).toBeInTheDocument();
  });

  it('hides Share when the Web Share API is missing', async () => {
    renderApp();
    await screen.findByRole('heading', { name: 'Tu dispositivo' });
    expect(screen.queryByRole('button', { name: /Compartir/ })).toBeNull();
  });

  it('enforces the 150 character limit and lets the label be renamed', async () => {
    const user = userEvent.setup();
    renderApp();
    const input = screen.getByLabelText('Identificador personalizado');
    expect(input).toHaveAttribute('maxLength', '150');
    await user.type(input, 'INC-2026-1042');
    expect(screen.getByText('13 / 150')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cambiar nombre del campo/ }));
    const labelInput = screen.getByLabelText('Nombre del campo');
    await user.type(labelInput, 'Ticket de soporte{Enter}');
    expect(screen.getByLabelText('Ticket de soporte')).toHaveValue('INC-2026-1042');
  });

  it('prefills the identifier from the URL fragment', () => {
    window.location.hash = '#label=Ticket%20de%20soporte&value=INC-2026-1042';
    renderApp();
    expect(screen.getByLabelText('Ticket de soporte')).toHaveValue('INC-2026-1042');
  });

  it('copies a text report including the identifier', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderApp();
    // user-event installs its own clipboard stub during setup; replace it afterwards.
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await screen.findByRole('heading', { name: 'Tu dispositivo' });

    await user.type(screen.getByLabelText('Identificador personalizado'), 'INC-2026-1042');
    await user.click(screen.getByRole('button', { name: /Copiar información/ }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('Identificador personalizado: INC-2026-1042');
    expect(text).toMatch(/ID de diagnóstico: BD-/);
    expect(text).toContain('User-Agent:');
    expect(await screen.findByText(/Información copiada/)).toBeInTheDocument();
  });

  it('opens a manual copy dialog when copying is blocked', async () => {
    const user = userEvent.setup();
    renderApp();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    document.execCommand = vi.fn(() => false);
    await screen.findByRole('heading', { name: 'Tu dispositivo' });

    await user.click(screen.getByRole('button', { name: /Copiar información/ }));
    expect(await screen.findByText(/No se pudo copiar automáticamente/)).toBeInTheDocument();
    const dialog = screen.getByRole('dialog', { hidden: true });
    const textarea = within(dialog).getByRole('textbox', { hidden: true }) as HTMLTextAreaElement;
    expect(textarea.value).toContain('DIAGNÓSTICO DEL NAVEGADOR');
  });

  it('downloads JSON with a sanitized filename', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp();
    await screen.findByRole('heading', { name: 'Tu dispositivo' });

    await user.type(screen.getByLabelText('Identificador personalizado'), 'Ticket #12345 / José');
    await user.click(screen.getByRole('button', { name: /Descargar JSON/ }));

    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('browser-diagnostics-Ticket-12345-Jose.json');
    const json = JSON.parse(await createObjectURL.mock.calls[0][0].text());
    expect(json.customIdentifier).toEqual({ label: 'Identificador personalizado', value: 'Ticket #12345 / José' });
    expect(json.sections.browser.userAgent.status).toBe('detected');
  });

  it.each([
    { theme: 'light', viewport: 1280 },
    { theme: 'dark', viewport: 375 },
  ])('captures the full report ($theme theme, $viewport px viewport) with long values', async ({ theme, viewport }) => {
    const user = userEvent.setup();
    const captured = mockCanvas();
    URL.createObjectURL = vi.fn(() => 'blob:png');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    window.innerWidth = viewport;
    if (theme === 'dark') localStorage.setItem('bd:theme', 'dark');

    renderApp();
    await screen.findByRole('heading', { name: 'Tu dispositivo' });
    expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark');

    await user.type(screen.getByLabelText('Identificador personalizado'), LONG_VALUE);
    await user.click(screen.getByRole('button', { name: /Capturar pantalla/ }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^browser-diagnostics-INC-2026-1042-.+\.png$/);

    const { node, html, options } = captured.at(-1)!;
    // Fixed-width sheet, independent of the viewport.
    expect(node.style.width).toBe(`${REPORT_SHEET_WIDTH}px`);
    // Report header, identifier, and every section including advanced fields.
    expect(html).toContain('Browser Diagnostics');
    expect(html).toMatch(/BD-[0-9A-Z]{4}-[0-9A-Z]{4}/);
    expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    expect(html).toContain(LONG_VALUE);
    expect(html).toContain('[overflow-wrap:anywhere]');
    for (const heading of ['Navegador', 'Dispositivo y sistema operativo', 'Configuración regional', 'Entorno de la página', 'Funciones compatibles', 'User-Agent']) {
      expect(html).toContain(heading);
    }
    // No interactive controls in the image.
    expect(node.querySelector('button, input, select')).toBeNull();
    expect(options.pixelRatio).toBeGreaterThan(0);
    // The off-screen sheet is removed after capturing.
    await waitFor(() => expect(document.querySelector('[inert]')).toBeNull());
    expect(await screen.findByText(/Captura descargada/)).toBeInTheDocument();
  });

  it('shows a helpful error when the screenshot fails', async () => {
    const user = userEvent.setup();
    toCanvas.mockRejectedValue(new Error('tainted'));
    renderApp();
    await screen.findByRole('heading', { name: 'Tu dispositivo' });
    await user.click(screen.getByRole('button', { name: /Capturar pantalla/ }));
    expect(await screen.findByText(/No se pudo generar la captura/)).toBeInTheDocument();
  });

  it('switches to English', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.selectOptions(screen.getByLabelText('Idioma de la interfaz'), 'en');
    expect(await screen.findByRole('heading', { name: 'Your device' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
