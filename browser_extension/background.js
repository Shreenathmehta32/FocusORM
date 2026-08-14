/**
 * FocusORM — Browser Extension Background Service Worker
 * Tracks active tab changes and sends sanitized domain + title to local backend.
 *
 * PRIVACY:
 * - Only sends domain and sanitized page title
 * - Strips all query parameters, tracking IDs, auth tokens
 * - Never sends full URLs, cookies, or browsing history
 * - Only communicates with localhost (127.0.0.1:8745)
 */

const FOCUSOS_API = "http://127.0.0.1:8745/api/browser/event";

// Tracking parameters to strip
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "gclsrc", "dclid", "msclkid",
  "mc_cid", "mc_eid", "ref", "referrer",
  "si", "feature", "app", "src", "source",
  "t", "s", "share", "ab_channel",
  "token", "auth", "session", "sid", "key",
  "ticket", "code", "state", "nonce",
]);

let lastDomain = "";
let lastTitle = "";
let isTracking = true;

/**
 * Extract and sanitize domain from a URL.
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Sanitize a page title by removing potential PII.
 */
function sanitizeTitle(title) {
  if (!title) return "";

  let clean = title;

  // Remove email addresses
  clean = clean.replace(/[\w.+-]+@[\w-]+\.[\w.]+/gi, "[EMAIL]");

  // Remove file paths
  clean = clean.replace(/[A-Z]:\\[^\s\-–—|]+/gi, "[PATH]");

  // Remove long hex strings (tokens, hashes)
  clean = clean.replace(/\b[0-9a-f]{32,}\b/gi, "[TOKEN]");

  // Truncate
  if (clean.length > 200) {
    clean = clean.substring(0, 200) + "...";
  }

  return clean.trim();
}

/**
 * Send tab info to the local FocusORM backend.
 */
async function sendTabEvent(domain, title) {
  if (!isTracking || !domain) return;

  // Avoid duplicate events
  if (domain === lastDomain && title === lastTitle) return;
  lastDomain = domain;
  lastTitle = title;

  const event = {
    domain: domain,
    title: sanitizeTitle(title),
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(FOCUSOS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (error) {
    // FocusORM server not running — silently ignore
    // Extension should never break browsing experience
  }
}

/**
 * Get the active tab info and send it.
 */
async function handleTabChange() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab && tab.url) {
      // Skip internal browser pages
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") ||
        tab.url.startsWith("chrome-extension://") || tab.url.startsWith("about:")) {
        return;
      }

      const domain = extractDomain(tab.url);
      const title = tab.title || "";

      await sendTabEvent(domain, title);
    }
  } catch {
    // Permission denied or tab not accessible — silently ignore
  }
}

// ─── Event Listeners ─────────────────────────────────────

// Tab activated (user switches tabs)
chrome.tabs.onActivated.addListener(() => {
  handleTabChange();
});

// Tab updated (page navigation, title change)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    handleTabChange();
  }
});

// Window focus changed
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    handleTabChange();
  }
});

// ─── Message Handler (from popup) ────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getStatus") {
    sendResponse({
      tracking: isTracking,
      currentDomain: lastDomain,
      currentTitle: lastTitle,
    });
    return true;
  }

  if (message.action === "toggleTracking") {
    isTracking = !isTracking;
    sendResponse({ tracking: isTracking });
    return true;
  }
});
