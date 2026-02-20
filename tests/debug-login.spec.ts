import { test, expect } from '@playwright/test';

// Use localhost for testing - production URL can't be resolved from this environment
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'dylanmerlo@gmail.com';
const TEST_PASSWORD = '#DM$pring23';

test.describe('Debug Login Issues', () => {
  test('attempt admin login and capture all network requests', async ({ page }) => {
    // Collect all network requests and responses
    const requests: { url: string; method: string; status?: number; body?: string }[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          body: request.postData() || undefined,
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const req = requests.find(r => r.url === response.url());
        if (req) {
          req.status = response.status();
          try {
            const body = await response.text();
            console.log(`\n=== API Response: ${response.url()} ===`);
            console.log(`Status: ${response.status()}`);
            console.log(`Body: ${body.substring(0, 500)}`);
          } catch (e) {
            // Ignore body read errors
          }
        }
      }
    });

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });

    // Navigate to login page
    console.log('\n=== Navigating to login page ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'tests/screenshots/01-login-page.png', fullPage: true });
    console.log('Screenshot saved: 01-login-page.png');

    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input#email');
    const passwordInput = page.locator('input[type="password"], input#password');

    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;

    console.log(`\nEmail input found: ${emailExists}`);
    console.log(`Password input found: ${passwordExists}`);

    if (!emailExists || !passwordExists) {
      console.log('\nPage HTML:');
      console.log(await page.content());
      throw new Error('Login form inputs not found');
    }

    // Fill in credentials
    console.log('\n=== Filling login form ===');
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Take screenshot before submit
    await page.screenshot({ path: 'tests/screenshots/02-form-filled.png', fullPage: true });

    // Find and click submit button
    const submitButton = page.locator('button[type="submit"]');
    console.log(`Submit button found: ${await submitButton.count() > 0}`);

    // Click submit and wait for navigation or error
    console.log('\n=== Submitting login form ===');
    await submitButton.click();

    // Wait for either navigation or error message
    try {
      await Promise.race([
        page.waitForURL('**/dashboard**', { timeout: 10000 }),
        page.waitForSelector('[class*="error"], [class*="Error"], .text-cardinal', { timeout: 10000 }),
        new Promise(resolve => setTimeout(resolve, 10000)),
      ]);
    } catch (e) {
      console.log('Timeout waiting for response');
    }

    // Take screenshot after submit
    await page.screenshot({ path: 'tests/screenshots/03-after-submit.png', fullPage: true });
    console.log('Screenshot saved: 03-after-submit.png');

    // Check current URL
    console.log(`\nCurrent URL: ${page.url()}`);

    // Check for error messages
    const errorMessages = await page.locator('[class*="error"], [class*="Error"], .text-cardinal, [class*="cardinal"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('\nError messages found:');
      errorMessages.forEach(msg => console.log(`  - ${msg}`));
    }

    // Print all API requests made
    console.log('\n=== API Requests Summary ===');
    requests.forEach(req => {
      console.log(`${req.method} ${req.url} -> ${req.status || 'pending'}`);
      if (req.body) {
        // Don't log passwords
        const sanitized = req.body.replace(/"password":"[^"]*"/, '"password":"***"');
        console.log(`  Body: ${sanitized}`);
      }
    });
  });

  test('test auth session endpoint directly', async ({ page, request }) => {
    console.log('\n=== Testing Auth Session Endpoint ===');

    // Test the session endpoint
    const sessionResponse = await request.get(`${BASE_URL}/api/auth/session`);
    console.log(`Session endpoint status: ${sessionResponse.status()}`);
    console.log(`Session response: ${await sessionResponse.text()}`);

    // Test CSRF token endpoint
    const csrfResponse = await request.get(`${BASE_URL}/api/auth/csrf`);
    console.log(`\nCSRF endpoint status: ${csrfResponse.status()}`);
    console.log(`CSRF response: ${await csrfResponse.text()}`);

    // Test providers endpoint
    const providersResponse = await request.get(`${BASE_URL}/api/auth/providers`);
    console.log(`\nProviders endpoint status: ${providersResponse.status()}`);
    console.log(`Providers response: ${await providersResponse.text()}`);
  });

  test('attempt login via API directly', async ({ request }) => {
    console.log('\n=== Testing Login API Directly ===');

    // First get CSRF token
    const csrfResponse = await request.get(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log(`CSRF Token: ${csrfData.csrfToken}`);

    // Attempt login
    const loginResponse = await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${BASE_URL}/dashboard`,
        json: 'true',
      },
    });

    console.log(`\nLogin response status: ${loginResponse.status()}`);
    console.log(`Login response headers:`, loginResponse.headers());

    const responseText = await loginResponse.text();
    console.log(`Login response body: ${responseText.substring(0, 500)}`);
  });
});
