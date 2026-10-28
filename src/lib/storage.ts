type Area = 'local' | 'session';

function getArea(area: Area): Storage | null {
  try {
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    // Accessing storage can throw when cookies/site data are blocked.
    return null;
  }
}

/** Storage access that never throws. Only used for preferences and same-tab state. */
export const safeStorage = {
  get(area: Area, key: string): string | null {
    try {
      return getArea(area)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(area: Area, key: string, value: string): void {
    try {
      getArea(area)?.setItem(key, value);
    } catch {
      // Quota exceeded or storage disabled: the app keeps working without persistence.
    }
  },
  remove(area: Area, key: string): void {
    try {
      getArea(area)?.removeItem(key);
    } catch {
      // ignore
    }
  },
};
