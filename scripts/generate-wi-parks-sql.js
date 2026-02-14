#!/usr/bin/env node
/**
 * Generate SQL to populate parks database from BringFido data
 * Uses provided JSON data
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../supabase/migrations/00004_seed_wi_parks.sql');

// Sample data from the user's provided response
const SAMPLE_PARKS = [
  {
    "id": 3856,
    "name": "Dog Park at Yahara Heights County Park",
    "summary": "Dogs can play off leash in the 20-acre dog park at Yahara Heights County Park in Waunakee, WI, which features ample grassy space and water for Fido to dip his paws into. Please note dog permits are required.",
    "rating": 4.5,
    "ratingCount": 2,
    "latitude": 43.1546004,
    "longitude": -89.40536,
    "phone": "(608) 224-3730",
    "city": { "name": "Waunakee" },
    "address": "5488 Catfish Ct, Waunakee, WI 53597",
    "addressComponents": { "city": "Waunakee", "address1": "5488 Catfish Ct", "postalCode": "53597", "stateOrProvince": "WI" },
    "website": "https://www.danecountyparks.com/park/YaharaHeights"
  },
  {
    "id": 14463,
    "name": "Burlington Dog Park",
    "summary": "Fido is invited to play at Burlington Dog Park in Wisconsin. Dogs of all sizes are welcome to join for socialization. Amenities include chairs along with a waste and water station.",
    "rating": 5.0,
    "ratingCount": 1,
    "latitude": 42.669813,
    "longitude": -88.2671306,
    "phone": "(414) 651-3788",
    "city": { "name": "Burlington" },
    "address": "480 S Calumet St, Burlington, WI 53105",
    "addressComponents": { "city": "Burlington", "address1": "480 S Calumet St", "postalCode": "53105", "stateOrProvince": "WI" },
    "website": "https://www.facebook.com/burlingtonwidogpark/"
  },
  {
    "id": 3866,
    "name": "Platteville Community Dog Park",
    "summary": "Nestled against the Rountree Branch stream in Platteville, WI, the five-acre Platteville Community Dog Park provides a safe and spacious area for dogs to frolic and play. It's a fenced-in off-leash area, with separate sections for small and large dogs, a wooded walking path, poop disposal stations, picnic tables, parking and a porta-potty.",
    "rating": 4.2,
    "ratingCount": 5,
    "latitude": 42.7323588,
    "longitude": -90.4648979,
    "phone": "(608) 348-4549",
    "city": { "name": "Platteville" },
    "address": "946 Valley Rd, Platteville, WI 53818",
    "addressComponents": { "city": "Platteville", "address1": "946 Valley Rd", "postalCode": "53818", "stateOrProvince": "WI" },
    "website": "https://www.plattevillearboretum.org/dog-park"
  },
  {
    "id": 3010,
    "name": "Tails n Trails Dog Park",
    "summary": "Fido is invited to play at the Tails n Trails Dog Park in Milton, WI. This off-leash facility has two separate areas for small and large dogs. Amenities include water, a walking trail and off-street parking.",
    "rating": 5.0,
    "ratingCount": 2,
    "latitude": 42.7735835,
    "longitude": -88.9666275,
    "phone": "(608) 868-6914",
    "city": { "name": "Milton" },
    "address": "862 W High St, Milton, WI 53563",
    "addressComponents": { "city": "Milton", "address1": "862 W High St", "postalCode": "53563", "stateOrProvince": "WI" },
    "website": "https://www.milton-wi.gov/262/Tails-n-Trails-Dog-Park"
  },
  {
    "id": 3758,
    "name": "Waupaca County Dog Park",
    "summary": "Shade trees, benches, picnic tables, and agility equipment are amenities of the Waupaca County Dog Park. This two-acre fenced-in recreation space is a local favorite among the Waupaca, WI, community.",
    "rating": 5.0,
    "ratingCount": 1,
    "latitude": 44.3455096,
    "longitude": -89.0965865,
    "phone": "(715) 258-6243",
    "city": { "name": "Waupaca" },
    "address": "601 Lakeside Pkwy, Waupaca, WI 54981",
    "addressComponents": { "city": "Waupaca", "address1": "601 Lakeside Pkwy", "postalCode": "54981", "stateOrProvince": "WI" },
    "website": "https://www.waupacacounty-wi.gov/departments/parks_and_recreation/waupaca_county_dog_park.php"
  },
  {
    "id": 22970,
    "name": "Off-Leash Dog Area at Mead Park",
    "summary": "Fido is invited to play at the off-leash dog area at Mead Park in Stevens Point, WI. The beach opens 30 minutes before sunrise, and your furry friend can play until 11:00 PM daily. Owners must be within the fenced-in area with a leash readily available while watching their pup. Park users without an animal may also use this beach.",
    "rating": 5.0,
    "ratingCount": 3,
    "latitude": 44.5217524,
    "longitude": -89.5931195,
    "phone": "(715) 346-1531",
    "city": { "name": "Stevens Point" },
    "address": "1201 W Whitney St, Stevens Point, WI 54481",
    "addressComponents": { "city": "Stevens Point", "address1": "1201 W Whitney St", "postalCode": "54481", "stateOrProvince": "WI" },
    "website": "https://stevenspoint.com/180/Recreation-Activities"
  },
  {
    "id": 13964,
    "name": "Paws & Play Dog Park",
    "summary": "Paws & Play Dog Park is a 4.5-acre fenced-in area in Marshfield, WI. The park is relied on donations and has two separate areas for small and large dogs. Amenities include waste stations, picnic tables and water during the warmer months.",
    "rating": 5.0,
    "ratingCount": 2,
    "latitude": 44.6493446,
    "longitude": -90.1722062,
    "phone": "(715) 305-0832",
    "city": { "name": "Marshfield" },
    "address": "E 21st St & S Peach Ave, Marshfield, WI 54449",
    "addressComponents": { "city": "Marshfield", "address1": "E 21st St & S Peach Ave", "postalCode": "54449", "stateOrProvince": "WI" },
    "website": "https://pawsandplaymfld.square.site/"
  },
  {
    "id": 14974,
    "name": "Hudson Dog Park",
    "summary": "Bring Fido to blow off some steam at the Hudson Dog Park in Hudson, WI. This two-acre pup recreation area is fully fenced and has waste bags on site. All dogs must be licensed in the municipality where the owner and pet reside.",
    "rating": 4.5,
    "ratingCount": 4,
    "latitude": 44.9789803,
    "longitude": -92.7217686,
    "phone": "(715) 386-4765",
    "city": { "name": "Hudson" },
    "address": "908 Carmichael Rd, Hudson, WI 54016",
    "addressComponents": { "city": "Hudson", "address1": "908 Carmichael Rd", "postalCode": "54016", "stateOrProvince": "WI" },
    "website": "http://hudsondogpark.org/"
  },
  {
    "id": 11302,
    "name": "Merrill Dog Park at the MARC",
    "summary": "Fido is invited to play at the Merrill Dog Park at the MARC in Wisconsin. The off-leash area is 2.5 acres and features a separate section for small dogs. If the park is busy, they have pathways connecting to Council Grounds State Park.",
    "rating": 5.0,
    "ratingCount": 1,
    "latitude": 45.1915025,
    "longitude": -89.7259475,
    "phone": "(715) 536-7313",
    "city": { "name": "Merrill" },
    "address": "1100 Marc Dr, Merrill, WI 54452",
    "addressComponents": { "city": "Merrill", "address1": "1100 Marc Dr", "postalCode": "54452", "stateOrProvince": "WI" },
    "website": "https://ci.merrill.wi.us/index.asp?SEC=F96B2212-97C3-47A5-9374-24933AE38BA3"
  },
  {
    "id": 15106,
    "name": "Laura & Peter Mossakowski Family Dog Park",
    "summary": "Fido will love playing at the Laura & Peter Mossakowski Family Dog Park in Bellevue, WI. This 6.5-acre recreation space is a place where furry friends have a place to run, roll around in the mud, meet new four-legged friends and even catch a ball or a Frisbee. Note that permits are required to use this dog park.",
    "rating": 4.5,
    "ratingCount": 2,
    "latitude": 44.460631,
    "longitude": -88.011728,
    "phone": "(920) 448-2800",
    "city": { "name": "Bellevue" },
    "address": "2282 Bellevue St, Bellevue, WI 54311",
    "addressComponents": { "city": "Bellevue", "address1": "2282 Bellevue St", "postalCode": "54311", "stateOrProvince": "WI" },
    "website": "https://www.villageofbellevuewi.gov/departments/prandf/parks_and_facilities/dog_park"
  },
  {
    "id": 16422,
    "name": "River Falls Dog Park",
    "summary": "Bring your pup to socialize and get some exercise at the River Falls Dog Park in River Falls, WI. This 16-acre fenced off-leash pup recreation area features separate sections for small and large dogs, picnic tables, benches and dog waste stations. No running water is available, so make sure to bring some for Fido! There is plenty of parking on site.",
    "rating": 5.0,
    "ratingCount": 1,
    "latitude": 44.8323622,
    "longitude": -92.6482193,
    "phone": "(715) 426-3420",
    "city": { "name": "River Falls" },
    "address": "W10225 County Rd FF, River Falls, WI 54022",
    "addressComponents": { "city": "River Falls", "address1": "W10225 County Rd FF", "postalCode": "54022", "stateOrProvince": "WI" },
    "website": "https://www.rfcity.org/989/River-Falls-Dog-Park"
  },
  {
    "id": 11793,
    "name": "Sister Bay Dog Park",
    "summary": "If Fido needs a place to stretch his legs, bring him for a romp at the Sister Bay Dog Park in Sister Bay, WI. Entirely fenced in and equipped with picnic tables and mutt mitts, the park is open year-round, from dawn until dusk, and is free to the public.",
    "rating": 4.5,
    "ratingCount": 4,
    "latitude": 45.18901,
    "longitude": -87.1101437,
    "phone": "(920) 854-4118",
    "city": { "name": "Sister Bay" },
    "address": "2124 Autumn Ct, Sister Bay, WI 54234",
    "addressComponents": { "city": "Sister Bay", "address1": "2124 Autumn Ct", "postalCode": "54234", "stateOrProvince": "WI" },
    "website": "https://www.sisterbaywi.gov/play/dog-park/"
  },
  {
    "id": 20044,
    "name": "Bark & Brew",
    "summary": "Bark & Brew is a pet-friendly spot in Howard, WI. The first of its kind, this off-leash, indoor/outdoor, climate-controlled establishment has a dog menu and delicious beverages for humans. Though they do not sell human food, you can bring in your own or have it delivered from your favorite takeout spot!",
    "rating": 5.0,
    "ratingCount": 3,
    "latitude": 44.5644788,
    "longitude": -88.0799234,
    "phone": "(920) 489-2202",
    "city": { "name": "Howard" },
    "address": "2514 Glendale Ave, Howard, WI 54313",
    "addressComponents": { "city": "Howard", "address1": "2514 Glendale Ave", "postalCode": "54313", "stateOrProvince": "WI" },
    "website": "http://www.barknbrewwi.com"
  },
  {
    "id": 18607,
    "name": "The City of Superior Dog Park",
    "summary": "Fido is invited to play at The City of Superior Dog Park near the Millennium Trailhead in Wisconsin. This off-leash area has a two-way entrance and various trees spread throughout for shade. Amenities also include benches and waste stations.",
    "rating": 5.0,
    "ratingCount": 4,
    "latitude": 46.7050166,
    "longitude": -92.1236832,
    "phone": "(715) 395-7270",
    "city": { "name": "Superior" },
    "address": "N 28th St, Superior, WI 54880",
    "addressComponents": { "city": "Superior", "address1": "N 28th St", "postalCode": "54880", "stateOrProvince": "WI" },
    "website": "http://www.ci.superior.wi.us/839/Dog-Park"
  },
  {
    "id": 12769,
    "name": "Point Dog Park",
    "summary": "Fido is invited to play at Point Dog Park in Stevens Point, WI. The off-leash facility contains two separate sections that are approximately 30 acres. Amenities include trails, wooded areas, benches and waste stations.",
    "rating": 5.0,
    "ratingCount": 2,
    "latitude": 44.5096973,
    "longitude": -89.5810604,
    "phone": "(715) 346-1531",
    "city": { "name": "Stevens Point" },
    "address": "601 Mason St, Stevens Point, WI 54481",
    "addressComponents": { "city": "Stevens Point", "address1": "601 Mason St", "postalCode": "54481", "stateOrProvince": "WI" },
    "website": "http://stevenspoint.com/index.aspx?NID=158"
  },
  {
    "id": 18181,
    "name": "Viroqua Bark Park",
    "summary": "Fido is invited to play at Viroqua Bark Park in Wisconsin. The off-leash facility is separated into two sections for large and small dogs. Amenities include solar lights, picnic tables and benches. Please note there is no water source in this park, so pack some for your pup.",
    "rating": 5.0,
    "ratingCount": 2,
    "latitude": 43.5717494,
    "longitude": -90.8797659,
    "phone": "(608) 637-6955",
    "city": { "name": "Viroqua" },
    "address": "700 Power Dr, Viroqua, WI 54665",
    "addressComponents": { "city": "Viroqua", "address1": "700 Power Dr", "postalCode": "54665", "stateOrProvince": "WI" },
    "website": "https://www.driftlesshumanesociety.com/viroqua-bark-park"
  },
  {
    "id": 13026,
    "name": "Florence Bark Park",
    "summary": "Bring your pup to the Florence Bark Park, a one-acre fenced-in off-leash dog park in Florence, WI. There are benches for humans and plenty of space for your pup to run, socialize and get some exercise.",
    "rating": 4.5,
    "ratingCount": 2,
    "latitude": 45.9224395,
    "longitude": -88.2639785,
    "phone": "(888) 889-0049",
    "city": { "name": "Florence" },
    "address": "5628 Forestry Dr, Florence, WI 54121",
    "addressComponents": { "city": "Florence", "address1": "5628 Forestry Dr", "postalCode": "54121", "stateOrProvince": "WI" },
    "website": "https://www.exploreflorencecounty.com/resources/photos/florence-bark-park/"
  },
  {
    "id": 22710,
    "name": "Marvin & Marie Schweer's Dog Park",
    "summary": "Marvin & Marie Schweer's Dog Park is an off-leash recreation space in DeForest, WI. The park ensures pups play safely and comfortably with two separate fenced-in areas for large and small dogs. The park is free for residents, but visitors may pay a one-time or annual fee to let Fido play.",
    "rating": 5.0,
    "ratingCount": 1,
    "latitude": 43.2600591,
    "longitude": -89.3381002,
    "phone": "(608) 846-6751",
    "city": { "name": "De Forest" },
    "address": "700 Stevenson St, De Forest, WI 53532",
    "addressComponents": { "city": "De Forest", "address1": "700 Stevenson St", "postalCode": "53532", "stateOrProvince": "WI" },
    "website": "https://www.vi.deforest.wi.us/index.asp?Type=B_BASIC&SEC=%7BEB79463C-7B97-44E1-BC11-9E8AA5895454%7D"
  },
  {
    "id": 13701,
    "name": "Webster Community Dog Park",
    "summary": "Fido is invited to play at the Webster Community Dog Park in Wisconsin. This off-leash facility has two separate sections for small and large dogs and a training area. Amenities include waste stations and double-gated entrances for safety.",
    "rating": 5.0,
    "ratingCount": 2,
    "latitude": 45.8676535,
    "longitude": -92.3647619,
    "phone": "(715) 866-4211",
    "city": { "name": "Webster" },
    "address": "27383 Hwy 35 N, Webster, WI 54893",
    "addressComponents": { "city": "Webster", "address1": "27383 Hwy 35 N", "postalCode": "54893", "stateOrProvince": "WI" },
    "website": "https://websterwisconsin.com/dog-park/"
  },
  {
    "id": 19681,
    "name": "Spring Green Dog Park",
    "summary": "Bring Fido to blow off some steam at the Spring Green Dog Park in Spring Green, WI. This off-leash pup recreation area features separate sections for small and large dogs, and is a great place to bring your pooch to play, have fun and make some new friends. Dog owners are reminded to keep an eye on their pup as they play and to clean up any mess that they leave behind.",
    "rating": 5.0,
    "ratingCount": 1,
    "latitude": 43.1738239,
    "longitude": -90.081069,
    "phone": "(608) 432-8406",
    "city": { "name": "Spring Green" },
    "address": "S12947 Shifflet Rd, Spring Green, WI 53588",
    "addressComponents": { "city": "Spring Green", "address1": "S12947 Shifflet Rd", "postalCode": "53588", "stateOrProvince": "WI" },
    "website": "http://springgreendogpark.com/"
  }
];

// Keywords to detect amenities from descriptions
const AMENITY_KEYWORDS = {
  'waste stations': 'waste_bags',
  'waste station': 'waste_bags',
  'waste bag': 'waste_bags',
  'mutt mitt': 'waste_bags',
  'poop disposal': 'waste_bags',
  'picnic table': 'picnic_tables',
  'bench': 'benches',
  'shade tree': 'shade_trees',
  'trees': 'shade_trees',
  'wooded': 'shade_trees',
  'tree': 'shade_trees',
  'water': 'water_access',
  'drinking fountain': 'water_access',
  'water station': 'water_access',
  'water source': 'water_access',
  'dip his paws': 'water_access',
  'agility': 'agility_equipment',
  'fenced': 'fenced',
  'fenced-in': 'fenced',
  'trails': 'walking_trails',
  'path': 'walking_trails',
  'pathway': 'walking_trails',
  'parking': 'parking',
  'porta-potty': 'restroom',
  'restroom': 'restroom',
  'light': 'lighting',
  'solar light': 'lighting',
  'separate section': 'separate_areas',
  'separate area': 'separate_areas',
  'small dogs': 'separate_areas',
  'large dogs': 'separate_areas',
  'training area': 'training_area',
  'double-gated': 'double_gated',
  'beach': 'water_access',
};

/**
 * Detect amenities from the park description/summary
 */
function detectAmenities(summary) {
  const amenities = [];
  const text = summary.toLowerCase();
  
  for (const [keyword, amenity] of Object.entries(AMENITY_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase()) && !amenities.includes(amenity)) {
      amenities.push(amenity);
    }
  }
  
  // Sort for consistency
  return amenities.sort();
}

/**
 * Check if description indicates the park is fenced
 */
function detectFenced(summary) {
  const text = summary.toLowerCase();
  return text.includes('fenced') || 
         text.includes('fenced-in') || 
         text.includes('fully fenced') ||
         text.includes('enclosed');
}

/**
 * Check if description indicates water availability
 * Note: Some parks explicitly mention NO water, handle that
 */
function detectWater(summary) {
  const text = summary.toLowerCase();
  
  // Explicit "no water" mentions
  if (text.includes('no water') || 
      text.includes('no running water') ||
      text.includes('pack some for your pup')) {
    return false;
  }
  
  return text.includes('water') || 
         text.includes('drinking fountain') ||
         text.includes('water station') ||
         text.includes('water source') ||
         text.includes('water for') ||
         text.includes('dip his paws') ||
         text.includes('beach');
}

/**
 * Check if description indicates shade availability
 */
function detectShade(summary) {
  const text = summary.toLowerCase();
  return text.includes('shade') || 
         text.includes('trees') || 
         text.includes('tree') ||
         text.includes('wooded');
}

/**
 * Escape SQL string literals
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Generate SQL insert statements
 */
function generateSql(parks) {
  const lines = [
    `-- ============================================================`,
    `-- Seed Wisconsin Dog Parks from BringFido`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total parks: ${parks.length}`,
    `-- Source: https://www.bringfido.com/attraction/`,
    `-- ============================================================`,
    ``,
    `-- Clear existing WI parks first (optional - comment out if you want to keep existing)`,
    `-- DELETE FROM parks WHERE address LIKE '%, WI %';`,
    ``,
    `INSERT INTO parks (name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade)`,
    `VALUES`
  ];
  
  const values = parks.map((park, index) => {
    const summary = park.summary || '';
    const amenities = detectAmenities(summary);
    const isFenced = detectFenced(summary);
    const hasWater = detectWater(summary);
    const hasShade = detectShade(summary);
    
    const name = escapeSql(park.name);
    const description = escapeSql(summary);
    const address = escapeSql(park.address);
    const amenitiesArray = amenities.length > 0 ? amenities.map(a => `'${a}'`).join(', ') : '';
    
    const isLast = index === parks.length - 1;
    
    return `  ('${name}', '${description}', ${park.latitude}, ${park.longitude}, '${address}', ARRAY[${amenitiesArray}]::text[], ${isFenced}, ${hasWater}, ${hasShade})${isLast ? ';' : ','}`;
  });
  
  lines.push(...values);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Main function
 */
function main() {
  console.log('=== Generating SQL for Wisconsin Dog Parks ===\n');
  
  console.log(`Processing ${SAMPLE_PARKS.length} parks...\n`);
  
  // Show detection stats
  let fencedCount = 0;
  let waterCount = 0;
  let shadeCount = 0;
  
  SAMPLE_PARKS.forEach(park => {
    const summary = park.summary || '';
    if (detectFenced(summary)) fencedCount++;
    if (detectWater(summary)) waterCount++;
    if (detectShade(summary)) shadeCount++;
  });
  
  console.log('Detected features:');
  console.log(`  - Fenced: ${fencedCount} parks`);
  console.log(`  - Water: ${waterCount} parks`);
  console.log(`  - Shade: ${shadeCount} parks`);
  console.log('');
  
  const sql = generateSql(SAMPLE_PARKS);
  
  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
  
  console.log(`SQL file written to: ${OUTPUT_FILE}`);
  console.log('\nPreview of parks:');
  SAMPLE_PARKS.forEach((park, i) => {
    const summary = park.summary || '';
    console.log(`  ${i + 1}. ${park.name} (${park.city?.name}, WI)`);
    console.log(`     Address: ${park.address}`);
    console.log(`     Features: Fenced=${detectFenced(summary)}, Water=${detectWater(summary)}, Shade=${detectShade(summary)}`);
    console.log(`     Amenities: [${detectAmenities(summary).join(', ')}]`);
    console.log('');
  });
}

main();
