const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const dir = __dirname;
  const out = process.argv[2] || path.join(dir, 'out');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 2000, height: 1400 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(dir, 'mockups.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  for (const id of ['landscape', 'portrait', 'ring', 'gold', 'score']) {
    await page.locator('#shot-' + id).screenshot({ path: path.join(out, id + '.png') });
  }
  await browser.close();
})();
