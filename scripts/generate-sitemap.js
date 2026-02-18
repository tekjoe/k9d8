/**
 * Generates a dynamic sitemap.xml from static routes, blog posts, and Supabase park state data.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *
 * Environment variables required:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

// Load .env file if it exists (for local development)
// On Vercel, environment variables are already injected
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'https://k9d8.com';
const OUTPUT = path.join(__dirname, '..', 'public', 'sitemap.xml');

// --- Static routes ---
const staticRoutes = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/landing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/features', changefreq: 'monthly', priority: '0.8' },
  { loc: '/download', changefreq: 'monthly', priority: '0.8' },
  { loc: '/dog-parks', changefreq: 'weekly', priority: '0.8' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.7' },
];

// --- Blog posts (read from content/blog/index.ts) ---
function getBlogSlugs() {
  // Parse the blogPosts array from the TS source to avoid needing ts-node
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'content', 'blog', 'index.ts'),
    'utf-8'
  );
  const slugs = [];
  const regex = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

// --- US state abbreviation → full name ---
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

function extractStateAbbrev(row) {
  const st = (row.state || '').trim();
  if (/^[A-Z]{2}(\s|$)/.test(st)) return st.slice(0, 2);
  const city = (row.city || '').trim();
  if (/^\d+$/.test(st) && /^[A-Z]{2}$/.test(city)) return city;
  return null;
}

// --- Park states from Supabase ---
async function getParkStates() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('⚠ Supabase env vars not set — skipping state URLs');
    return [];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('parks')
    .select('city, state')
    .not('state', 'is', null);

  if (error) {
    console.warn('⚠ Failed to fetch park states:', error.message);
    return [];
  }

  const stateSet = new Set();
  for (const row of data) {
    const abbrev = extractStateAbbrev(row);
    if (abbrev && STATE_NAMES[abbrev]) stateSet.add(STATE_NAMES[abbrev]);
  }

  return [...stateSet].map((name) => name.toLowerCase().replace(/\s+/g, '-'));
}

// --- Build XML ---
function buildSitemap(urls) {
  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  const urls = [...staticRoutes];

  // Blog post URLs
  const slugs = getBlogSlugs();
  for (const slug of slugs) {
    urls.push({ loc: `/blog/${slug}`, changefreq: 'monthly', priority: '0.6' });
  }
  console.log(`✓ ${slugs.length} blog post(s)`);

  // State URLs
  const states = await getParkStates();
  for (const state of states) {
    urls.push({ loc: `/dog-parks/${state}`, changefreq: 'weekly', priority: '0.6' });
  }
  console.log(`✓ ${states.length} state page(s)`);

  const xml = buildSitemap(urls);
  fs.writeFileSync(OUTPUT, xml, 'utf-8');
  console.log(`✓ Wrote ${urls.length} URLs to ${OUTPUT}`);
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
