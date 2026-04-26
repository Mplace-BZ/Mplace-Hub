// @ts-check
const { test, expect } = require('@playwright/test');
const { VIEW_KEYS, VIEW_ID_MAP, bypassAuth, collectErrors } = require('./helpers');

test.describe('MPlace Hub Smoke Tests', () => {

  test('page loads without critical JS errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Give scripts time to init
    await page.waitForTimeout(2000);
    // Filter: only fail on non-Firebase errors
    expect(errors, `JS errors on load: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('sidebar renders all nav items after auth bypass', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await bypassAuth(page);

    const navCount = await page.locator('#mpSidebarNav .mp-nav-item').count();
    // MP_NAV has 27 items (26 views + zespol overlay)
    expect(navCount).toBeGreaterThanOrEqual(26);
  });

  // --- View navigation tests: one per view ---
  for (const key of VIEW_KEYS) {
    test(`view "${key}" opens without errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await bypassAuth(page);

      // Navigate to this view
      await page.evaluate((v) => showView(v), key);
      await page.waitForTimeout(300);

      // The correct view element should have class 'active'
      const viewId = VIEW_ID_MAP[key];
      if (viewId) {
        const el = page.locator(`#${viewId}`);
        await expect(el).toHaveClass(/active/);
      }

      // Only ONE view should be active at a time (the viewCentrum regression)
      const activeCount = await page.locator('.view.active').count();
      expect(activeCount, `Expected 1 active view after showView('${key}'), got ${activeCount}`).toBe(1);

      // No JS errors during view transition
      expect(errors, `JS errors in view "${key}": ${errors.join('; ')}`).toHaveLength(0);
    });
  }

  // --- Bell / Notification panel ---
  test('bell opens notification panel without errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await bypassAuth(page);

    await page.evaluate(() => bellOpen());
    await page.waitForTimeout(300);

    // Panel should be open
    const panel = page.locator('#notifPanel');
    await expect(panel).toHaveClass(/open/);

    // Close it
    await page.evaluate(() => bellClose());
    await expect(panel).not.toHaveClass(/open/);

    // No JS errors
    expect(errors, `JS errors in bell: ${errors.join('; ')}`).toHaveLength(0);
  });

  // --- Mobile sidebar toggle ---
  test('mobile sidebar toggle works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await bypassAuth(page);

    // Shrink to mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);

    // Open sidebar
    await page.evaluate(() => mpToggleSidebar());
    const sidebar = page.locator('#mpSidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);

    const backdrop = page.locator('#mpSidebarBackdrop');
    await expect(backdrop).toHaveClass(/open/);

    // Close sidebar
    await page.evaluate(() => mpToggleSidebar(true));
    await expect(sidebar).not.toHaveClass(/mobile-open/);
    await expect(backdrop).not.toHaveClass(/open/);
  });

  // --- Bottom nav responsive ---
  test('bottom nav visible on mobile, hidden on desktop', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await bypassAuth(page);

    const nav = page.locator('.mp-bottom-nav');

    // Mobile: visible
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    await expect(nav).toBeVisible();

    // Desktop: hidden
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);
    await expect(nav).toBeHidden();
  });

  // --- No view leaks: rapid switching ---
  test('no view leaks when rapidly switching views', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await bypassAuth(page);

    // Pick 8 views and switch rapidly
    const sample = ['dzis', 'dashboard', 'agent', 'centrum', 'analiza', 'info', 'screener', 'kalkulator'];
    for (const key of sample) {
      await page.evaluate((v) => showView(v), key);
      const activeCount = await page.locator('.view.active').count();
      expect(activeCount, `View leak after switching to "${key}": ${activeCount} active`).toBe(1);
    }
  });

});
