// fetchLinkedInProfileImage.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'cookies.json');

// Enable stealth mode.
puppeteer.use(StealthPlugin());

/**
 * Load cookies from file into the page.
 */
async function loadCookies(page) {
  if (fs.existsSync(COOKIES_PATH)) {
    const cookiesString = fs.readFileSync(COOKIES_PATH);
    const cookies = JSON.parse(cookiesString);
    for (const cookie of cookies) {
      await page.setCookie(cookie);
    }
    console.log('Cookies loaded from file.');
  } else {
    console.error('No cookies file found. Please export your cookies from your browser.');
  }
}

/**
 * Fetch the profile image URL from a LinkedIn profile.
 * This function relies exclusively on cookies for authentication.
 *
 * @param {string} profileUrl - LinkedIn profile URL.
 * @returns {Promise<string|null>} - The profile image URL, or null if not found or not logged in.
 */
async function fetchLinkedInProfileImage(profileUrl) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Use non-headless mode for debugging; change to true when stable.
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });
    
    // Load saved cookies from the file.
    await loadCookies(page);
    
    // Navigate to the profile page using "domcontentloaded" instead of "networkidle2".
    console.log(`Navigating to profile: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    
    // Attempt to extract the profile image using a primary selector.
    let imageUrl;
    const primarySelector = 'button[aria-label="open profile picture"] img';
    try {
      console.log(`Waiting for primary selector: ${primarySelector}`);
      await page.waitForSelector(primarySelector, { timeout: 15000 });
      imageUrl = await page.$eval(primarySelector, (img) => img.getAttribute('src'));
      console.log('Profile image found using primary selector:', imageUrl);
    } catch (primaryError) {
      console.warn('Primary selector did not yield an image. Attempting fallback...', primaryError);
      const fallbackSelector = 'meta[property="og:image"]';
      try {
        await page.waitForSelector(fallbackSelector, { timeout: 15000 });
        imageUrl = await page.$eval(fallbackSelector, (meta) => meta.getAttribute('content'));
        console.log('Profile image found using fallback selector:', imageUrl);
      } catch (fallbackError) {
        console.warn('Fallback selector also failed.', fallbackError);
      }
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error fetching LinkedIn profile image:', error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = fetchLinkedInProfileImage;
