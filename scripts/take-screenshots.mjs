import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8081';
const EMAIL = 'joe@tekjoe.org';
const PASSWORD = 'test123';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    geolocation: { latitude: 44.9778, longitude: -93.265 },
    permissions: ['geolocation'],
  });
  const page = await context.newPage();

  // 1. Sign in
  console.log('Navigating to sign-in...');
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });

  await page.locator('input[placeholder="your@email.com"]').first().fill(EMAIL);
  await page.locator('input[placeholder="••••••••"]').first().fill(PASSWORD);
  await page.getByText('Sign In', { exact: true }).first().click();

  console.log('Waiting for auth redirect...');
  await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('Logged in. Current URL:', page.url());

  // 2. Screenshot: Map / Explore page
  console.log('Taking map screenshot...');
  await page.goto(`${BASE_URL}/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({
    path: 'assets/screenshots/map-explore.png',
    fullPage: false,
  });
  console.log('Saved: assets/screenshots/map-explore.png');

  // 3. Screenshot: Create Playdate page
  console.log('Taking playdate screenshot...');
  await page.goto(`${BASE_URL}/playdates/create`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: 'assets/screenshots/schedule-playdate.png',
    fullPage: false,
  });
  console.log('Saved: assets/screenshots/schedule-playdate.png');

  // 4. Screenshot: Dog Park Detail page
  // Click on a park from the explore sidebar to navigate to its detail page
  console.log('Navigating to park detail...');
  await page.goto(`${BASE_URL}/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Click on "Loring Park" in the sidebar (we can see it in the explore list)
  const parkName = page.getByText('Loring Park', { exact: true }).first();
  if (await parkName.count() > 0) {
    console.log('Clicking on Loring Park...');
    await parkName.click();
    await page.waitForTimeout(2000);
  }

  // After clicking a park in explore, it may show a detail panel or navigate
  // Check if URL changed
  console.log('URL after park click:', page.url());

  // The explore page might show park detail inline. Let's check for a "View Details" or similar button
  const viewDetails = page.getByText('View Details').first();
  if (await viewDetails.count() > 0) {
    console.log('Clicking View Details...');
    await viewDetails.click();
    await page.waitForTimeout(3000);
  }

  console.log('URL after View Details:', page.url());

  // If we're on a park detail page, take the screenshot
  if (page.url().includes('/dog-parks/')) {
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'assets/screenshots/park-detail.png',
      fullPage: false,
    });
    console.log('Saved: assets/screenshots/park-detail.png');
  } else {
    // Fallback: navigate directly using the park slug pattern
    // Loring Park in Minnesota -> /dog-parks/minnesota/loring-park
    console.log('Navigating directly to /dog-parks/minnesota/loring-park...');
    await page.goto(`${BASE_URL}/dog-parks/minnesota/loring-park`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'assets/screenshots/park-detail.png',
      fullPage: false,
    });
    console.log('Saved: assets/screenshots/park-detail.png');
  }

  await browser.close();
  console.log('Done!');
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
