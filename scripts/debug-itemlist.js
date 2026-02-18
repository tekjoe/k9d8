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
  
  const parks = await page.evaluate(() => {
    const parks = [];
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          console.log('Found ItemList with', data.itemListElement.length, 'items');
          
          data.itemListElement.forEach((item, index) => {
            console.log(`Item ${index}:`, JSON.stringify(item, null, 2).substring(0, 500));
          });
        }
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    });
    
    return parks;
  });
  
  console.log('\nTotal parks found:', parks.length);
  await browser.close();
}

debug().catch(console.error);
