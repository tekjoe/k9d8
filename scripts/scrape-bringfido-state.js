#!/usr/bin/env node
/**
 * Scrape dog park data from BringFido for a specific state
 * Uses Playwright to extract JSON-LD data from pages
 * 
 * Usage:
 *   node scripts/scrape-bringfido-state.js <state-slug>
 *   Example: node scripts/scrape-bringfido-state.js california
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const { PENDING_STATES, getBringFidoUrl } = require('./us-states');

const OUTPUT_DIR = path.join(__dirname, 'data');
const DELAY_BETWEEN_STATES = 5000; // 5 seconds between states
const MAX_CLICKS = 50; // Safety limit for "See More" clicks

/**
 * Extract park data from JSON-LD scripts on the page
 * Handles both old format (TouristAttraction) and new format (ItemList)
 */
async function extractParksFromPage(page) {
  return await page.evaluate(() => {
    const parks = [];
    
    // Find all JSON-LD scripts
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        
        // Handle ItemList format (new)
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          data.itemListElement.forEach((item) => {
            // item is a ListItem, the actual park is in item.item
            const park = item.item || item;
            
            if (!park.name) return;
            
            // Extract address components
            let street = '', city = '', state = '', zip = '';
            if (park.address) {
              if (typeof park.address === 'string') {
                const parts = park.address.split(',').map(p => p.trim());
                if (parts.length >= 3) {
                  street = parts[0];
                  city = parts[1];
                  const stateZip = parts[2].split(' ');
                  state = stateZip[0] || '';
                  zip = stateZip[1] || '';
                }
              } else if (park.address['@type'] === 'PostalAddress') {
                street = park.address.streetAddress || '';
                city = park.address.addressLocality || '';
                state = park.address.addressRegion || '';
                zip = park.address.postalCode || '';
              }
            }
            
            // Extract geo coordinates
            let latitude = null, longitude = null;
            if (park.geo) {
              latitude = parseFloat(park.geo.latitude) || null;
              longitude = parseFloat(park.geo.longitude) || null;
            }
            
            // Extract BringFido ID from URL if available
            let bringfidoId = '';
            if (park.url) {
              const match = park.url.match(/attraction\/(\d+)/);
              if (match) bringfidoId = match[1];
            }
            
            // Only add if we have at least name and state
            if (park.name && state) {
              parks.push({
                name: park.name,
                street,
                city,
                state,
                zip,
                latitude,
                longitude,
                description: park.description || '',
                bringfido_id: bringfidoId,
              });
            }
          });
        }
        
        // Handle old format: array of TouristAttraction/Place
        const items = Array.isArray(data) ? data : [data];
        
        items.forEach(item => {
          // Look for TouristAttraction or Place types (dog parks)
          if (item['@type'] && 
              (item['@type'].includes('TouristAttraction') || 
               item['@type'].includes('Place'))) {
            
            // Extract address components
            let street = '', city = '', state = '', zip = '';
            if (item.address) {
              if (typeof item.address === 'string') {
                // Try to parse string address
                const parts = item.address.split(',').map(p => p.trim());
                if (parts.length >= 3) {
                  street = parts[0];
                  city = parts[1];
                  const stateZip = parts[2].split(' ');
                  state = stateZip[0] || '';
                  zip = stateZip[1] || '';
                }
              } else if (item.address['@type'] === 'PostalAddress') {
                street = item.address.streetAddress || '';
                city = item.address.addressLocality || '';
                state = item.address.addressRegion || '';
                zip = item.address.postalCode || '';
              }
            }
            
            // Extract geo coordinates
            let latitude = null, longitude = null;
            if (item.geo) {
              latitude = parseFloat(item.geo.latitude) || null;
              longitude = parseFloat(item.geo.longitude) || null;
            }
            
            // Extract BringFido ID from URL if available
            let bringfidoId = '';
            if (item.url) {
              const match = item.url.match(/attraction\/(\d+)/);
              if (match) bringfidoId = match[1];
            }
            
            // Only add if we have at least name and state
            if (item.name && state) {
              parks.push({
                name: item.name,
                street,
                city,
                state,
                zip,
                latitude,
                longitude,
                description: item.description || '',
                bringfido_id: bringfidoId,
              });
            }
          }
        });
      } catch (e) {
        // Invalid JSON, skip
      }
    });
    
    return parks;
  });
}

/**
 * Click "See More Results" button to load additional parks
 */
async function clickSeeMore(page) {
  try {
    // Look for the button with various selectors
    const buttonSelectors = [
      'button:has-text("See More Results")',
      'button:has-text("See More")',
      '[data-testid="see-more-results"]',
      '.see-more-results',
      'button.load-more',
      'a:has-text("See More Results")',
      'a:has-text("See More")',
    ];
    
    for (const selector of buttonSelectors) {
      const button = await page.$(selector);
      if (button) {
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          console.log('  👆 Clicking "See More Results" button...');
          await button.click();
          
          // Wait for new content to load
          await page.waitForTimeout(3000);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.log('  ⚠️  Error clicking see more:', error.message);
    return false;
  }
}

/**
 * Check if "See More" button exists and is visible
 */
async function hasSeeMoreButton(page) {
  try {
    const buttonSelectors = [
      'button:has-text("See More Results")',
      'button:has-text("See More")',
      '[data-testid="see-more-results"]',
      '.see-more-results',
      'button.load-more',
      'a:has-text("See More Results")',
      'a:has-text("See More")',
    ];
    
    for (const selector of buttonSelectors) {
      const button = await page.$(selector);
      if (button) {
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Scrape a single state
 */
async function scrapeState(stateSlug, stateAbbreviation) {
  console.log(`\n🚀 Starting scrape for: ${stateSlug.toUpperCase()}`);
  
  const allParks = [];
  const seenIds = new Set(); // For deduplication
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    const url = getBringFidoUrl(stateSlug);
    
    console.log(`  📄 Loading: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for initial content
    await page.waitForTimeout(3000);
    
    // Extract initial parks
    let parks = await extractParksFromPage(page);
    console.log(`  ✅ Found ${parks.length} parks on initial load`);
    
    // Add to collection
    parks.forEach(park => {
      const id = park.bringfido_id || `${park.name}-${park.city}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allParks.push(park);
      }
    });
    
    // Click "See More" until no more results or max clicks reached
    let clickCount = 0;
    let hasMore = await hasSeeMoreButton(page);
    
    while (hasMore && clickCount < MAX_CLICKS) {
      clickCount++;
      console.log(`  📄 Loading more results (click ${clickCount})...`);
      
      const clicked = await clickSeeMore(page);
      if (!clicked) break;
      
      // Extract parks after new content loads
      parks = await extractParksFromPage(page);
      const newCount = parks.filter(p => {
        const id = p.bringfido_id || `${p.name}-${p.city}`;
        return !seenIds.has(id);
      }).length;
      
      console.log(`  ✅ Found ${parks.length} total parks (${newCount} new)`);
      
      // Add new parks to collection
      parks.forEach(park => {
        const id = park.bringfido_id || `${park.name}-${park.city}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          allParks.push(park);
        }
      });
      
      // Check if there's still a "See More" button
      hasMore = await hasSeeMoreButton(page);
    }
    
    console.log(`  🎉 Total unique parks found for ${stateSlug}: ${allParks.length}`);
    
    if (clickCount >= MAX_CLICKS) {
      console.log(`  ⚠️  Reached maximum click limit (${MAX_CLICKS})`);
    }
    
    // Save to file
    const outputFile = path.join(OUTPUT_DIR, `${stateSlug}-parks.json`);
    fs.writeFileSync(outputFile, JSON.stringify(allParks, null, 2));
    console.log(`  💾 Saved to: ${outputFile}`);
    
    return allParks;
    
  } finally {
    await browser.close();
  }
}

/**
 * Main function
 */
async function main() {
  const stateSlug = process.argv[2];
  
  if (!stateSlug) {
    console.log('Usage: node scrape-bringfido-state.js <state-slug>');
    console.log('\nPending states:');
    PENDING_STATES.forEach(s => console.log(`  - ${s.slug} (${s.name})`));
    console.log('\nOr use: node scrape-bringfido-state.js --all');
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  if (stateSlug === '--all') {
    // Scrape all pending states
    console.log(`\n🌍 Starting batch scrape for ${PENDING_STATES.length} states`);
    
    for (const state of PENDING_STATES) {
      await scrapeState(state.slug, state.abbreviation);
      
      if (PENDING_STATES.indexOf(state) < PENDING_STATES.length - 1) {
        console.log(`  ⏳ Waiting ${DELAY_BETWEEN_STATES}ms before next state...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_STATES));
      }
    }
    
    console.log('\n✅ All states scraped!');
    
  } else {
    // Scrape single state
    const state = PENDING_STATES.find(s => s.slug === stateSlug);
    if (!state) {
      console.error(`State "${stateSlug}" not found or already completed.`);
      process.exit(1);
    }
    
    await scrapeState(state.slug, state.abbreviation);
  }
}

main().catch(console.error);
