import { useCallback, useEffect, useState } from 'react';
import { safeStorage } from '../lib/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'bc:theme';
const QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia?.(QUERY).matches ?? false;
  } catch {
    return false;
  }
}

function readPreference(): ThemePreference {
  const stored = safeStorage.get('local', STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    let mql: MediaQueryList | undefined;
    try {
      mql = window.matchMedia?.(QUERY);
    } catch {
      return;
    }
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql?.removeEventListener?.('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (next === 'system') safeStorage.remove('local', STORAGE_KEY);
    else safeStorage.set('local', STORAGE_KEY, next);
  }, []);

  return { preference, resolved, setPreference };
}
