import { ChevronDown, Wrench } from 'lucide-react';
import { useI18n } from '../i18n';
import type { DiagnosticReport } from '../lib/diagnostics/types';
import { FieldList } from './FieldList';

export function AdvancedDetails({ report }: { report: DiagnosticReport }) {
  const { t } = useI18n();
  const groups = report.sections
    .map((s) => ({ id: s.id, fields: s.fields.filter((f) => f.advanced) }))
    .filter((g) => g.fields.length > 0);

  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 select-none hover:bg-slate-50 dark:hover:bg-slate-800/40 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Wrench aria-hidden className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold tracking-tight">{t.advanced.title}</span>
          <span className="block text-sm text-slate-500 dark:text-slate-400">{t.advanced.description}</span>
        </span>
        <ChevronDown aria-hidden className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-x-8 gap-y-5 border-t border-slate-200 p-5 lg:grid-cols-2 dark:border-slate-800">
        {groups.map((g) => (
          <div key={g.id} className={g.id === 'browser' ? 'lg:col-span-2' : undefined}>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {t.sections[g.id]}
            </h3>
            <FieldList fields={g.fields} />
          </div>
        ))}
      </div>
    </details>
  );
}
