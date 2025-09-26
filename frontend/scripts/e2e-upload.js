const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const base = 'http://localhost:3000';
  const email = 'mohat83675@protonza.com';
  const password = 'mohat83675@protonza.com';
  const filePath = path.resolve(__dirname, '..', 'test_files', 'OOPS_Syllabus.pdf');

  console.log('Opening app...')
  await page.goto(base, { waitUntil: 'networkidle' });

  // Try to go to login
  console.log('Navigating to login...');
  await page.goto(base + '/login', { waitUntil: 'networkidle' });

  // Fill login form (make best effort to find inputs)
  try {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {})
    ]);
    console.log('Login attempted');
  } catch (e) {
    console.log('Login form not found or login failed to submit:', e.message);
  }

  // Navigate to upload
  console.log('Going to upload page...');
  await page.goto(base + '/upload', { waitUntil: 'networkidle' });

  // Try to attach file to file input
  try {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Select Files")').catch(()=>{})
    ]);
    await fileChooser.setFiles(filePath);
    console.log('File attached via file chooser');
  } catch (e) {
    // fallback to set input files directly
    try {
      await page.setInputFiles('input[type=file]', filePath);
      console.log('File attached via setInputFiles');
    } catch (err) {
      console.log('Failed to attach file:', err.message);
    }
  }

  // If there's an Upload button, click it
  try {
    await page.click('button:has-text("Upload")');
    console.log('Clicked upload');
  } catch (e) {
    console.log('Upload button not found or click failed:', e.message);
  }

  // Wait a few seconds for the simulated processing to complete
  await page.waitForTimeout(5000);

  // Trigger generate plan if visible
  try {
    await page.click('button:has-text("Generate Plan")');
    console.log('Clicked Generate Plan');
  } catch (e) {
    console.log('Generate Plan button not found or click failed:', e.message);
  }

  // Wait for navigation to dashboard
  await page.waitForTimeout(3000);

  console.log('Done. Closing browser...');
  await browser.close();
})();
