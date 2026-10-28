import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';

/** Shown when automatic copying is blocked, so the user can still copy the report by hand. */
export function ManualCopyDialog({ text, onClose }: { text: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (text !== null && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      textareaRef.current?.focus();
      textareaRef.current?.select();
    } else if (text === null && dialog.open) {
      dialog.close?.();
    }
  }, [text]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="manual-copy-title"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
        <div>
          <h2 id="manual-copy-title" className="text-base font-semibold">
            {t.manualCopy.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.manualCopy.body}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <X aria-hidden className="size-5" />
          <span className="sr-only">{t.manualCopy.close}</span>
        </button>
      </div>
      <div className="p-5">
        <textarea
          ref={textareaRef}
          readOnly
          value={text ?? ''}
          aria-label={t.manualCopy.title}
          rows={14}
          className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </dialog>
  );
}
