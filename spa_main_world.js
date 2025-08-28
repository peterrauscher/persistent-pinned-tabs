(() => {
  if (typeof window.__ppt_isPinned !== "boolean") {
    window.__ppt_isPinned = false;
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

  function shouldOpenInNewTab(url) {
    if (!window.__ppt_isPinned) return false;
    if (url == null || url === undefined) return false;
    try {
      const target = new URL(String(url), location.href);
      return !isHashOnlyNavigation(target.href);
    } catch (_) {
      return false;
    }
  }

  function dispatchOpen(url) {
    try {
      window.dispatchEvent(
        new CustomEvent("ppt-open-url", { detail: { url: String(url) } })
      );
    } catch (_) {}
  }

  try {
    const _pushState = history.pushState;
    history.pushState = function (state, title, url) {
      if (shouldOpenInNewTab(url)) {
        dispatchOpen(url);
        return;
      }
      return _pushState.apply(this, arguments);
    };
  } catch (_) {}

  try {
    const _replaceState = history.replaceState;
    history.replaceState = function (state, title, url) {
      if (shouldOpenInNewTab(url)) {
        dispatchOpen(url);
        return;
      }
      return _replaceState.apply(this, arguments);
    };
  } catch (_) {}

  try {
    const _assign = Location.prototype.assign;
    Location.prototype.assign = function (url) {
      if (shouldOpenInNewTab(url)) {
        dispatchOpen(url);
        return;
      }
      return _assign.call(this, url);
    };
  } catch (_) {}

  try {
    const _replace = Location.prototype.replace;
    Location.prototype.replace = function (url) {
      if (shouldOpenInNewTab(url)) {
        dispatchOpen(url);
        return;
      }
      return _replace.call(this, url);
    };
  } catch (_) {}
})();
