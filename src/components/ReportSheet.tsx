import { CircleCheck, CircleDashed, CircleHelp } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { forwardRef } from 'react';
import { useI18n } from '../i18n';
import type { CustomIdentifier, DiagnosticReport } from '../lib/diagnostics/types';
import { identifierLabel, identifierValue } from '../lib/report';
import { SectionCard } from './SectionCard';
import { Summary } from './Summary';

/**
 * Width of the generated image (CSS px). Fixed so the PNG looks the same on phones and desktops,
 * and wide enough for a multi-column layout: a landscape image stays readable when a viewer
 * fits it to the screen, whereas a tall one gets shrunk until the text blurs.
 */
export const REPORT_SHEET_WIDTH = 1400;

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
      className="space-y-4 bg-slate-50 p-8 font-sans text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100"
    >
      <header className="flex items-center justify-between gap-6 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" />
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

      <div className="flex items-baseline gap-4 rounded-2xl border-2 border-indigo-500/60 bg-white px-5 py-3 dark:bg-slate-900">
        <p className="shrink-0 text-sm font-medium text-indigo-700 dark:text-indigo-300">{identifierLabel(identifier, t)}</p>
        <p
          className={`min-w-0 text-xl font-semibold break-words [overflow-wrap:anywhere] ${hasValue ? '' : 'text-slate-400 italic dark:text-slate-500'}`}
        >
          {identifierValue(identifier, t)}
        </p>
      </div>

      <Summary report={report} headingLevel={3} compact />

      <div className="columns-3 gap-4 [&>*]:mb-4">
        {report.sections.map((section) => (
          <SectionCard key={section.id} section={section} includeAdvanced dense />
        ))}
      </div>

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
