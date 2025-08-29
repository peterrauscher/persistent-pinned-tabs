import { safeSendMessage } from "./utils/bg.js";

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

  if (message.type === "ppt_inject_main_world") {
    const tabId = sender.tab && sender.tab.id;
    if (!tabId) return true;
    try {
      chrome.scripting.executeScript(
        {
          target: { tabId, allFrames: false },
          files: ["spa_main_world.js"],
          world: "MAIN",
        },
        () => {
          void chrome.runtime.lastError;
        }
      );
    } catch (_) {}
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "ppt_sync_is_pinned") {
    const tabId = sender.tab && sender.tab.id;
    if (!tabId) return true;
    const setVal = Boolean(message.value);
    try {
      chrome.scripting.executeScript(
        {
          target: { tabId, allFrames: false },
          func: (val) => {
            try {
              window.__ppt_isPinned = Boolean(val);
            } catch (_) {}
          },
          world: "MAIN",
        },
        () => {
          void chrome.runtime.lastError;
        }
      );
    } catch (_) {}
    sendResponse({ ok: true });
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

const pinnedTabInfo = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    if (!tab) return;
    if (!tab.pinned) {
      pinnedTabInfo.delete(tabId);
      return;
    }
    if (typeof tab.url === "string" && tab.url.startsWith("chrome")) return;
    const info = pinnedTabInfo.get(tabId) || {};
    if (changeInfo.url || typeof tab.url === "string") {
      info.url = changeInfo.url || tab.url;
    }
    if (typeof tab.index === "number") info.index = tab.index;
    if (typeof tab.windowId === "number") info.windowId = tab.windowId;
    pinnedTabInfo.set(tabId, info);
  } catch (_) {}
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  try {
    const info = pinnedTabInfo.get(tabId);
    if (!info) return;
    pinnedTabInfo.delete(tabId);
    const { url, index, windowId } = info;
    if (!url) return;
    chrome.tabs.create(
      { url, pinned: true, index, windowId, active: false },
      () => {
        void chrome.runtime.lastError;
      }
    );
  } catch (_) {}
});

chrome.webNavigation.onCommitted.addListener((details) => {
  try {
    if (details.frameId !== 0) return;
    const tabId = details.tabId;
    const transitionQualifiers = details.transitionQualifiers || [];
    const isFromAddressBar =
      details.transitionType === "typed" ||
      details.transitionType === "generated" ||
      transitionQualifiers.includes("from_address_bar");
    if (!isFromAddressBar) return;
    chrome.tabs.get(tabId, (tab) => {
      const err = chrome.runtime.lastError;
      void err;
      if (!tab || !tab.pinned) return;
      const targetUrl = details.url;
      const restore = pinnedTabInfo.get(tabId);
      const openerTabId = tab.id;
      const newIndex =
        typeof tab.index === "number" ? tab.index + 1 : undefined;

      if (restore && restore.url && restore.url !== targetUrl) {
        chrome.tabs.update(tabId, { url: restore.url }, () => {
          void chrome.runtime.lastError;
        });
      }

      chrome.tabs.create(
        { url: targetUrl, active: true, openerTabId, index: newIndex },
        () => {
          void chrome.runtime.lastError;
        }
      );
    });
  } catch (_) {}
});
