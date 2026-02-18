#!/usr/bin/env node
/**
 * Scrape dog park data from dogparklist.com
 * Navigates state → city → park hierarchy
 * 
 * Usage:
 *   node scripts/scrape-dogparklist.js <state-slug>
 *   Example: node scripts/scrape-dogparklist.js tennessee
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const { PENDING_STATES, US_STATES } = require('./us-states');

const OUTPUT_DIR = path.join(__dirname, 'data');
const BASE_URL = 'https://dogparklist.com';
const DELAY_BETWEEN_REQUESTS = 500; // 0.5 seconds between page loads

/**
 * Clean up text by removing extra whitespace
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Extract park data from a city page
 */
async function extractParksFromCityPage(page, stateSlug, cityName) {
  const url = `${BASE_URL}/parks/${stateSlug}/${cityName.toLowerCase().replace(/\s+/g, '-')}`;
  console.log(`    📄 Loading: ${cityName}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const parks = await page.evaluate(() => {
      const results = [];
      
      // Find all links that match the park pattern
      const allLinks = document.querySelectorAll('a[href*="/parks/"]');
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        
        // Match pattern: /parks/state/city/park-name-xxxxx.html
        const parkMatch = href.match(/\/parks\/[^/]+\/[^/]+\/(.+)-[a-z0-9]+\.html$/);
        
        if (parkMatch) {
          // Get the raw HTML content
          const html = link.innerHTML;
          
          // Create a temporary element to parse the HTML
          const temp = document.createElement('div');
          temp.innerHTML = html;
          
          // Extract text content
          const fullText = temp.textContent || '';
          const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);
          
          // First line is usually the park name
          let name = lines[0] || '';
          // Remove emoji
          name = name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
          
          // Find address line (contains city, state, zip pattern)
          let address = '';
          let rating = '';
          
          for (const line of lines) {
            if (line.match(/,\s*[A-Z]{2}\s*\d{5}/)) {
              address = line;
            } else if (line.match(/\d+\.\d+.*reviews?/)) {
              rating = line;
            }
          }
          
          if (name && name.length > 1 && !name.match(/^\d+$/)) {
            results.push({
              name,
              address,
              rating,
              detailUrl: href.startsWith('http') ? href : 'https://dogparklist.com' + href
            });
          }
        }
      });
      
      return results;
    });
    
    console.log(`    ✅ Found ${parks.length} parks`);
    return parks;
    
  } catch (error) {
    console.error(`    ❌ Error: ${error.message}`);
    return [];
  }
}

/**
 * Extract city list from state page
 */
async function extractCitiesFromStatePage(page, stateSlug) {
  const url = `${BASE_URL}/parks/${stateSlug}`;
  console.log(`  📄 Loading state page...`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const cities = await page.evaluate(() => {
      const results = [];
      const seenSlugs = new Set();
      
      // Find all links that match city pattern
      const allLinks = document.querySelectorAll('a[href*="/parks/"]');
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        
        // Match pattern: /parks/state/city (not ending in .html)
        const match = href.match(/\/parks\/[^/]+\/([^/]+)\/?$/);
        
        if (match && !href.endsWith('.html')) {
          const citySlug = match[1];
          if (!seenSlugs.has(citySlug) && !citySlug.includes('.')) {
            seenSlugs.add(citySlug);
            
            // Clean up city name - remove emoji and "X PARKS" text
            let cityName = text
              .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
              .replace(/\d+\s*PARKS?/i, '')
              .trim();
            
            results.push({
              slug: citySlug,
              name: cityName || citySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
          }
        }
      });
      
      return results;
    });
    
    console.log(`  ✅ Found ${cities.length} cities`);
    return cities;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return [];
  }
}

/**
 * Parse address into components
 */
function parseAddress(addressStr) {
  if (!addressStr) {
    return { street: '', city: '', zip: '' };
  }
  
  // Pattern: "Street, City, ST 12345" or "Street, City ST 12345"
  const match = addressStr.match(/^(.+?),\s*([^,]+?),?\s*[A-Z]{2}\s*(\d{5})?$/);
  if (match) {
    return {
      street: cleanText(match[1]),
      city: cleanText(match[2]),
      zip: match[3] || ''
    };
  }
  
  // Pattern without street: "City, ST 12345"
  const cityMatch = addressStr.match(/^([^,]+?),?\s*[A-Z]{2}\s*(\d{5})?$/);
  if (cityMatch) {
    return {
      street: '',
      city: cleanText(cityMatch[1]),
      zip: cityMatch[2] || ''
    };
  }
  
  return { street: cleanText(addressStr), city: '', zip: '' };
}

/**
 * Get park details from individual park page
 */
async function getParkDetails(page, detailUrl) {
  try {
    await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    return await page.evaluate(() => {
      const result = { description: '', latitude: null, longitude: null };
      
      // Look for description
      const contentSelectors = [
        '.content',
        '[class*="content"]',
        '.description',
        'article',
        '.entry-content',
        'main p'
      ];
      
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.length > 50) {
          result.description = el.textContent.trim().substring(0, 500);
          break;
        }
      }
      
      // Look for coordinates in page source
      const pageSource = document.documentElement.innerHTML;
      
      // Pattern 1: JSON-LD
      const jsonLdMatch = pageSource.match(/"latitude":\s*"?(-?\d+\.?\d*)"?/);
      const jsonLdLngMatch = pageSource.match(/"longitude":\s*"?(-?\d+\.?\d*)"?/);
      if (jsonLdMatch) result.latitude = parseFloat(jsonLdMatch[1]);
      if (jsonLdLngMatch) result.longitude = parseFloat(jsonLdLngMatch[1]);
      
      // Pattern 2: Google Maps URL
      if (!result.latitude) {
        const mapsMatch = pageSource.match(/google\.com\/maps.*@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (mapsMatch) {
          result.latitude = parseFloat(mapsMatch[1]);
          result.longitude = parseFloat(mapsMatch[2]);
        }
      }
      
      return result;
    });
    
  } catch (error) {
    return { description: '', latitude: null, longitude: null };
  }
}

/**
 * Scrape a single state
 */
async function scrapeState(stateSlug, stateAbbreviation) {
  console.log(`\n🚀 Scraping: ${stateSlug.toUpperCase()}`);
  
  const allParks = [];
  const seenNames = new Set();
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Get cities
    const cities = await extractCitiesFromStatePage(page, stateSlug);
    
    // Process each city
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      console.log(`\n  [${i + 1}/${cities.length}] ${city.name}`);
      
      const parks = await extractParksFromCityPage(page, stateSlug, city.slug);
      
      for (const park of parks) {
        const nameKey = park.name.toLowerCase();
        if (seenNames.has(nameKey)) continue;
        seenNames.add(nameKey);
        
        const parsed = parseAddress(park.address);
        
        // Get details for ALL parks (coordinates and full description are required)
        let details = { description: '', latitude: null, longitude: null };
        if (park.detailUrl) {
          console.log(`      🔍 ${park.name.substring(0, 40)}`);
          details = await getParkDetails(page, park.detailUrl);
          await page.waitForTimeout(800); // Slightly longer delay to be respectful
        }
        
        allParks.push({
          name: cleanText(park.name),
          street: parsed.street,
          city: parsed.city || city.name,
          state: stateAbbreviation,
          zip: parsed.zip,
          latitude: details.latitude,
          longitude: details.longitude,
          description: cleanText(details.description)
        });
      }
      
      if (i < cities.length - 1) {
        await page.waitForTimeout(DELAY_BETWEEN_REQUESTS);
      }
    }
    
    console.log(`\n  ✅ Total: ${allParks.length} parks`);
    
    // Save
    const outputFile = path.join(OUTPUT_DIR, `${stateSlug}-parks.json`);
    fs.writeFileSync(outputFile, JSON.stringify(allParks, null, 2));
    console.log(`  💾 Saved: ${outputFile}`);
    
    return allParks;
    
  } finally {
    await browser.close();
  }
}

/**
 * Main
 */
async function main() {
  const stateSlug = process.argv[2];
  
  if (!stateSlug) {
    console.log('Usage: node scripts/scrape-dogparklist.js <state-slug>');
    console.log('\nExamples:');
    PENDING_STATES.slice(0, 10).forEach(s => console.log(`  ${s.slug}`));
    console.log('\n  --all (for all pending states)');
    process.exit(1);
  }
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  if (stateSlug === '--all') {
    for (const state of PENDING_STATES) {
      await scrapeState(state.slug, state.abbreviation);
    }
  } else {
    const state = US_STATES.find(s => s.slug === stateSlug);
    if (!state) {
      console.error(`State not found: ${stateSlug}`);
      process.exit(1);
    }
    await scrapeState(state.slug, state.abbreviation);
  }
}

main().catch(console.error);
