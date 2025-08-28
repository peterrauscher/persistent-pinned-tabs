function safeSendMessage(tabId, message) {
  try {
    chrome.tabs.sendMessage(tabId, message, () => {
      // Swallow errors for tabs without content scripts or if tab no longer exists
      void chrome.runtime.lastError;
    });
  } catch (_) {
    // Ignore
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "getPinState") {
    const pinned = Boolean(sender.tab && sender.tab.pinned);
    const tabId = sender.tab ? sender.tab.id : null;
    sendResponse({ pinned, tabId });
    return true;
  }

  if (message.type === "openUrl") {
    const url = String(message.url || "");
    if (!url) {
      sendResponse({ ok: false, error: "Missing URL" });
      return true;
    }

    const openerTabId = sender.tab ? sender.tab.id : undefined;
    const index =
      sender.tab && typeof sender.tab.index === "number"
        ? sender.tab.index + 1
        : undefined;

    chrome.tabs.create({ url, active: true, openerTabId, index }, () => {
      void chrome.runtime.lastError;
      sendResponse({ ok: true });
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (Object.prototype.hasOwnProperty.call(changeInfo, "pinned")) {
    safeSendMessage(tabId, {
      type: "pinState",
      pinned: Boolean(tab && tab.pinned),
    });
  }
});
