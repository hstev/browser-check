import { useI18n } from '../i18n';
import type { DiagnosticSection } from '../lib/diagnostics/types';
import { FieldList } from './FieldList';
import { SECTION_ICONS } from './sectionIcons';

interface Props {
  section: DiagnosticSection;
  /** Include fields flagged as advanced (used by the printable report). */
  includeAdvanced?: boolean;
  /** Compact layout for the screenshot. */
  dense?: boolean;
}

export function SectionCard({ section, includeAdvanced = false, dense = false }: Props) {
  const { t } = useI18n();
  const fields = includeAdvanced ? section.fields : section.fields.filter((f) => !f.advanced);
  if (fields.length === 0) return null;
  const Icon = SECTION_ICONS[section.id];
  const headingId = `section-${section.id}${includeAdvanced ? '-full' : ''}`;

  return (
    <section aria-labelledby={headingId} className={`card break-inside-avoid ${dense ? 'px-4 py-3' : 'p-5'}`}>
      <header className={`flex gap-3 ${dense ? 'mb-1 items-center' : 'mb-2 items-start'}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Icon aria-hidden className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold tracking-tight">
            {t.sections[section.id]}
          </h2>
          {!dense && <p className="text-sm text-slate-500 dark:text-slate-400">{t.sectionDescriptions[section.id]}</p>}
        </div>
      </header>
      <FieldList fields={fields} dense={dense} />
    </section>
  );
}
