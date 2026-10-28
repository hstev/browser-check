import { Camera, ClipboardCopy, FileJson, Images, Loader2, Share2, type LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n';

export type ActionKey = 'copy' | 'screenshot' | 'copyImage' | 'json' | 'share';

interface Props {
  busy: ActionKey | null;
  disabled: boolean;
  canCopyImage: boolean;
  canShare: boolean;
  onAction: (action: ActionKey) => void;
}

interface ActionDef {
  key: ActionKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  primary?: boolean;
}

export function ActionBar({ busy, disabled, canCopyImage, canShare, onAction }: Props) {
  const { t } = useI18n();
  const actions: ActionDef[] = [
    { key: 'copy', label: t.actions.copy, hint: t.actions.copyHint, icon: ClipboardCopy, primary: true },
    { key: 'screenshot', label: t.actions.screenshot, hint: t.actions.screenshotHint, icon: Camera },
    ...(canCopyImage ? [{ key: 'copyImage' as const, label: t.actions.copyImage, hint: t.actions.copyImageHint, icon: Images }] : []),
    { key: 'json', label: t.actions.json, hint: t.actions.jsonHint, icon: FileJson },
    ...(canShare ? [{ key: 'share' as const, label: t.actions.share, hint: t.actions.shareHint, icon: Share2 }] : []),
  ];

  return (
    <section aria-labelledby="actions-heading" className="card p-4 sm:p-5">
      <h2 id="actions-heading" className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {t.actions.title}
      </h2>
      <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {actions.map(({ key, label, hint, icon: Icon, primary }) => {
          const isBusy = busy === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onAction(key)}
              disabled={disabled || busy !== null}
              aria-busy={isBusy || undefined}
              className={[
                'group flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                primary
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                  : 'border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {isBusy ? (
                <Loader2 aria-hidden className="size-5 shrink-0 animate-spin" />
              ) : (
                <Icon aria-hidden className={`size-5 shrink-0 ${primary ? '' : 'text-indigo-600 dark:text-indigo-400'}`} />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{isBusy ? t.actions.working : label}</span>
                <span className={`block text-xs ${primary ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
