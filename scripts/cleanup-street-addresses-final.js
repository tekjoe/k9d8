#!/usr/bin/env node
/**
 * Final targeted cleanup for remaining city names in street addresses
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Additional city names found in remaining data
const additionalCities = [
  // Alabama
  'Opelika', 'Meadowbrook', 'Fultondale', 'Mountain Brook', 'Hoover', 'Moody', 'Trussville', 'Ozark', 'Daphne',
  // Arizona
  'Avondale', 'Buckeye', 'Parker', 'Prescott', 'El Mirage', 'Chino', 'Marana', 'Surprise',
  // California
  'Milpitas', 'Bonita', 'Lake Forest', 'Los Gatos', 'Veracruz',
  // Colorado
  'Highlands Ranch', 'Castle Rock', 'Commerce City', 'Thornton', 'Westminster', 'Lone Tree', 'Broomfield',
  // Connecticut
  'New Haven', 'Hartford', 'Stamford', 'Bridgeport', 'Waterbury',
  // Florida
  'Maitland', 'Altamonte Springs', 'Casselberry', 'Longwood', 'Lake Mary', 'Sanford', 'Deland', 'Daytona', 'Port Orange',
  // Georgia
  'Smyrna', 'Marietta', 'Kennesaw', 'Acworth', 'Woodstock', 'Canton', 'Holly Springs', 'Alpharetta', 'Roswell', 'Dunwoody',
  // Illinois
  'Schaumburg', 'Naperville', 'Aurora', 'Elgin', 'Waukegan', 'Cicero', 'Arlington Heights', 'Evanston', 'Decatur',
  // Indiana
  'Carmel', 'Fishers', 'Noblesville', 'Greenwood', 'Lawrence', 'Muncie', 'Terre Haute', 'Lafayette', 'West Lafayette',
  // Kansas
  'Overland Park', 'Olathe', 'Shawnee', 'Lenexa', 'Leawood', 'Prairie Village', 'Mission', 'Merriam',
  // Kentucky
  'Bowling Green', 'Owensboro', 'Covington', 'Richmond', 'Georgetown', 'Florence', 'Hopkinsville', 'Nicholasville',
  // Louisiana
  'Metairie', 'Kenner', 'Slidell', 'Hammond', 'Mandeville', 'Covington', 'Bossier City', 'Shreveport', 'Monroe', 'Alexandria',
  // Maryland
  'Annapolis', 'Columbia', 'Silver Spring', 'Rockville', 'Frederick', 'Gaithersburg', 'Bethesda', 'Bowie', 'Towson',
  // Massachusetts
  'Cambridge', 'Somerville', 'Brookline', 'Newton', 'Waltham', 'Woburn', 'Burlington', 'Lexington', 'Concord',
  // Michigan
  'Ann Arbor', 'Grand Rapids', 'Lansing', 'Kalamazoo', 'Muskegon', 'Holland', 'Flint', 'Saginaw', 'Bay City', 'Port Huron',
  'Royal Oak', 'Southfield', 'Troy', 'Warren', 'Sterling Heights', 'Dearborn', 'Livonia', 'Westland',
  'Tawas City', 'Houghton Lake', 'Cadillac', 'Traverse City', 'Petoskey', 'Charlevoix',
  // Minnesota
  'Bloomington', 'Brooklyn Park', 'Plymouth', 'Maple Grove', 'Eden Prairie', 'Coon Rapids', 'Burnsville', 'Blaine', 'Lakeville',
  // Missouri
  'Chesterfield', 'Wildwood', 'Ballwin', 'Kirkwood', 'Webster Groves', 'University City', 'Maryland Heights', 'Hazelwood',
  // New Jersey
  'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Brick', 'Cherry Hill', 'Camden', 'Atlantic City',
  // New York
  'Yonkers', 'White Plains', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'Troy', 'Binghamton',
  // North Carolina
  'Cary', 'Apex', 'Holly Springs', 'Fuquay-Varina', 'Garner', 'Morrisville', 'Wake Forest', 'Rolesville',
  'Durham', 'Chapel Hill', 'Carrboro', 'Hillsborough', 'Pittsboro', 'Sanford', 'Siler City',
  'Greensboro', 'High Point', 'Burlington', 'Graham', 'Mebane', 'Reidsville', 'Eden',
  'Winston-Salem', 'Kernersville', 'Clemmons', 'Lewisville', 'Advance',
  // Ohio
  'Westerville', 'Dublin', 'Powell', 'Worthington', 'Gahanna', 'New Albany', 'Pickerington', 'Reynoldsburg', 'Hilliard',
  'Mason', 'West Chester', 'Fairfield', 'Hamilton', 'Middletown', 'Springboro', 'Lebanon',
  'Cleveland Heights', 'Shaker Heights', 'University Heights', 'South Euclid', 'Lakewood', 'Rocky River', 'Fairview Park',
  // Oklahoma
  'Norman', 'Edmond', 'Moore', 'Midwest City', 'Yukon', 'Mustang', 'Bethany', 'The Village', 'Warr Acres',
  // Pennsylvania
  'Allentown', 'Bethlehem', 'Easton', 'Reading', 'Lancaster', 'Harrisburg', 'York', 'Erie', 'Pittsburgh',
  'Scranton', 'Wilkes-Barre', 'Hazleton', 'Williamsport', 'Altoona', 'Johnstown',
  // South Carolina
  'Mount Pleasant', 'Summerville', 'Goose Creek', 'Hanahan', 'James Island', 'John\'s Island', 'Daniel Island',
  'North Charleston', 'West Ashley', 'Goose Creek', 'Summerville', 'Mount Pleasant',
  // Tennessee
  'Franklin', 'Brentwood', 'Murfreesboro', 'Smyrna', 'La Vergne', 'Hendersonville', 'Gallatin', 'Lebanon', 'Mt. Juliet',
  // Texas
  'Plano', 'Frisco', 'McKinney', 'Allen', 'Richardson', 'Garland', 'Mesquite', 'Irving', 'Carrollton', 'Lewisville',
  'Denton', 'Flower Mound', 'Highland Village', 'Little Elm', 'The Colony', 'Addison', 'Farmers Branch',
  'Cedar Park', 'Round Rock', 'Pflugerville', 'Georgetown', 'Leander', 'Hutto', 'Kyle', 'Buda',
  // Virginia
  'Virginia Beach', 'Norfolk', 'Chesapeake', 'Newport News', 'Hampton', 'Portsmouth', 'Suffolk', 'Williamsburg',
  'Richmond', 'Henrico', 'Chesterfield', 'Hanover', 'Glen Allen', 'Midlothian', 'Mechanicsville',
  'Charlottesville', 'Albemarle', 'Waynesboro', 'Staunton', 'Harrisonburg',
  'Roanoke', 'Salem', 'Vinton', 'Blacksburg', 'Christiansburg',
  // Washington
  'Bellevue', 'Redmond', 'Kirkland', 'Renton', 'Kent', 'Federal Way', 'Auburn', 'Lakewood', 'Tacoma',
  'Everett', 'Lynnwood', 'Edmonds', 'Mountlake Terrace', 'Shoreline', 'Seattle', 'Bainbridge Island',
  'Spokane', 'Spokane Valley', 'Liberty Lake', 'Cheney', 'Pullman', 'Moscow',
  'Olympia', 'Lacey', 'Tumwater', 'Yelm', 'Shelton', 'Centralia', 'Chehalis',
  'Vancouver', 'Camas', 'Washougal', 'Battle Ground', 'Ridgefield', 'Woodland',
  'Bellingham', 'Ferndale', 'Lynden', 'Blaine', 'Sumas', 'Everson', 'Nooksack',
  'Yakima', 'Union Gap', 'Selah', 'Toppenish', 'Wapato', 'Zillah', 'Granger', 'Sunnyside', 'Grandview',
  'Wenatchee', 'East Wenatchee', 'Cashmere', 'Chelan', 'Leavenworth', 'Waterville',
  'Tri-Cities', 'Kennewick', 'Richland', 'Pasco', 'West Richland',
  'Moses Lake', 'Ephrata', 'Soap Lake', 'Othello', 'Warden', 'Mattawa',
  'Walla Walla', 'College Place', 'Dayton', 'Prescott', 'Waitsburg',
  'Ellensburg', 'Cle Elum', 'Roslyn', 'Kittitas', 'Thorp', 'Ronald',
  'Wenatchee', 'Cashmere', 'Chelan', 'Leavenworth',
  'Port Angeles', 'Sequim', 'Forks', 'Port Townsend', 'Sequim', 'Port Hadlock', 'Chimacum',
  'Aberdeen', 'Hoquiam', 'Montesano', 'Elma', 'Ocean Shores', 'Westport', 'Raymond', 'South Bend',
  'Longview', 'Kelso', 'Woodland', 'Kalama', 'Castle Rock', 'Cathlamet', 'Naselle',
  'Bremerton', 'Port Orchard', 'Poulsbo', 'Bainbridge Island', 'Silverdale', 'Seabeck', 'Gorst',
  'Shelton', 'Allyn', 'Belfair', 'Hoodsport', 'Union', 'Tahuya',
  'Olympia', 'Lacey', 'Tumwater', 'Yelm', 'Tenino', 'Rainier', 'Bucoda', 'Rochester',
  'Centralia', 'Chehalis', 'Morton', 'Mossyrock', 'Napavine', 'Pe Ell', 'Toledo', 'Vader', 'Winlock',
  'Longview', 'Kelso', 'Castle Rock', 'Kalama', 'Woodland',
  'Vancouver', 'Camas', 'Washougal', 'Battle Ground', 'Ridgefield', 'La Center', 'Woodland',
  'White Salmon', 'Bingen', 'Carson', 'Stevenson', 'North Bonneville', 'Carson City',
].sort((a, b) => b.length - a.length);

// Get all JSON files
const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('-parks.json'))
  .map(f => path.join(dataDir, f));

console.log(`Found ${files.length} park data files to clean up\n`);

let totalFixed = 0;
let totalParks = 0;
const fixCounts = {};

files.forEach(file => {
  const stateName = path.basename(file, '-parks.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixed = 0;
  
  data.forEach(park => {
    totalParks++;
    if (park.street && park.street.length > 0) {
      const originalStreet = park.street;
      let cleaned = park.street.trim();
      
      // Try to match additional city names at the end
      for (const city of additionalCities) {
        const cityLower = city.toLowerCase();
        const streetLower = cleaned.toLowerCase();
        
        // Check if street ends with this city (case insensitive)
        if (streetLower.endsWith(cityLower)) {
          // Remove the city name
          cleaned = cleaned.slice(0, -city.length).trim();
          fixed++;
          fixCounts[city] = (fixCounts[city] || 0) + 1;
          break; // Only remove one city name
        }
      }
      
      // Clean up trailing punctuation and spaces
      cleaned = cleaned.replace(/[,\s]+$/, '').trim();
      
      if (cleaned !== originalStreet && cleaned.length > 0) {
        park.street = cleaned;
      }
    }
  });
  
  if (fixed > 0) {
    // Save cleaned data back
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`✅ ${stateName}: Fixed ${fixed} addresses`);
    totalFixed += fixed;
  }
});

console.log(`\n📊 Summary: Fixed ${totalFixed}/${totalParks} addresses across ${files.length} states`);

// Show top fixed cities
if (Object.keys(fixCounts).length > 0) {
  console.log('\n🔧 Top city names removed:');
  Object.entries(fixCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count}`);
    });
}
