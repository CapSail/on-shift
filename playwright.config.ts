import { defineConfig } from '@playwright/test';

// Tests run against the production build served by `vite preview` (npm test builds first).
// One build, two projects: each shift's own suite, plus the tests of the shell that joins them.
const ORIGIN = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: ORIGIN,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  },
  projects: [
    // the SOC game: a fresh browser lands here by default
    { name: 'soc', testDir: './tests/soc' },
    // SHIFTY-1's own suite, run as it was written: the only difference is that the SHIFTY-1 shift is already picked
    {
      name: 'ai',
      testDir: './tests/ai',
      use: { storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'onshift.shift', value: 'ai' }] }] } },
    },
    // the shell: switching shifts, deep links, progress carry-over from the standalone SHIFTY-1
    { name: 'shell', testDir: './tests/shell' },
  ],
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
