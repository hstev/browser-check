import type { Dictionary } from '../i18n/es';
import type { CustomIdentifier, DiagnosticField, DiagnosticReport } from './diagnostics/types';

/** Human-readable value for a field, localized. */
export function formatValue(field: DiagnosticField, t: Dictionary): string {
  const { value } = field;
  if (field.status === 'unavailable' || value === null) return t.values.unavailable;
  if (typeof value === 'boolean') return value ? t.values.yes : t.values.no;
  if (Array.isArray(value)) return value.join(', ');
  if (field.enumValue && typeof value === 'string') return t.enums[value] ?? value;
  return String(value);
}

export function identifierLabel(identifier: CustomIdentifier, t: Dictionary): string {
  return identifier.label.trim() || t.identifier.defaultLabel;
}

export function identifierValue(identifier: CustomIdentifier, t: Dictionary): string {
  return identifier.value.trim() || t.identifier.empty;
}

/** Plain-text report for pasting into email, chat or a ticketing system. */
export function buildTextReport(
  report: DiagnosticReport,
  identifier: CustomIdentifier,
  t: Dictionary,
): string {
  const lines: string[] = [];
  const title = `${t.report.title.toUpperCase()} — ${t.app.name}`;
  lines.push(title, '='.repeat(title.length), '');
  lines.push(`${identifierLabel(identifier, t)}: ${identifierValue(identifier, t)}`);
  lines.push(`${t.meta.diagnosticId}: ${report.meta.diagnosticId}`);
  lines.push(`${t.meta.generatedAt}: ${report.meta.generatedAt}`);
  lines.push(`${t.meta.appVersion}: ${report.meta.appVersion}`);

  for (const section of report.sections) {
    const heading = t.sections[section.id].toUpperCase();
    lines.push('', heading, '-'.repeat(heading.length));
    for (const f of section.fields) {
      const suffix = f.status === 'estimated' ? ` ${t.report.estimatedSuffix}` : '';
      lines.push(`${t.fields[f.id]}: ${formatValue(f, t)}${suffix}`);
    }
  }

  lines.push('', t.report.footer);
  return lines.join('\n');
}

export function findField(report: DiagnosticReport, id: DiagnosticField['id']): DiagnosticField | undefined {
  for (const section of report.sections) {
    const f = section.fields.find((x) => x.id === id);
    if (f) return f;
  }
  return undefined;
}
