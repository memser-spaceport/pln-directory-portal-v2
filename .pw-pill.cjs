const { chromium } = require('playwright');
const OUT = 'C:/Users/polya/AppData/Local/Temp/claude/c--PL-Network-pln-directory-portal-v2/e8146dd6-95d2-422d-847a-a6cd2a319a79/scratchpad/';
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
  p.on('pageerror', e => errs.push('DRAWER PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('DRAWER CONSOLE: '+m.text().slice(0,140)); });

  await p.goto('http://localhost:4200/prototypes/job-board', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: /^Apply$/ }).first().click();
  await p.waitForTimeout(1500);

  console.log('avatar imgs in drawer:', await p.locator('[class*="drawerContent"] img').count());
  console.log('pill text:', JSON.stringify(await p.locator('text=/PL Team only/i').first().textContent().catch(()=>null)));
  const pillStyle = await p.locator('text=/PL Team only/i').first().evaluate(el => {
    const cs = getComputedStyle(el);
    return { transform: cs.textTransform, size: cs.fontSize, weight: cs.fontWeight, color: cs.color, radius: cs.borderRadius, border: cs.borderTopWidth };
  });
  console.log('pill style (job-board):', JSON.stringify(pillStyle));
  const heads = await p.locator('[class*="DetailsSectionHeader"], h2').allTextContents();
  console.log('sections:', JSON.stringify([...new Set(heads.filter(t=>/Experience|Job search|Teams|Project Contributions|Repositories/.test(t)))]));
  console.log('Add buttons:', await p.getByRole('button', { name: /^Add$/ }).count());
  await p.screenshot({ path: OUT + 'p-drawer.png', clip: { x: 715, y: 0, width: 725, height: 1100 } });
  await b.close();

  const b2 = await chromium.launch();
  const m = await b2.newPage({ viewport: { width: 1440, height: 1100 } });
  m.on('pageerror', e => errs.push('MP PAGEERROR: ' + e.message));
  await m.goto('http://localhost:4200/prototypes/member-profile', { waitUntil: 'networkidle' });
  await m.waitForTimeout(3000);
  const mp = await m.locator('text=/PL Team only/i').first().evaluate(el => {
    const cs = getComputedStyle(el);
    return { transform: cs.textTransform, size: cs.fontSize, weight: cs.fontWeight, color: cs.color, radius: cs.borderRadius, border: cs.borderTopWidth };
  }).catch(()=>null);
  console.log('pill style (member-profile):', JSON.stringify(mp));
  console.log('identical:', JSON.stringify(mp) === JSON.stringify(pillStyle));
  await b2.close();
  console.log('ERRORS:', errs.length ? errs.slice(0,5).join('\n') : 'none');
})();
