#!/usr/bin/env node
/**
 * Debug script to inspect BringFido page structure
 */

const { chromium } = require('playwright');

async function debugState(stateSlug) {
  console.log(`🔍 Debugging: ${stateSlug}\n`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    const url = `https://www.bringfido.com/attraction/parks/state/${stateSlug}/`;
    
    console.log(`📄 Loading: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Get page title
    const title = await page.title();
    console.log(`📋 Page title: ${title}\n`);
    
    // Check for JSON-LD scripts
    const jsonLdScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => ({
        length: s.textContent.length,
        preview: s.textContent.substring(0, 200)
      }));
    });
    
    console.log(`📊 Found ${jsonLdScripts.length} JSON-LD scripts:`);
    jsonLdScripts.forEach((script, i) => {
      console.log(`\n  Script ${i + 1} (${script.length} chars):`);
      console.log(`  ${script.preview}...`);
    });
    
    // Try to parse and show structure
    if (jsonLdScripts.length > 0) {
      console.log('\n📦 Parsed structure:');
      const parsed = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(s => {
          try {
            const data = JSON.parse(s.textContent);
            return {
              type: Array.isArray(data) ? 'array' : typeof data,
              length: Array.isArray(data) ? data.length : 1,
              firstItem: Array.isArray(data) && data.length > 0 ? {
                '@type': data[0]['@type'],
                name: data[0].name,
                hasAddress: !!data[0].address,
                hasGeo: !!data[0].geo
              } : {
                '@type': data['@type'],
                name: data.name
              }
            };
          } catch (e) {
            return { error: 'Parse failed' };
          }
        });
      });
      
      console.log(JSON.stringify(parsed, null, 2));
    }
    
    // Check for park listings in DOM
    const parkElements = await page.evaluate(() => {
      // Common selectors for park listings
      const selectors = [
        '[data-testid*="park"]',
        '[class*="park"]',
        '[class*="attraction"]',
        'article',
        '.listing',
        '.result'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return {
            selector,
            count: elements.length,
            sample: elements[0]?.textContent?.substring(0, 100)
          };
        }
      }
      
      return null;
    });
    
    if (parkElements) {
      console.log(`\n🎯 Found ${parkElements.count} elements with selector: ${parkElements.selector}`);
      console.log(`   Sample: ${parkElements.sample}...`);
    } else {
      console.log('\n⚠️  No park elements found with common selectors');
    }
    
    // Check for pagination
    const pagination = await page.evaluate(() => {
      const nextLink = document.querySelector('a[href*="?page="], a[rel="next"]');
      const seeMore = document.querySelector('button:contains("See More"), .see-more');
      return {
        hasNextLink: !!nextLink,
        nextHref: nextLink?.href,
        hasSeeMore: !!seeMore
      };
    });
    
    console.log('\n📄 Pagination:', pagination);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

const stateSlug = process.argv[2] || 'tennessee';
debugState(stateSlug);
