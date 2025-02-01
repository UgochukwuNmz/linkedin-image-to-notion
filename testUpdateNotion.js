// testUpdateNotion.js
require('dotenv').config(); // Ensure that your NOTION_API_KEY is in your .env file.
const updateNotionPage = require('./updateNotionPage');

// Replace these values with your actual page ID and a test image URL.
const testPageId = 'a08db09e-c057-4921-a253-045d878ed671';  
const testImageUrl = 'https://media.licdn.com/dms/image/v2/D4D03AQFI-7Bbe1RPQQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1673519339027?e=1743638400&v=beta&t=LgeNBav3BJYjTRNbVjZaG_m6bqx9GdL1HxVfYt2LUmE';

(async () => {
  try {
    await updateNotionPage(testPageId, testImageUrl);
    console.log('Update successful. Check your Notion page for changes.');
  } catch (error) {
    console.error('Update failed:', error);
  }
})();