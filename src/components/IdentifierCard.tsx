import { Check, Pencil, Tag } from 'lucide-react';
import { useId, useState } from 'react';
import { IDENTIFIER_MAX_LENGTH, LABEL_MAX_LENGTH } from '../hooks/useCustomIdentifier';
import { useI18n } from '../i18n';
import type { CustomIdentifier } from '../lib/diagnostics/types';
import { identifierLabel } from '../lib/report';

interface Props {
  identifier: CustomIdentifier;
  onValueChange: (value: string) => void;
  onLabelChange: (label: string) => void;
}

export function IdentifierCard({ identifier, onValueChange, onLabelChange }: Props) {
  const { t } = useI18n();
  const [editingLabel, setEditingLabel] = useState(false);
  const inputId = useId();
  const helpId = useId();
  const counterId = useId();
  const labelInputId = useId();
  const label = identifierLabel(identifier, t);
  const nearLimit = identifier.value.length >= IDENTIFIER_MAX_LENGTH - 10;

  return (
    <section className="card relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {editingLabel ? (
          <div className="flex w-full flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={labelInputId} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.identifier.labelFieldLabel}
              </label>
              <input
                id={labelInputId}
                type="text"
                autoFocus
                value={identifier.label}
                placeholder={t.identifier.defaultLabel}
                maxLength={LABEL_MAX_LENGTH}
                onChange={(e) => onLabelChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={() => setEditingLabel(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Check aria-hidden className="size-4" />
              {t.identifier.doneEditing}
            </button>
          </div>
        ) : (
          <>
            <label htmlFor={inputId} className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Tag aria-hidden className="size-4 text-indigo-600 dark:text-indigo-400" />
              {label}
            </label>
            <button
              type="button"
              onClick={() => setEditingLabel(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Pencil aria-hidden className="size-3.5" />
              {t.identifier.editLabel}
            </button>
          </>
        )}
      </div>

      <input
        id={inputId}
        type="text"
        value={identifier.value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={t.identifier.placeholder}
        maxLength={IDENTIFIER_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={`${helpId} ${counterId}`}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-inner shadow-slate-900/[0.02] placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      <div className="mt-2 flex items-start justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p id={helpId}>{t.identifier.help}</p>
        <p id={counterId} className={`shrink-0 tabular-nums ${nearLimit ? 'font-medium text-amber-700 dark:text-amber-400' : ''}`}>
          {t.identifier.counter(identifier.value.length, IDENTIFIER_MAX_LENGTH)}
        </p>
      </div>
    </section>
  );
}
