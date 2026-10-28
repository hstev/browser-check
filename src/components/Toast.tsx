import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect } from 'react';
import { useI18n } from '../i18n';

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, toast.kind === 'error' ? 8000 : 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    // The live region stays mounted so screen readers announce new messages reliably.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toast && (
        <div
          key={toast.id}
          className={[
            'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
            toast.kind === 'success'
              ? 'border-emerald-200 bg-white text-slate-900 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100'
              : 'border-rose-200 bg-white text-slate-900 dark:border-rose-500/30 dark:bg-slate-900 dark:text-slate-100',
          ].join(' ')}
        >
          {toast.kind === 'success' ? (
            <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <p className="flex-1">{toast.text}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="-m-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">{t.toast.dismiss}</span>
          </button>
        </div>
      )}
    </div>
  );
}
