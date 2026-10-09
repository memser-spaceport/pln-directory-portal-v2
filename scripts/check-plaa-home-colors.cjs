const assert = require('node:assert/strict');
const { join } = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const base = process.env.BASE_URL || 'http://localhost:4200';
  const teal = 'rgb(12, 82, 89)';
  const outsideColors = (page) =>
    page.evaluate(() => ({
      roots: [document.documentElement, document.body].map((el) => {
        const style = getComputedStyle(el);
        return ['--color-brand', '--pl-blue-500', '--pl-blue-600'].map((name) => style.getPropertyValue(name));
      }),
      signIn: [...document.querySelectorAll('button')]
        .filter((el) => !el.closest('.plaa-home') && el.textContent.trim() === 'Sign in')
        .slice(0, 1) // Navbar control; /home also has a separate in-content sign-in CTA.
        .map((el) => {
          const style = getComputedStyle(el);
          return [style.color, style.backgroundColor, style.borderColor];
        }),
    }));
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.goto(`${base}/home`, { waitUntil: 'networkidle' });
      const before = await outsideColors(page);
      await page.goto(`${base}/alignment-asset`, { waitUntil: 'networkidle' });
      const background = (el) => getComputedStyle(el).backgroundColor;
      assert.equal(await page.locator('.ph-hero').evaluate(background), teal);
      assert.equal(await page.locator('.ppb__cta').evaluate(background), teal);
      assert.equal(await page.locator('.ph-btn-primary--hero').evaluate(background), 'rgb(255, 255, 255)');
      assert.equal(await page.locator('.ph-btn-primary--hero').evaluate((el) => getComputedStyle(el).color), teal);
      assert.deepEqual(await outsideColors(page), before, 'Homepage tokens must not recolor the shared shell');
      await page.locator('.ppb__cta').hover();
      assert.equal(await page.locator('.ppb__cta').evaluate(background), 'rgb(9, 67, 74)');
      await page.mouse.move(0, 0);
      await page.screenshot({ path: join(__dirname, '..', '.next', `plaa-home-primary-${width}.png`) });
      // Use the real Home link for client-side navigation, retaining the app shell.
      await page.locator('a[href="/home"]:visible').first().click();
      await page.waitForURL(`${base}/home`);
      await page.locator('.plaa-home').waitFor({ state: 'detached' });
      assert.deepEqual(await outsideColors(page), before, 'Homepage colors must not leak after navigation');
      console.log(`PASS ${width}px: teal hero/actions, contrasting CTA, unchanged shell and Directory colors`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
