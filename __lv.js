const { chromium } = require('playwright');
const S = process.env.SHOT_DIR;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2 })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://pln-prototypes.vercel.app/prototypes/job-board?canvas=flow-details-empty', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(7000);
  console.log('heading:', await p.locator('h2:has-text("You can upload your CV")').first().innerText().catch(()=>'MISSING'));
  await p.locator('input[type="file"]').first()
    .setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await p.waitForTimeout(4000);
  console.log('grid:', await p.evaluate(() => {
    const g = document.querySelector('[class*="detailsGrid"]');
    if (!g) return 'no grid';
    const tops = [...g.children].map(c => Math.round(c.getBoundingClientRect().top));
    return { cols: getComputedStyle(g).gridTemplateColumns, items: g.children.length, rows: [...new Set(tops)].length };
  }));
  console.log('errors:', errs.length ? errs : 'none');
  await p.screenshot({ path: `${S}/live-final.png`, clip: { x: 590, y: 80, width: 850, height: 460 } });
  await b.close();
})();
