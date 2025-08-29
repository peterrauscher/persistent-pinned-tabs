let isPinnedTab = false;

function syncPinnedFlagIntoPageWorld() {
  try {
    chrome.runtime.sendMessage({
      type: "ppt_sync_is_pinned",
      value: Boolean(isPinnedTab),
    });
  } catch (_) {}
}

function requestInitialPinState() {
  try {
    chrome.runtime.sendMessage({ type: "getPinState" }, (response) => {
      if (response && typeof response.pinned === "boolean") {
        isPinnedTab = response.pinned;
        syncPinnedFlagIntoPageWorld();
      }
    });
  } catch (_) {}
}

requestInitialPinState();

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "pinState") {
    isPinnedTab = Boolean(message.pinned);
    syncPinnedFlagIntoPageWorld();
  }
});

function findAnchorFromEvent(event) {
  const path = (event.composedPath && event.composedPath()) || [];
  for (const node of path) {
    if (!node || node === window || node === document) continue;
    if (node.tagName === "A" && node.href) return node;
  }
  let el = event.target;
  while (el && el !== document.body) {
    if (el.tagName === "A" && el.href) return el;
    el = el.parentElement;
  }
  return null;
}

function isHashOnlyNavigation(url) {
  try {
    const target = new URL(url, location.href);
    return (
      target.origin === location.origin &&
      target.pathname === location.pathname &&
      target.search === location.search &&
      target.hash !== ""
    );
  } catch (_) {
    return false;
  }
}

document.addEventListener(
  "click",
  (event) => {
    if (!isPinnedTab) return;
    if (event.defaultPrevented) return;

    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    const anchor = findAnchorFromEvent(event);
    if (!anchor) return;

    if (anchor.target === "_blank") return;
    if (anchor.hasAttribute("download")) return;

    const href = anchor.href;
    if (!href) return;
    if (isHashOnlyNavigation(href)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
      const url = new URL(href, location.href).href;
      chrome.runtime.sendMessage({ type: "openUrl", url, active: true });
    } catch (_) {}
  },
  { capture: true, passive: false }
);

window.addEventListener("ppt-open-url", (event) => {
  try {
    if (!isPinnedTab) return;
    const detail = event && event.detail;
    const href =
      detail && detail.url ? new URL(detail.url, location.href).href : null;
    if (!href) return;
    if (isHashOnlyNavigation(href)) return;
    chrome.runtime.sendMessage({ type: "openUrl", url: href, active: true });
  } catch (_) {}
});
