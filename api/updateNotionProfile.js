const fetchLinkedInProfileImage = require('./fetchLinkedInProfileImage');
const updateNotionPage = require('./updateNotionPage');

/**
 * Vercel serverless function handler.
 * Expects a JSON body with:
 *   - notionPageId: The Notion page ID to update.
 *   - linkedInUrl: The LinkedIn profile URL.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received webhook payload:', req.body);

    // Parse the incoming JSON body
    const { notionPageId, linkedInUrl } = req.body;

    if (!notionPageId || !linkedInUrl) {
      return res.status(400).json({ error: 'Missing notionPageId or linkedInUrl in request body' });
    }
    
    // Step 1: Fetch the LinkedIn profile image URL.
    const imageUrl = await fetchLinkedInProfileImage(linkedInUrl);

    if (!imageUrl) {
      return res.status(500).json({ error: 'Could not retrieve image from LinkedIn' });
    }

    // Step 2: Update the Notion page with the retrieved image.
    await updateNotionPage(notionPageId, imageUrl);

    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};