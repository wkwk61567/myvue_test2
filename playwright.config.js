const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'test',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: true
  }
});