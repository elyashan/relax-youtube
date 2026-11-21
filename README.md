# Relax YouTube

An always-on **Microsoft Edge (Manifest V3)** extension for distraction-free YouTube watching, paired with official Edge enterprise policy scripts so it cannot be casually toggled off.

> **No off-switch, no settings UI.** Every distraction filter is hardcoded and active at `document_start`. Designed to be published as a **Hidden** extension on the Microsoft Edge Add-ons Store and locked via Windows Registry (`ExtensionInstallForcelist`).

---

## Locked Always-On Features

- **Clean Mode:** Displays only the centered video player on `/watch` pages.
- **Home Page Blocked:** Hides and blocks the `/` home feed with a calm focus screen.
- **Shorts Completely Blocked:** Hides the Shorts tab, Shorts shelves, and Shorts inside related videos, and blocks `/shorts/*` routes.
- **Top Header, Search Bar & Notifications Hidden:** Hides the masthead, search box, notification icon, and blocks the `/` search keyboard shortcut.
- **Comments & Related Videos Hidden:** Removes comments, right-hand/below recommendations, and pause/end overlays.
- **Explore, Trending, Subscriptions & Playables Blocked:** Hides left navigation entries and blocks discovery/feed routes.
- **Autoplay Permanently Disabled:** Automatically turns off autoplay toggles and cancels up-next countdowns.
- **Subscribe, Likes, Live Chat & End Screen Cards Hidden:** Removes interaction clutter and end-screen cards.
- **Read-Only Status Popup:** Clicking the toolbar icon shows active protections only—zero toggles, buttons, or scripts.

*(Black & White Mode, Hide Thumbnails, and Blur Thumbnails remain disabled.)*

---

## Project Structure

```text
relax-youtube/
├── extension/              # Manifest V3 extension source files
│   ├── manifest.json
│   ├── styles.css
│   ├── content.js
│   ├── popup.html
│   ├── popup.css
│   └── icons/
├── policy/                 # Official Edge forced-lock (HKLM Registry Policy) tools
│   ├── apply-lock.ps1
│   ├── verify-lock.ps1
│   └── lock-extension.reg.template
├── scripts/
│   ├── generate-icons.py   # Icon & store logo generator (Python stdlib)
│   └── pack-for-store.ps1  # Store package builder (dist/relax-youtube-store.zip)
├── store-assets/
│   ├── logo-300x300.png
│   └── STORE_LISTING.md
├── tests/
│   └── validate.mjs        # Automated validation & unit tests (Node.js)
├── KURULUM.md              # Step-by-step Turkish setup & lock guide
├── PRIVACY.md              # Zero-data-collection privacy policy
└── LICENSE                 # MIT License
```

---

## Quick Local Test & Validation

1. **Load unpacked in Microsoft Edge (for previewing without policy lock):**
   - Open `edge://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `extension/` folder.
2. **Run automated tests:**
   ```powershell
   node tests/validate.mjs
   ```
3. **Build the store submission `.zip` package:**
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/pack-for-store.ps1
   ```

---

## Hidden Store Publishing & Forced Policy Lock

On non-domain-joined Windows machines, Microsoft Edge restricts `ExtensionInstallForcelist` policy locks to extensions hosted on the official Edge Add-ons Store.

1. Submit `dist/relax-youtube-store.zip` (with `store-assets/logo-300x300.png` and details from [`store-assets/STORE_LISTING.md`](store-assets/STORE_LISTING.md)) to **Microsoft Partner Center** for free with **Visibility** set to **`Hidden`**.
2. After approval, copy the 32-character Extension ID and run the official Registry policy script in an **Administrator PowerShell**:
   ```powershell
   .\policy\apply-lock.ps1 -ExtensionId "<32_CHAR_EXTENSION_ID>"
   ```
   *(By default this also disables InPrivate mode and Guest mode so the lock cannot be bypassed; pass `-KeepInPrivate` or `-KeepGuestMode` to keep either enabled.)*
3. Restart Edge completely and verify under `edge://policy` and `edge://extensions`, or run `.\policy\verify-lock.ps1`.

---

## Privacy

Relax YouTube collects **zero** personal data, stores nothing, and makes zero network requests. See [`PRIVACY.md`](PRIVACY.md).

---

## Türkçe Özet

**Relax YouTube**, kapatma tuşu ve ayar menüsü olmayan, daima aktif bir Microsoft Edge (Manifest V3) YouTube odaklanma eklentisidir. Ana sayfa, Shorts, yorumlar, ilgili videolar, üst çubuk, arama kutusu, bildirimler, abonelikler, Keşfet/Trendler, Playables, Abone Ol/beğeniler, canlı sohbet ve video sonu kartlarını kalıcı olarak gizler; otomatik oynatmayı kapatır.

- **Yerel test:** `edge://extensions` → Geliştirici Modu → Paketten çıkarılmışı yükle → `extension/` klasörünü seçin.
- **Doğrulama:** `node tests/validate.mjs`
- **Adım adım Türkçe kurulum, GitHub, Hidden Edge Add-ons Store yayını ve zorunlu kilit rehberi:** [`KURULUM.md`](KURULUM.md)
