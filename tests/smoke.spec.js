const { test, expect } = require('@playwright/test');

const pages = [
  ['Mission Control', '/'],
  ['Readiness Check', '/ready-check'],
  ['Market Search', '/market-search'],
  ['Quick Job Assessment', '/assessment'],
  ['CV Review Agent', '/cv-review'],
  ['Job Fit Review', '/job-fit-review'],
  ['Application Package', '/application-package'],
  ['Case Manager', '/case-manager'],
  ['Privacy Notice', '/privacy']
];

test.describe('page availability and core navigation', () => {
  for (const [name, path] of pages) {
    test(`${name} loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('text=Career Rebuild Navigator').first()).toBeVisible();
    });
  }

  test('Mission Control links to key workflow pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /readiness check/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /market search/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /job fit review/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /case manager/i }).first()).toBeVisible();
  });
});
