const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3333',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npx serve -s . -p 3333 --no-clipboard',
    port: 3333,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
