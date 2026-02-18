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
  await page.waitForTimeout(3000);
  
  // Get raw JSON-LD data
  const rawData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => s.textContent);
  });
  
  console.log('Found', rawData.length, 'JSON-LD scripts\n');
  
  rawData.forEach((content, i) => {
    console.log(`=== Script ${i + 1} ===`);
    try {
      const data = JSON.parse(content);
      console.log('Type:', data['@type']);
      
      if (data['@type'] === 'ItemList' && data.itemListElement) {
        console.log('Items:', data.itemListElement.length);
        
        if (data.itemListElement.length > 0) {
          const firstItem = data.itemListElement[0];
          console.log('\nFirst item structure:');
          console.log(JSON.stringify(firstItem, null, 2));
        }
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
    console.log('');
  });
  
  await browser.close();
}

debug().catch(console.error);
