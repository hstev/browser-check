import { useCallback, useEffect, useRef, useState } from 'react';
import { collectDiagnostics } from '../lib/diagnostics/collect';
import type { DiagnosticReport } from '../lib/diagnostics/types';

/**
 * Collects diagnostics on mount and re-collects when the connection, window size
 * or orientation changes. The diagnostic ID stays stable for the page's lifetime.
 */
export function useDiagnostics() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const idRef = useRef<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    const next = await collectDiagnostics(window, { diagnosticId: idRef.current });
    idRef.current = next.meta.diagnosticId;
    setReport(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 400);
    };
    const events = ['online', 'offline', 'resize', 'orientationchange'] as const;
    events.forEach((e) => window.addEventListener(e, debounced));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, debounced));
    };
  }, [refresh]);

  return { report, refresh };
}
