const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  reporter: 'list',
  use: {
    // 3333 zajmuje panel MPlace-Agent (401 z tokenem) — testy mają własny port
    baseURL: 'http://localhost:3344',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npx serve -s . -p 3344 --no-clipboard',
    port: 3344,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
