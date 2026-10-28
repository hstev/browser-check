import { CircleCheck, CircleDashed, CircleHelp } from 'lucide-react';
import { useI18n } from '../i18n';
import type { DiagnosticField, FieldStatus } from '../lib/diagnostics/types';
import { formatValue } from '../lib/report';

const MONO_FIELDS = new Set(['userAgent', 'pageUrl', 'origin', 'referrer', 'clientHintsBrands']);

export function StatusBadge({ status, compact = false }: { status: FieldStatus; compact?: boolean }) {
  const { t } = useI18n();
  if (status === 'detected') {
    return (
      <span className="inline-flex shrink-0 items-center text-emerald-600 dark:text-emerald-400" title={t.statusHelp.detected}>
        <CircleCheck aria-hidden className="size-3.5" />
        <span className="sr-only">{t.status.detected}</span>
      </span>
    );
  }
  const styles =
    status === 'estimated'
      ? 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20'
      : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700';
  const Icon = status === 'estimated' ? CircleHelp : CircleDashed;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${styles}`}
      title={t.statusHelp[status]}
    >
      <Icon aria-hidden className="size-3" />
      <span className={compact ? 'sr-only' : undefined}>{t.status[status]}</span>
    </span>
  );
}

/** `dense`: label and value always side by side with tighter rows (used by the screenshot). */
export function FieldList({ fields, dense = false }: { fields: DiagnosticField[]; dense?: boolean }) {
  const { t } = useI18n();
  const rowClass = dense
    ? 'grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 py-1.5'
    : 'grid gap-1 py-2.5 @md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @md:gap-4';
  return (
    <dl className="@container divide-y divide-slate-100 dark:divide-slate-800">
      {fields.map((f) => {
        const unavailable = f.status === 'unavailable';
        const mono = MONO_FIELDS.has(f.id);
        return (
          <div key={f.id} className={rowClass}>
            <dt className="text-sm text-slate-500 dark:text-slate-400">{t.fields[f.id]}</dt>
            <dd className={`flex min-w-0 items-start gap-2 ${dense ? 'justify-start' : 'justify-between @md:justify-start'}`}>
              <span
                className={[
                  'min-w-0 text-sm break-words [overflow-wrap:anywhere]',
                  unavailable ? 'text-slate-400 italic dark:text-slate-500' : 'font-medium text-slate-900 dark:text-slate-100',
                  mono && !unavailable ? 'font-mono text-[13px] font-normal' : '',
                ].join(' ')}
              >
                {formatValue(f, t)}
              </span>
              <span className="mt-0.5">
                <StatusBadge status={f.status} compact={unavailable} />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
