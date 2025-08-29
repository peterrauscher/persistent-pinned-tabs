export function safeSendMessage(tabId, message) {
  try {
    chrome.tabs.sendMessage(tabId, message, () => {
      void chrome.runtime.lastError;
    });
  } catch (_) {}
}
