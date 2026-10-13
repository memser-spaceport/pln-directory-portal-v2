// Run against authenticated API history:
// PLAA_STORAGE_STATE=/private/path/state.json node scripts/check-plaa-issuance.cjs
// Storage state contains credentials: keep it outside the repository; this check never writes it.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  assert.ok(process.env.PLAA_STORAGE_STATE, 'Provide an approved member session via PLAA_STORAGE_STATE');
  const browser = await chromium.launch();
  const base = process.env.BASE_URL || 'http://localhost:4200';
  try {
    const context = await browser.newContext({ storageState: process.env.PLAA_STORAGE_STATE });
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 950 });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}/alignment-asset/portfolio-holdings`, { waitUntil: 'networkidle' });
      assert.equal(
        new URL(page.url()).pathname,
        '/alignment-asset/portfolio-holdings',
        'A valid signed-in member session is required',
      );
      await page.locator('.th-chart .recharts-line-curve').first().waitFor();
      assert.equal(await page.locator('.th-chart__empty').count(), 0, 'Quarterly history must not be empty');
      const quarters = await page.locator('.recharts-xAxis text').count();
      assert.ok(quarters > 0, 'Requires quarterly history');

      await page.getByRole('button', { name: 'Table View', exact: true }).click();
      const alignments = await page
        .locator('.th-card--nav .th-table')
        .evaluate((table) =>
          [...table.rows].map((row) => [...row.cells].map((cell) => getComputedStyle(cell).textAlign)),
        );
      alignments.forEach((row) =>
        assert.deepEqual(
          row,
          ['left', ...row.slice(1).map(() => 'right')],
          'Numeric headers and values must share right alignment',
        ),
      );
      const counts = await page.locator('.th-card--nav tbody tr td:nth-child(2)').allTextContents();
      assert.ok(counts.length, 'Requires monthly history');
      const expected = counts.slice(-12);
      await page.getByRole('button', { name: 'Monthly Graph', exact: true }).click();
      const curve = page.locator('.th-issuance-line .recharts-line-curve');
      await curve.waitFor();
      await page.waitForFunction(
        (count) => document.querySelectorAll('.th-chart .recharts-bar .recharts-label-list text').length === count,
        expected.length,
      );
      assert.equal(await curve.getAttribute('stroke'), '#dc2626');
      assert.ok(
        (await page.locator('.th-chart .recharts-line').first().getAttribute('class')).includes('th-issuance-line'),
        'Issuance must render behind the amount and price labels',
      );
      const navCurve = page.locator('.recharts-line:not(.th-issuance-line) .recharts-line-curve').first();
      assert.equal(await curve.getAttribute('stroke-width'), await navCurve.getAttribute('stroke-width'));
      const titles = await page.locator('.th-issuance-line circle title').allTextContents();
      assert.equal(titles.length, expected.length);
      titles.forEach((title, i) => assert.ok(title.endsWith(`${expected[i]} PLAA in circulation`), title));
      const key = page.locator('.th-key__item').filter({ hasText: /^PLAA issuance$/ });
      assert.equal(await key.count(), 1);
      assert.equal(
        await key.locator('.th-key__marker--line').evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(220, 38, 38)',
      );
      const typography = (el) => {
        const style = getComputedStyle(el);
        return [style.fontFamily, style.fontSize, style.fontWeight];
      };
      const xType = await page.locator('.recharts-xAxis text').first().evaluate(typography);
      const countTicks = await page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value').allTextContents();
      assert.ok(
        countTicks.every((tick) => !tick.includes('.')),
        'Circulation-axis ticks should use whole units',
      );
      assert.deepEqual(
        await page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value').first().evaluate(typography),
        xType,
      );
      assert.deepEqual(await page.locator('.recharts-yAxis .recharts-label').evaluate(typography), xType);
      const geometry = await page.evaluate(() => {
        const rects = (selector) => [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());
        const dots = rects('.th-issuance-line circle');
        const labels = rects('.th-chart .recharts-bar .recharts-label-list text');
        const bars = rects('.th-chart .recharts-bar-rectangle path').filter((r) => r.height > 0);
        const axis = document.querySelector('.recharts-yAxis .recharts-label');
        const title = axis.getBoundingClientRect();
        const frame = axis.closest('svg').getBoundingClientRect();
        return {
          canvases: document.querySelectorAll('.th-chart svg.recharts-surface').length,
          gaps: dots.map((r, i) => labels[i].top - r.bottom),
          labelGaps: labels.map(
            (label) =>
              Math.min(
                ...bars
                  .filter((bar) => Math.abs(bar.x + bar.width / 2 - label.x - label.width / 2) < 1)
                  .map((bar) => bar.top),
              ) - label.bottom,
          ),
          xOffsets: dots.map((r, i) => Math.abs(r.x + r.width / 2 - labels[i].x - labels[i].width / 2)),
          axisTitleFits: title.top >= frame.top - 1 && title.bottom <= frame.bottom + 1,
        };
      });
      assert.equal(geometry.canvases, 1, 'Keep issuance and candles overlapping in one plot');
      assert.ok(
        geometry.gaps.every((gap) => gap >= 4),
        'Each issuance point must clear its month’s amount label',
      );
      assert.ok(
        geometry.labelGaps.every((gap) => gap >= 0),
        'Amount labels must remain above the bar tops',
      );
      assert.ok(
        geometry.xOffsets.every((offset) => offset < 1),
        'Issuance and bars must align to the same months',
      );
      assert.ok(geometry.axisTitleFits, 'Circulation title must not be clipped');

      await page.getByRole('button', { name: 'Quarterly Graph', exact: true }).click();
      assert.equal(await page.locator('.th-issuance-line').count(), 0);
      assert.equal(await key.count(), 0);
      assert.equal(await page.locator('.recharts-xAxis text').count(), quarters);
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${width}px: ${quarters} quarters, ${expected.length} monthly points, exact live totals, overlapping issuance just above bar labels, matching typography`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
