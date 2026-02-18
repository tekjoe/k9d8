#!/usr/bin/env node
const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://www.bringfido.com/attraction/parks/state/tennessee/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  await page.waitForTimeout(2000);
  
  console.log('=== Initial page HTML (first 3000 chars) ===');
  const initialHtml = await page.content();
  console.log(initialHtml.substring(0, 3000));
  
  console.log('\n\n=== Looking for park cards ===');
  const cards = await page.$$eval('[class*="card"], [class*="listing"], article, [data-testid]', 
    elements => elements.slice(0, 5).map(el => ({
      tag: el.tagName,
      class: el.className?.substring(0, 100),
      text: el.textContent?.substring(0, 200)
    }))
  );
  console.log(JSON.stringify(cards, null, 2));
  
  console.log('\n\n=== Looking for all buttons ===');
  const buttons = await page.$$eval('button, a', 
    elements => elements
      .filter(el => el.textContent.toLowerCase().includes('more'))
      .map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        class: el.className?.substring(0, 100)
      }))
  );
  console.log(JSON.stringify(buttons, null, 2));
  
  await browser.close();
}

debug().catch(console.error);
