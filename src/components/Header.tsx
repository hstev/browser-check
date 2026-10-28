import { Monitor, Moon, Stethoscope, Sun } from 'lucide-react';
import type { ThemePreference } from '../hooks/useTheme';
import { dictionaries, useI18n, type Locale } from '../i18n';

interface Props {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

const THEME_OPTIONS = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const;

export function Header({ theme, onThemeChange }: Props) {
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-[#0b0f19]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
            <Stethoscope aria-hidden className="size-[18px]" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">{t.app.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="locale-select">
            {t.languageSwitch}
          </label>
          <select
            id="locale-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {(Object.keys(dictionaries) as Locale[]).map((code) => (
              <option key={code} value={code}>
                {dictionaries[code].languageName}
              </option>
            ))}
          </select>

          <div
            role="group"
            aria-label={t.theme.label}
            className="flex h-9 items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
          >
            {THEME_OPTIONS.map(({ value, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  title={t.theme[value]}
                  onClick={() => onThemeChange(value)}
                  className={[
                    'grid size-7 place-items-center rounded-md transition-colors',
                    active
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                  ].join(' ')}
                >
                  <Icon aria-hidden className="size-4" />
                  <span className="sr-only">{t.theme[value]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
