/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Default label for the custom identifier field, e.g. "Ticket de soporte". */
  readonly VITE_IDENTIFIER_LABEL?: string;
}
