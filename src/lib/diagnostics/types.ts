/**
 * How a value was obtained:
 * - `detected`: read directly from a browser API.
 * - `estimated`: inferred (e.g. parsed from the User-Agent) and may be inaccurate.
 * - `unavailable`: the API is missing, blocked or returned nothing.
 */
export type FieldStatus = 'detected' | 'estimated' | 'unavailable';

export type FieldValue = string | number | boolean | string[] | null;

export type SectionId = 'browser' | 'device' | 'regional' | 'environment' | 'capabilities';

export type FieldId =
  // browser
  | 'browserName'
  | 'browserVersion'
  | 'renderingEngine'
  | 'platform'
  | 'language'
  | 'languages'
  | 'cookiesEnabled'
  | 'javascriptEnabled'
  | 'userAgent'
  | 'clientHintsBrands'
  // device
  | 'operatingSystem'
  | 'deviceType'
  | 'screenResolution'
  | 'availableScreen'
  | 'viewport'
  | 'pixelRatio'
  | 'colorDepth'
  | 'orientation'
  | 'touchSupport'
  | 'maxTouchPoints'
  | 'hardwareConcurrency'
  | 'deviceMemory'
  | 'onlineStatus'
  | 'connectionType'
  // regional
  | 'locale'
  | 'timeZone'
  | 'localDateTime'
  | 'utcOffset'
  // environment
  | 'pageUrl'
  | 'origin'
  | 'referrer'
  | 'protocol'
  | 'secureContext'
  | 'localStorage'
  | 'sessionStorage'
  | 'serviceWorker'
  | 'webrtc'
  // capabilities
  | 'webgl'
  | 'webgl2'
  | 'webassembly'
  | 'indexedDB'
  | 'clipboardApi'
  | 'webShare'
  | 'notifications'
  | 'pdfViewer'
  | 'colorScheme'
  | 'reducedMotion';

export interface DiagnosticField {
  id: FieldId;
  value: FieldValue;
  status: FieldStatus;
  /** Value is a key in the `enums` dictionary and must be translated for display. */
  enumValue?: boolean;
  /** Only shown inside "advanced technical details" in the UI (still exported everywhere). */
  advanced?: boolean;
}

export interface DiagnosticSection {
  id: SectionId;
  fields: DiagnosticField[];
}

export interface DiagnosticMeta {
  diagnosticId: string;
  /** ISO 8601, UTC. */
  generatedAt: string;
  appVersion: string;
}

export interface DiagnosticReport {
  meta: DiagnosticMeta;
  sections: DiagnosticSection[];
}

export interface CustomIdentifier {
  label: string;
  value: string;
}
