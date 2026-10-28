import { Lock, ShieldAlert } from 'lucide-react';
import { useI18n } from '../i18n';
import type { FieldStatus } from '../lib/diagnostics/types';
import { StatusBadge } from './FieldList';

export function PrivacyNotice() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="privacy-heading" className="card flex gap-3 p-5">
      <Lock aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
        <h2 id="privacy-heading" className="font-semibold text-slate-900 dark:text-slate-100">
          {t.privacy.title}
        </h2>
        <p>{t.privacy.notice}</p>
        <p>{t.privacy.approximate}</p>
        <p>{t.privacy.notCollected}</p>
      </div>
    </section>
  );
}

export function StatusLegend() {
  const { t } = useI18n();
  const statuses: FieldStatus[] = ['detected', 'estimated', 'unavailable'];
  return (
    <section aria-labelledby="legend-heading" className="card p-5">
      <h2 id="legend-heading" className="mb-3 text-sm font-semibold">
        {t.legend}
      </h2>
      <ul className="space-y-2 text-sm">
        {statuses.map((s) => (
          <li key={s} className="flex items-start gap-2">
            <span className="mt-0.5 flex w-28 shrink-0 items-center gap-1.5">
              <StatusBadge status={s} />
              {s === 'detected' && <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{t.status.detected}</span>}
            </span>
            <span className="text-slate-600 dark:text-slate-400">{t.statusHelp[s]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InsecureContextBanner() {
  const { t } = useI18n();
  return (
    <div role="note" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
      <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">{t.insecure.title}</p>
        <p>{t.insecure.body}</p>
      </div>
    </div>
  );
}
