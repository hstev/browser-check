import { Fingerprint, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ActionBar, type ActionKey } from './components/ActionBar';
import { AdvancedDetails } from './components/AdvancedDetails';
import { Header } from './components/Header';
import { IdentifierCard } from './components/IdentifierCard';
import { ManualCopyDialog } from './components/ManualCopyDialog';
import { InsecureContextBanner, PrivacyNotice, StatusLegend } from './components/Notices';
import { ReportSheet } from './components/ReportSheet';
import { SectionCard } from './components/SectionCard';
import { Summary } from './components/Summary';
import { Toast, type ToastMessage } from './components/Toast';
import { useCustomIdentifier } from './hooks/useCustomIdentifier';
import { useDiagnostics } from './hooks/useDiagnostics';
import { useTheme } from './hooks/useTheme';
import { useI18n } from './i18n';
import { canCopyImage, copyImage, copyText } from './lib/clipboard';
import { downloadBlob, downloadJson } from './lib/download';
import { buildFilename, buildJson } from './lib/export';
import { buildTextReport } from './lib/report';
import { renderNodeToPng } from './lib/screenshot';
import { canShare, shareReport } from './lib/share';

export function App() {
  const { t } = useI18n();
  const theme = useTheme();
  const { report, refresh } = useDiagnostics();
  const { identifier, setValue, setLabel } = useCustomIdentifier();

  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const notify = useCallback((kind: ToastMessage['kind'], text: string) => {
    setToast({ id: Date.now(), kind, text });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  /** Mounts the printable report off-screen, renders it to PNG and unmounts it. */
  const capture = useCallback(async (): Promise<Blob> => {
    flushSync(() => setCapturing(true));
    try {
      const node = sheetRef.current;
      if (!node) throw new Error('Report sheet not mounted');
      return await renderNodeToPng(node);
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleAction = async (action: ActionKey) => {
    if (!report) return;
    const pngName = buildFilename(identifier.value, report.meta.diagnosticId, 'png');
    setBusy(action);
    try {
      switch (action) {
        case 'copy': {
          const text = buildTextReport(report, identifier, t);
          if (await copyText(text)) {
            notify('success', t.toast.copied);
          } else {
            notify('error', t.toast.copyFailed);
            setManualCopyText(text);
          }
          break;
        }
        case 'screenshot': {
          try {
            downloadBlob(await capture(), pngName);
            notify('success', t.toast.screenshotSaved);
          } catch {
            notify('error', t.toast.screenshotFailed);
          }
          break;
        }
        case 'copyImage': {
          // Start rendering synchronously so the clipboard write keeps the user gesture (Safari).
          const pending = capture();
          pending.catch(() => undefined);
          if (await copyImage(pending)) {
            notify('success', t.toast.imageCopied);
            break;
          }
          try {
            downloadBlob(await pending, pngName);
            notify('success', t.toast.imageCopyFallback);
          } catch {
            notify('error', t.toast.screenshotFailed);
          }
          break;
        }
        case 'json': {
          try {
            downloadJson(
              buildJson(report, identifier, t.identifier.defaultLabel),
              buildFilename(identifier.value, report.meta.diagnosticId, 'json'),
            );
            notify('success', t.toast.jsonSaved);
          } catch {
            notify('error', t.toast.jsonFailed);
          }
          break;
        }
        case 'share': {
          const result = await shareReport({ title: t.report.title, text: buildTextReport(report, identifier, t) });
          if (result === 'failed') notify('error', t.toast.shareFailed);
          break;
        }
      }
    } finally {
      setBusy(null);
    }
  };

  const insecure = typeof window !== 'undefined' && window.isSecureContext === false;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t.skipToContent}
      </a>
      <Header theme={theme.preference} onThemeChange={theme.setPreference} />

      <main id="main" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t.app.tagline}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{t.app.intro}</p>
          </div>
          {report && (
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
                <Fingerprint aria-hidden className="size-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">{t.meta.diagnosticId}:</span>
                <span className="font-mono font-semibold">{report.meta.diagnosticId}</span>
              </span>
              <button
                type="button"
                onClick={() => void refresh().then(() => notify('success', t.toast.refreshed))}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                title={t.actions.refresh}
              >
                <RefreshCw aria-hidden className="size-4" />
                <span className="sr-only sm:not-sr-only">{t.actions.refresh}</span>
              </button>
            </div>
          )}
        </div>

        {insecure && <InsecureContextBanner />}

        <IdentifierCard identifier={identifier} onValueChange={setValue} onLabelChange={setLabel} />

        <ActionBar
          busy={busy}
          disabled={!report}
          canCopyImage={canCopyImage()}
          canShare={canShare()}
          onAction={(a) => void handleAction(a)}
        />

        {report ? (
          <>
            <Summary report={report} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
              {report.sections.map((s) => (
                <SectionCard key={s.id} section={s} />
              ))}
            </div>
            <AdvancedDetails report={report} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.meta.generatedAt}: <span className="font-mono">{report.meta.generatedAt}</span> · {t.meta.appVersion}:{' '}
              <span className="font-mono">{report.meta.appVersion}</span>
            </p>
          </>
        ) : (
          <p className="card flex items-center gap-2 p-5 text-sm text-slate-500" role="status">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {t.loading}
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
          <PrivacyNotice />
          <StatusLegend />
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-24 text-xs text-slate-500 sm:px-6 dark:text-slate-400">
        {t.app.name} · {t.footer.openSource}
      </footer>

      {capturing && report && (
        // Rendered off-screen (not hidden) so the browser lays it out for the image.
        <div aria-hidden="true" inert className="pointer-events-none fixed top-0 left-[-10000px]">
          <ReportSheet ref={sheetRef} report={report} identifier={identifier} />
        </div>
      )}

      <ManualCopyDialog text={manualCopyText} onClose={() => setManualCopyText(null)} />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
