const { Client } = require('@notionhq/client');

// Initialize Notion client with your integration token.
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Update the Notion page's icon and cover.
 *
 * @param {string} pageId - The ID of the Notion page to update.
 * @param {string} imageUrl - The URL of the image to use for both the icon and cover.
 */
async function updateNotionPage(pageId, imageUrl) {
  try {
    // Update the page icon and cover.
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

    console.log(`Notion page ${pageId} updated with cover and icon ${imageUrl}`);
  } catch (error) {
    console.error('Error updating Notion page:', error.body || error);
    throw error;
  }
}

module.exports = updateNotionPage;
