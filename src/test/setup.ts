import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

(globalThis as unknown as { __APP_VERSION__: string }).__APP_VERSION__ = 'test';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
