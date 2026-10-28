import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { safeStorage } from '../lib/storage';
import { en } from './en';
import { es, type Dictionary } from './es';

// To add a language: create a dictionary typed as `Dictionary` and register it here.
export const dictionaries = { es, en } satisfies Record<string, Dictionary>;
export type Locale = keyof typeof dictionaries;
export const DEFAULT_LOCALE: Locale = 'es';

const STORAGE_KEY = 'bc:locale';

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value !== null && value in dictionaries;
}

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    const stored = safeStorage.get('local', STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: dictionaries[locale],
      setLocale: (next) => {
        setLocaleState(next);
        safeStorage.set('local', STORAGE_KEY, next);
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
