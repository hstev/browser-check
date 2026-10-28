import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { sampleReport } from '../test/fixtures';
import { buildTextReport, formatValue } from './report';


describe('formatValue', () => {
  it('localizes booleans, enums, arrays and missing values', () => {
    const [browser, device] = sampleReport.sections;
    expect(formatValue(browser.fields[1], es)).toBe('Sí');
    expect(formatValue(browser.fields[2], es)).toBe('es-ES, en');
    expect(formatValue(device.fields[0], es)).toBe('Teléfono móvil');
    expect(formatValue(device.fields[0], en)).toBe('Mobile phone');
    expect(formatValue(device.fields[1], es)).toBe('No disponible');
    expect(formatValue(device.fields[2], en)).toBe('No');
  });
});

describe('buildTextReport', () => {
  it('includes the custom identifier, metadata and every section', () => {
    const text = buildTextReport(sampleReport, { label: 'Ticket de soporte', value: 'INC-2026-1042' }, es);
    expect(text).toContain('Ticket de soporte: INC-2026-1042');
    expect(text).toContain('ID de diagnóstico: BC-AB12-CD34');
    expect(text).toContain('Generado (UTC): 2026-10-28T15:30:00.000Z');
    expect(text).toContain('Versión de la aplicación: 1.0.0');
    expect(text).toContain('NAVEGADOR\n---------');
    expect(text).toContain('DISPOSITIVO Y SISTEMA OPERATIVO');
    expect(text).toContain('Navegador: Firefox (estimado)');
    expect(text).toContain('Memoria del dispositivo: No disponible');
    expect(text).toContain('Tipo de dispositivo: Teléfono móvil (estimado)');
  });

  it('falls back to the default label and an explicit empty value', () => {
    const text = buildTextReport(sampleReport, { label: '  ', value: '' }, es);
    expect(text).toContain('Identificador personalizado: Sin especificar');
  });

  it('can be produced in English', () => {
    const text = buildTextReport(sampleReport, { label: '', value: 'Case 7' }, en);
    expect(text).toContain('Custom identifier: Case 7');
    expect(text).toContain('Device memory: Not available');
    expect(text).toContain('Browser: Firefox (estimated)');
  });
});
