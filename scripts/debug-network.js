#!/usr/bin/env node
const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Intercept network requests
  const apiResponses = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('bringfido.com') && (url.includes('api') || url.includes('attraction'))) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const data = await response.json().catch(() => null);
          if (data) {
            apiResponses.push({
              url: url.substring(0, 100),
              data: JSON.stringify(data).substring(0, 500)
            });
          }
        }
      } catch (e) {}
    }
  });
  
  await page.goto('https://www.bringfido.com/attraction/parks/state/tennessee/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  await page.waitForTimeout(2000);
  
  // Click see more and wait for new requests
  console.log('Clicking "See More" button...');
  const button = await page.$('button:has-text("See More")');
  if (button) {
    await button.click();
    await page.waitForTimeout(3000);
  }
  
  console.log('\n=== API Responses ===');
  apiResponses.forEach((resp, i) => {
    console.log(`\n${i + 1}. ${resp.url}`);
    console.log(resp.data);
  });
  
  // Also check if there's a script tag with data
  const inlineData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.textContent.includes('window.__INITIAL_STATE__') || 
          script.textContent.includes('window.__DATA__')) {
        return script.textContent.substring(0, 1000);
      }
    }
    return null;
  });
  
  if (inlineData) {
    console.log('\n=== Inline Data ===');
    console.log(inlineData);
  }
  
  await browser.close();
}

debug().catch(console.error);
