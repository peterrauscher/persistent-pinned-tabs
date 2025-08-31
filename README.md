# Persistent Pinned Tabs

Keeps pinned tabs truly persistent: links and SPA navigations open in a new tab, pinned tabs auto-restore if closed, and typing a new address opens next to the pinned tab.

[![Chrome Web Store Extension Link](https://developer.chrome.com/static/docs/webstore/branding/image/iNEddTyWiMfLSwFD6qGq.png)](https://chromewebstore.google.com/detail/persistent-pinned-tabs/lakajjeealkdolbihkkjgmcgcplgabna)

## Features

- **Preserve pinned tab**: Keeps the original page in a pinned tab.
- **Open external links in a new tab**: Left-clicks on links open next to the pinned tab.
- **SPA-aware**: Intercepts `history.pushState/replaceState` and `Location.assign/replace` so router navigations also open in a new tab.
- **Typed address handling**: If you type a new URL in a pinned tab’s address bar, the pinned tab is restored and the typed URL opens in a new tab.
- **Auto-reopen pinned tabs if closed**: Accidentally closing a pinned tab recreates it with the last known URL and position.
- **No settings, no data collection**.

## How it works

- A content script detects link clicks on pinned tabs and asks the background to open the URL in a new tab.
- A small main-world script (injected via the scripting API, CSP-safe) wraps SPA navigation APIs to dispatch an event instead of navigating when the tab is pinned.
- The background tracks last-known `{ url, index, windowId }` for pinned tabs to restore them if closed, and intercepts address-bar navigations on pinned tabs.

## Install

1. Enable Developer mode in `chrome://extensions/`.
2. Click "Load unpacked" and select this folder.
3. Pin a tab on any site and browse as usual.

## Usage

- Click links in a pinned tab → opens in a new tab.
- SPA route changes open in a new tab.
- Type a URL in the pinned tab’s address bar → typed URL opens in a new tab; pinned tab stays on the original page.
- If you close a pinned tab accidentally, it reappears.

## Permissions

- `tabs`: read pin state and create/update tabs.
- `webNavigation`: detect typed address-bar navigations.
- `scripting` + `host_permissions` (`<all_urls>`): inject a small scriptlet to catch SPA navigations in a CSP-safe way.

## Privacy

No analytics, no tracking, no network requests.

## Support

If this saved you time, you can support me here:

<a href="https://www.buymeacoffee.com/peter.rauscher" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;" ></a>

## Development

1. Clone:
   ```bash
   git clone https://github.com/peterrauscher/persistent-pinned-tabs.git
   ```
2. Enable Developer mode in `chrome://extensions/`.
3. Load the folder via "Load unpacked".
4. Make changes; then reload the extension and refresh tabs.

## License

MIT
