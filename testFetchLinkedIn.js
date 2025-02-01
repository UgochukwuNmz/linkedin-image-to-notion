// testFetchLinkedIn.js
require('dotenv').config(); // Ensure you have a .env file with LINKEDIN_EMAIL and LINKEDIN_PASSWORD
const fetchLinkedInProfileImage = require('./fetchLinkedInProfileImage');

(async () => {
  const linkedInProfileUrl = 'https://www.linkedin.com/in/reena0806/';
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    console.error('Please set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in your environment.');
    process.exit(1);
  }

  const imageUrl = await fetchLinkedInProfileImage(linkedInProfileUrl, email, password);
  if (imageUrl) {
    console.log('Fetched Profile Image URL:', imageUrl);
  } else {
    console.log('Failed to fetch the profile image.');
  }
})();
