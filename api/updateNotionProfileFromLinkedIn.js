/**
 * updateNotionProfileFromLinkedIn.js
 *
 * Combines functionality to:
 *  1. Fetch a LinkedIn profile image using Puppeteer with stealth mode.
 *  2. Update a Notion page's icon and cover using the Notion API.
 *  3. Serve as a serverless function (e.g., for Vercel) that accepts a POST request.
 *
 * Environment variables:
 *  - NOTION_API_KEY: Your Notion API integration token.
 *
 * Prerequisites:
 *  - A valid cookies.json file in the same directory (exported from your browser) for LinkedIn authentication.
 */

// Force static import of the evasions module so that it is bundled correctly by Vercel.
try {
  require('puppeteer-extra-plugin-stealth/evasions/chrome.app');
} catch (e) {
  console.warn('Warning: Could not load chrome.app evasion module. It may already be included or not needed:', e);
}

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

const COOKIES_PATH = path.join(__dirname, 'cookies.json');

// Enable stealth mode for puppeteer.
puppeteer.use(StealthPlugin());

// Initialize the Notion client with your integration token.
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Load cookies from file into the provided Puppeteer page.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @throws Will throw an error if the cookies file does not exist.
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
    // Throw an error if cookies file is missing.
    throw new Error('No cookies file found. Please export your cookies from your browser.');
  }
}

/**
 * Fetch the LinkedIn profile image URL.
 * This function relies on cookies for authentication.
 *
 * @param {string} profileUrl - The LinkedIn profile URL.
 * @returns {Promise<string|null>} - The profile image URL, or null if not found.
 */
async function fetchLinkedInProfileImage(profileUrl) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Set to true in production.
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    // Load cookies to maintain the LinkedIn session.
    await loadCookies(page);

    console.log(`Navigating to LinkedIn profile: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    let imageUrl;
    const primarySelector = 'button[aria-label="open profile picture"] img';
    try {
      console.log(`Waiting for primary selector: ${primarySelector}`);
      await page.waitForSelector(primarySelector, { timeout: 15000 });
      imageUrl = await page.$eval(primarySelector, (img) => img.getAttribute('src'));
      console.log('Profile image found using primary selector:', imageUrl);
    } catch (primaryError) {
      console.warn('Primary selector failed. Trying fallback selector...', primaryError);
      const fallbackSelector = 'meta[property="og:image"]';
      try {
        await page.waitForSelector(fallbackSelector, { timeout: 15000 });
        imageUrl = await page.$eval(fallbackSelector, (meta) => meta.getAttribute('content'));
        console.log('Profile image found using fallback selector:', imageUrl);
      } catch (fallbackError) {
        console.warn('Fallback selector failed as well.', fallbackError);
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

/**
 * Update the Notion page's icon and cover with the provided image URL.
 *
 * @param {string} pageId - The Notion page ID to update.
 * @param {string} imageUrl - The URL of the image to use.
 * @returns {Promise<void>}
 */
async function updateNotionPage(pageId, imageUrl) {
  try {
    await notion.pages.update({
      page_id: pageId,
      icon: {
        type: 'external',
        external: { url: imageUrl },
      },
      cover: {
        type: 'external',
        external: { url: imageUrl },
      },
    });
    console.log(`Notion page ${pageId} updated with image ${imageUrl}`);
  } catch (error) {
    console.error('Error updating Notion page:', error.body || error);
    throw error;
  }
}

/**
 * Serverless function handler.
 * Expects a JSON body with:
 *  - notionPageId: The ID of the Notion page to update.
 *  - linkedInUrl: The LinkedIn profile URL.
 *
 * Responds with the fetched image URL on success.
 *
 * @param {import('http').IncomingMessage} req - The incoming request.
 * @param {import('http').ServerResponse} res - The outgoing response.
 */
module.exports = async (req, res) => {
  // Allow only POST requests.
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    // Assume the request body is already parsed as JSON.
    const { notionPageId, linkedInUrl } = req.body;

    if (!notionPageId || !linkedInUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing notionPageId or linkedInUrl in request body' }));
    }

    console.log('Received payload:', { notionPageId, linkedInUrl });

    // Step 1: Retrieve the LinkedIn profile image.
    const imageUrl = await fetchLinkedInProfileImage(linkedInUrl);
    if (!imageUrl) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Could not retrieve image from LinkedIn' }));
    }

    // Step 2: Update the Notion page with the image.
    await updateNotionPage(notionPageId, imageUrl);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, imageUrl }));
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error', details: error.message }));
  }
};
