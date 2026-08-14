/**
 * FocusORM — Content Script
 * Minimal content script for extracting page-level context.
 * Currently used for YouTube video category detection.
 */

// Only run on specific sites that need deeper context
(function () {
  const hostname = window.location.hostname;

  // YouTube: try to detect if content is educational
  if (hostname.includes("youtube.com")) {
    // Extract video category from meta tags if available
    const categoryMeta = document.querySelector('meta[itemprop="genre"]');
    if (categoryMeta) {
      const category = categoryMeta.getAttribute("content");
      chrome.runtime.sendMessage({
        action: "pageContext",
        context: {
          platform: "youtube",
          category: category || "unknown",
          title: document.title,
        },
      });
    }
  }
})();
