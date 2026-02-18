/**
 * MANUAL EXTRACTION SCRIPT FOR BRINGFIDO
 * 
 * To use:
 * 1. Open https://www.bringfido.com/attraction/parks/state/tennessee/ in your browser
 * 2. Open DevTools (F12) → Console
 * 3. Paste this entire script
 * 4. Press Enter
 * 5. Click "See More Results" until all parks are loaded
 * 6. Type in console: extractAllParks()
 * 7. The JSON will be copied to your clipboard
 * 8. Paste into scripts/data/tennessee-parks.json
 */

// Main extraction function
function extractAllParks() {
  const parks = [];
  const seenIds = new Set();
  
  // Find all JSON-LD scripts
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      
      // Handle ItemList format
      if (data['@type'] === 'ItemList' && data.itemListElement) {
        data.itemListElement.forEach((item) => {
          const park = item.item || item;
          
          if (!park.name) return;
          
          // Extract address
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
          
          // Extract coordinates
          let latitude = null, longitude = null;
          if (park.geo) {
            latitude = parseFloat(park.geo.latitude) || null;
            longitude = parseFloat(park.geo.longitude) || null;
          }
          
          // Extract ID
          let bringfidoId = '';
          if (park.url) {
            const match = park.url.match(/attraction\/(\d+)/);
            if (match) bringfidoId = match[1];
          }
          
          if (park.name && state) {
            const id = bringfidoId || `${park.name}-${city}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
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
          }
        });
      }
    } catch (e) {}
  });
  
  // Copy to clipboard
  const json = JSON.stringify(parks, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    console.log(`✅ Copied ${parks.length} parks to clipboard!`);
    console.log('Paste into scripts/data/tennessee-parks.json');
  });
  
  return parks;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('BringFido Extractor loaded!');
  console.log('1. Click "See More Results" until all parks load');
  console.log('2. Type: extractAllParks()');
  console.log('3. Paste the result into your JSON file');
}

// Export for Node (if needed)
if (typeof module !== 'undefined') {
  module.exports = { extractAllParks };
}
