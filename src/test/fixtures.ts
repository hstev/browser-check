import type { DiagnosticReport } from '../lib/diagnostics/types';

export const sampleReport: DiagnosticReport = {
  meta: { diagnosticId: 'BD-AB12-CD34', generatedAt: '2026-10-28T15:30:00.000Z', appVersion: '1.0.0' },
  sections: [
    {
      id: 'browser',
      fields: [
        { id: 'browserName', value: 'Firefox', status: 'estimated' },
        { id: 'cookiesEnabled', value: true, status: 'detected' },
        { id: 'languages', value: ['es-ES', 'en'], status: 'detected' },
      ],
    },
    {
      id: 'device',
      fields: [
        { id: 'deviceType', value: 'mobile', status: 'estimated', enumValue: true },
        { id: 'deviceMemory', value: null, status: 'unavailable' },
        { id: 'touchSupport', value: false, status: 'detected' },
      ],
    },
  ],
};
