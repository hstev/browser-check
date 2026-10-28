import type { CustomIdentifier, DiagnosticReport, FieldStatus, FieldValue } from './diagnostics/types';

export const JSON_SCHEMA_VERSION = 1;

export interface DiagnosticJson {
  schemaVersion: number;
  app: { name: string; version: string };
  diagnosticId: string;
  generatedAt: string;
  customIdentifier: { label: string; value: string | null };
  sections: Record<string, Record<string, { value: FieldValue; status: FieldStatus }>>;
}

/** Machine-friendly export: raw (untranslated) values plus how each one was obtained. */
export function buildJson(report: DiagnosticReport, identifier: CustomIdentifier, defaultLabel: string): DiagnosticJson {
  const sections: DiagnosticJson['sections'] = {};
  for (const section of report.sections) {
    sections[section.id] = Object.fromEntries(
      section.fields.map((f) => [f.id, { value: f.value, status: f.status }]),
    );
  }
  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    app: { name: 'Browser Check', version: report.meta.appVersion },
    diagnosticId: report.meta.diagnosticId,
    generatedAt: report.meta.generatedAt,
    customIdentifier: {
      label: identifier.label.trim() || defaultLabel,
      value: identifier.value.trim() || null,
    },
    sections,
  };
}

/**
 * Turns arbitrary user text into a safe filename fragment: strips accents and
 * characters invalid on Windows/macOS/Linux, collapses separators and limits length.
 */
export function sanitizeFilenamePart(input: string, maxLength = 60): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/[-_.]{2,}/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .slice(0, maxLength)
    .replace(/[-_.]+$/g, '');
}

/** `browser-check-INC-2026-1042.json`, falling back to the diagnostic ID. */
export function buildFilename(identifierValue: string, diagnosticId: string, extension: 'json' | 'png'): string {
  const part = sanitizeFilenamePart(identifierValue) || sanitizeFilenamePart(diagnosticId) || 'report';
  return `browser-check-${part}.${extension}`;
}
