import { AppWindow, Clock, Globe, Languages, Laptop, Monitor, Smartphone, Tablet, Wifi, WifiOff, type LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import type { DiagnosticField, DiagnosticReport, FieldStatus } from '../lib/diagnostics/types';
import { findField, formatValue } from '../lib/report';
import { StatusBadge } from './FieldList';

interface Tile {
  key: string;
  label: string;
  value: string;
  status: FieldStatus;
  icon: LucideIcon;
  tone?: 'ok' | 'warn';
}

function deviceIcon(field?: DiagnosticField): LucideIcon {
  if (field?.value === 'mobile') return Smartphone;
  if (field?.value === 'tablet') return Tablet;
  return Laptop;
}

export function Summary({ report, headingLevel = 2 }: { report: DiagnosticReport; headingLevel?: 2 | 3 }) {
  const { t } = useI18n();
  const get = (id: DiagnosticField['id']) => findField(report, id);

  const name = get('browserName');
  const version = get('browserVersion');
  const browserValue =
    !name || name.status === 'unavailable'
      ? t.values.unavailable
      : [formatValue(name, t), version && version.status !== 'unavailable' ? formatValue(version, t) : null]
          .filter(Boolean)
          .join(' ');
  const online = get('onlineStatus');

  const tiles: Tile[] = [
    { key: 'browser', label: t.summary.browser, value: browserValue, status: name?.status ?? 'unavailable', icon: Globe },
    { key: 'os', label: t.summary.os, value: fmt(get('operatingSystem')), status: st(get('operatingSystem')), icon: Monitor },
    { key: 'device', label: t.summary.device, value: fmt(get('deviceType')), status: st(get('deviceType')), icon: deviceIcon(get('deviceType')) },
    { key: 'screen', label: t.summary.screen, value: fmt(get('screenResolution')), status: st(get('screenResolution')), icon: Monitor },
    { key: 'viewport', label: t.fields.viewport, value: fmt(get('viewport')), status: st(get('viewport')), icon: AppWindow },
    { key: 'language', label: t.summary.language, value: fmt(get('language')), status: st(get('language')), icon: Languages },
    { key: 'tz', label: t.summary.timeZone, value: fmt(get('timeZone')), status: st(get('timeZone')), icon: Clock },
    {
      key: 'connection',
      label: t.summary.connection,
      value: fmt(online),
      status: st(online),
      icon: online?.value === 'offline' ? WifiOff : Wifi,
      tone: online?.value === 'offline' ? 'warn' : online?.value === 'online' ? 'ok' : undefined,
    },
  ];

  function fmt(f?: DiagnosticField) {
    return f ? formatValue(f, t) : t.values.unavailable;
  }
  function st(f?: DiagnosticField): FieldStatus {
    return f?.status ?? 'unavailable';
  }

  const Heading = `h${headingLevel}` as const;

  return (
    <section aria-labelledby={`summary-heading-${headingLevel}`} className="@container">
      <Heading id={`summary-heading-${headingLevel}`} className="mb-3 text-lg font-semibold tracking-tight">
        {t.summary.title}
      </Heading>
      <ul className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-4">
        {tiles.map(({ key, label, value, status, icon: Icon, tone }) => (
          <li key={key} className="card flex items-start gap-3 p-4">
            <span
              className={[
                'grid size-9 shrink-0 place-items-center rounded-xl',
                tone === 'ok'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : tone === 'warn'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              ].join(' ')}
            >
              <Icon aria-hidden className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <p
                className={[
                  'mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-snug font-semibold break-words [overflow-wrap:anywhere]',
                  status === 'unavailable' ? 'font-normal text-slate-400 italic dark:text-slate-500' : '',
                ].join(' ')}
              >
                <span>{value}</span>
                {status === 'estimated' && <StatusBadge status="estimated" />}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
