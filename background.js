// background.js — Service Worker
// Message routing hub + Side Panel management

// Import shared modules
importScripts('shared/constants.js', 'shared/diff-engine.js');

// ============ SIDE PANEL SETUP ============

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (e) {
    console.warn('[Background] Failed to open side panel:', e);
  }
});

// Set side panel behavior: open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(e => console.warn('[Background] setPanelBehavior error:', e));

// ============ MESSAGE ROUTING ============

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // --- Progress/Complete messages from content script ---
  // No need to re-broadcast: chrome.runtime.sendMessage from content scripts
  // already delivers to all extension pages (side panel, options, etc.)
  if (msg.action === 'progress' || msg.action === 'batchComplete') {
    return; // just ignore, sidepanel already receives it directly
  }

  // --- Side panel requests to content script ---
  if (msg.target === 'content') {
    forwardToContentScript(msg, sendResponse);
    return true; // async
  }
});

// ============ FORWARD TO CONTENT SCRIPT ============

async function forwardToContentScript(msg, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    // Remove the target field before forwarding
    const { target, ...payload } = msg;

    chrome.tabs.sendMessage(tab.id, payload, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
      }
    });
  } catch (e) {
    sendResponse({ error: e.message });
  }
}

// ============ INITIALIZATION ============

console.log('[KDP X-Ray Helper] Background service worker loaded.');
