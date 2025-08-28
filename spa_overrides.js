try {
  chrome.runtime.sendMessage({ type: "ppt_inject_main_world" });
} catch (_) {}
