import { CircleCheck, CircleDashed, CircleHelp, Stethoscope } from 'lucide-react';
import { forwardRef } from 'react';
import { useI18n } from '../i18n';
import type { CustomIdentifier, DiagnosticReport } from '../lib/diagnostics/types';
import { identifierLabel, identifierValue } from '../lib/report';
import { SectionCard } from './SectionCard';
import { Summary } from './Summary';

/** Width of the generated image (CSS px). Fixed so the PNG looks the same on phones and desktops. */
export const REPORT_SHEET_WIDTH = 800;

interface Props {
  report: DiagnosticReport;
  identifier: CustomIdentifier;
}

/**
 * Printable, control-free version of the report used to generate the PNG.
 * It includes every field, including the advanced ones.
 */
export const ReportSheet = forwardRef<HTMLDivElement, Props>(function ReportSheet({ report, identifier }, ref) {
  const { t } = useI18n();
  const hasValue = identifier.value.trim().length > 0;

  return (
    <div
      ref={ref}
      style={{ width: REPORT_SHEET_WIDTH }}
      className="space-y-5 bg-slate-50 p-10 font-sans text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100"
    >
      <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <Stethoscope aria-hidden className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{t.app.name}</p>
            <h1 className="text-xl font-semibold tracking-tight">{t.report.title}</h1>
          </div>
        </div>
        <dl className="text-right text-xs leading-relaxed">
          <div>
            <dt className="inline text-slate-500 dark:text-slate-400">{t.meta.diagnosticId}: </dt>
            <dd className="inline font-mono font-semibold">{report.meta.diagnosticId}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500 dark:text-slate-400">{t.meta.generatedAt}: </dt>
            <dd className="inline font-mono">{report.meta.generatedAt}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500 dark:text-slate-400">{t.meta.appVersion}: </dt>
            <dd className="inline font-mono">{report.meta.appVersion}</dd>
          </div>
        </dl>
      </header>

      <div className="rounded-2xl border-2 border-indigo-500/60 bg-white p-5 dark:bg-slate-900">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{identifierLabel(identifier, t)}</p>
        <p
          className={`mt-1 text-2xl font-semibold break-words [overflow-wrap:anywhere] ${hasValue ? '' : 'text-slate-400 italic dark:text-slate-500'}`}
        >
          {identifierValue(identifier, t)}
        </p>
      </div>

      <Summary report={report} headingLevel={3} />

      {report.sections.map((section) => (
        <SectionCard key={section.id} section={section} includeAdvanced />
      ))}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p>{t.report.footer}</p>
        <p className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <CircleCheck aria-hidden className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            {t.status.detected}
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleHelp aria-hidden className="size-3.5 text-amber-600 dark:text-amber-400" />
            {t.status.estimated}
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDashed aria-hidden className="size-3.5" />
            {t.status.unavailable}
          </span>
        </p>
      </footer>
    </div>
  );
});
