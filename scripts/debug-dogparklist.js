#!/usr/bin/env node
const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Load a city page
  await page.goto('https://dogparklist.com/parks/tennessee/nashville', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  await page.waitForTimeout(2000);
  
  console.log('=== Page Title ===');
  console.log(await page.title());
  
  console.log('\n=== All Links (first 20) ===');
  const links = await page.$$eval('a', 
    elements => elements.slice(0, 20).map(el => ({
      text: el.textContent?.trim()?.substring(0, 50),
      href: el.href
    }))
  );
  console.log(JSON.stringify(links, null, 2));
  
  console.log('\n=== Headings ===');
  const headings = await page.$$eval('h1, h2, h3', 
    elements => elements.map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim()?.substring(0, 100),
      class: el.className
    }))
  );
  console.log(JSON.stringify(headings, null, 2));
  
  console.log('\n=== Elements with class containing "park" ===');
  const parkElements = await page.$$eval('[class*="park"]', 
    elements => elements.slice(0, 10).map(el => ({
      tag: el.tagName,
      class: el.className,
      text: el.textContent?.trim()?.substring(0, 200)
    }))
  );
  console.log(JSON.stringify(parkElements, null, 2));
  
  console.log('\n=== Article or listing elements ===');
  const articles = await page.$$eval('article, .post, .entry, .listing', 
    elements => elements.slice(0, 5).map(el => ({
      tag: el.tagName,
      class: el.className,
      text: el.textContent?.trim()?.substring(0, 200)
    }))
  );
  console.log(JSON.stringify(articles, null, 2));
  
  await browser.close();
}

debug().catch(console.error);
