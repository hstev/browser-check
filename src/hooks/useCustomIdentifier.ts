import { useEffect, useState } from 'react';
import type { CustomIdentifier } from '../lib/diagnostics/types';
import { safeStorage } from '../lib/storage';

export const IDENTIFIER_MAX_LENGTH = 150;
export const LABEL_MAX_LENGTH = 60;

// sessionStorage keeps the value across accidental reloads but is cleared when the tab closes.
const STORAGE_KEY = 'bd:identifier';

/**
 * Support teams can prefill the field with a link such as
 * `https://example.com/#label=Ticket%20de%20soporte&value=INC-2026-1042`.
 * The URL fragment (after `#`) is never sent to the server.
 */
export function readIdentifierFromHash(hash: string): Partial<CustomIdentifier> {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const result: Partial<CustomIdentifier> = {};
  const label = params.get('label');
  const value = params.get('value') ?? params.get('id');
  if (label) result.label = label.slice(0, LABEL_MAX_LENGTH);
  if (value) result.value = value.slice(0, IDENTIFIER_MAX_LENGTH);
  return result;
}

function readStored(): Partial<CustomIdentifier> {
  const raw = safeStorage.get('session', STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<CustomIdentifier>;
    return {
      label: typeof parsed.label === 'string' ? parsed.label.slice(0, LABEL_MAX_LENGTH) : undefined,
      value: typeof parsed.value === 'string' ? parsed.value.slice(0, IDENTIFIER_MAX_LENGTH) : undefined,
    };
  } catch {
    return {};
  }
}

function initial(): CustomIdentifier {
  const stored = readStored();
  const fromHash = readIdentifierFromHash(typeof location === 'undefined' ? '' : location.hash);
  return {
    label: fromHash.label ?? stored.label ?? import.meta.env.VITE_IDENTIFIER_LABEL ?? '',
    value: fromHash.value ?? stored.value ?? '',
  };
}

export function useCustomIdentifier() {
  const [identifier, setIdentifier] = useState<CustomIdentifier>(initial);

  useEffect(() => {
    safeStorage.set('session', STORAGE_KEY, JSON.stringify(identifier));
  }, [identifier]);

  return {
    identifier,
    setValue: (value: string) => setIdentifier((p) => ({ ...p, value: value.slice(0, IDENTIFIER_MAX_LENGTH) })),
    setLabel: (label: string) => setIdentifier((p) => ({ ...p, label: label.slice(0, LABEL_MAX_LENGTH) })),
  };
}
