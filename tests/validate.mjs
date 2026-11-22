import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const EXT_DIR = path.join(ROOT, "extension");

function readUtf8(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function assertPngDimensions(relPath, expectedSize) {
  const fullPath = path.join(ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `Missing PNG file: ${relPath}`);
  const buf = fs.readFileSync(fullPath);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buf.length >= 24, `PNG too small: ${relPath}`);
  assert.ok(buf.subarray(0, 8).equals(pngSig), `Invalid PNG signature: ${relPath}`);
  const ihdrTag = buf.subarray(12, 16).toString("ascii");
  assert.equal(ihdrTag, "IHDR", `Expected IHDR chunk first in ${relPath}`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.equal(width, expectedSize, `Width mismatch for ${relPath}`);
  assert.equal(height, expectedSize, `Height mismatch for ${relPath}`);
}

function createMockElement(tagName = "div") {
  const attrs = new Map();
  const children = [];
  const el = {
    tagName: tagName.toUpperCase(),
    id: "",
    className: "",
    textContent: "",
    children,
    parentNode: null,
    setAttribute(k, v) {
      attrs.set(k, String(v));
      if (k === "id") el.id = String(v);
    },
    getAttribute(k) {
      return attrs.has(k) ? attrs.get(k) : null;
    },
    removeAttribute(k) {
      attrs.delete(k);
    },
    hasAttribute(k) {
      return attrs.has(k);
    },
    appendChild(child) {
      child.parentNode = el;
      children.push(child);
      return child;
    },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) {
        children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    },
    remove() {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  };
  return el;
}

function findElementById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  if (!Array.isArray(node.children)) return null;
  for (const child of node.children) {
    const found = findElementById(child, id);
    if (found) return found;
  }
  return null;
}

// 1. Validate manifest.json
{
  const manifest = JSON.parse(readUtf8("extension/manifest.json"));
  assert.equal(manifest.manifest_version, 3, "manifest_version must be 3");
  assert.equal(manifest.name, "Relax YouTube");
  assert.ok(manifest.name.length <= 45, "manifest.name must be <= 45 chars");
  assert.ok(manifest.short_name.length <= 12, "manifest.short_name must be <= 12 chars");
  assert.ok(manifest.description.length <= 132, "manifest.description must be <= 132 chars");
  assert.equal(manifest.version, "1.1.0", "manifest version must be 1.1.0");
  assert.equal(manifest.default_locale, "en", "default_locale must be en");
  assert.ok(!manifest.permissions || manifest.permissions.length === 0, "No extra permissions allowed");
  assert.equal(manifest.options_page, undefined, "options_page must not exist");
  assert.equal(manifest.options_ui, undefined, "options_ui must not exist");
  assert.equal(manifest.background, undefined, "background worker not needed");

  for (const size of ["16", "32", "48", "128"]) {
    const iconRel = manifest.icons?.[size];
    assert.ok(iconRel, `Missing icon size ${size} in manifest.icons`);
    assert.ok(fs.existsSync(path.join(EXT_DIR, iconRel)), `Icon missing on disk: ${iconRel}`);
    assert.equal(manifest.action?.default_icon?.[size], iconRel, `Action icon mismatch for ${size}`);
  }

  assert.equal(manifest.action?.default_title, "__MSG_actionTitle__");
  assert.equal(manifest.action?.default_popup, "popup.html");
  assert.ok(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length === 1);
  const cs = manifest.content_scripts[0];
  assert.deepEqual(cs.matches, [
    "https://www.youtube.com/*",
    "https://m.youtube.com/*",
    "https://youtube.com/*"
  ]);
  assert.deepEqual(cs.css, ["styles.css"]);
  assert.deepEqual(cs.js, ["content.js"]);
  assert.equal(cs.run_at, "document_start");
  assert.equal(cs.all_frames, false);
}

// 2. Validate PNG dimensions
assertPngDimensions("extension/icons/icon16.png", 16);
assertPngDimensions("extension/icons/icon32.png", 32);
assertPngDimensions("extension/icons/icon48.png", 48);
assertPngDimensions("extension/icons/icon128.png", 128);
assertPngDimensions("store-assets/logo-300x300.png", 300);

// 2b. Validate _locales/en and _locales/tr messages.json
const enMessages = JSON.parse(readUtf8("extension/_locales/en/messages.json"));
const trMessages = JSON.parse(readUtf8("extension/_locales/tr/messages.json"));
{
  const enKeys = Object.keys(enMessages).sort();
  const trKeys = Object.keys(trMessages).sort();
  assert.ok(enKeys.length > 0, "_locales/en/messages.json must not be empty");
  assert.deepEqual(trKeys, enKeys, "_locales/tr keys must exactly match _locales/en keys");
  for (const key of enKeys) {
    assert.equal(typeof enMessages[key]?.message, "string");
    assert.ok(enMessages[key].message.trim().length > 0, `Empty en message for ${key}`);
    assert.equal(typeof trMessages[key]?.message, "string");
    assert.ok(trMessages[key].message.trim().length > 0, `Empty tr message for ${key}`);
  }
}

// 3. Validate popup.html & popup.js have zero interactive off-switches or inline scripts
{
  const popupHtmlRaw = readUtf8("extension/popup.html");
  const popupHtml = popupHtmlRaw.toLowerCase();
  assert.ok(!popupHtml.includes("<button"), "popup.html must not contain <button>");
  assert.ok(!popupHtml.includes("<input"), "popup.html must not contain <input>");
  assert.ok(!popupHtml.includes("onclick"), "popup.html must not contain onclick");
  const scriptMatches = [...popupHtmlRaw.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scriptMatches.length, 1, "popup.html must include only popup.js");
  assert.ok(
    /\bsrc=["']popup\.js["']/i.test(scriptMatches[0][1]),
    "popup.html script tag must reference popup.js"
  );
  assert.equal(scriptMatches[0][2].trim(), "", "popup.html must not contain inline script code");
  assert.ok(popupHtml.includes("locked"), "popup.html should show locked state");

  const i18nMatches = [...popupHtmlRaw.matchAll(/data-i18n=["']([^"']+)["']/g)];
  assert.ok(i18nMatches.length >= 10, "popup.html must tag translatable fields with data-i18n");
  for (const m of i18nMatches) {
    assert.ok(Object.hasOwn(enMessages, m[1]), `Unknown data-i18n key in popup.html: ${m[1]}`);
  }

  const popupJs = readUtf8("extension/popup.js");
  assert.ok(!popupJs.includes("innerHTML"), "popup.js must not use innerHTML");
  assert.ok(!popupJs.includes("outerHTML"), "popup.js must not use outerHTML");
  assert.ok(!popupJs.includes("insertAdjacentHTML"), "popup.js must not use insertAdjacentHTML");
  assert.ok(!popupJs.includes("addEventListener"), "popup.js must remain non-interactive");
  assert.ok(!popupJs.includes("onclick"), "popup.js must not attach onclick");
  execFileSync(process.execPath, ["--check", path.join(EXT_DIR, "popup.js")], { stdio: "pipe" });
}

// 4. Validate styles.css braces and required selectors
{
  const css = readUtf8("extension/styles.css");
  let depth = 0;
  for (const ch of css) {
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    assert.ok(depth >= 0, "Unexpected closing brace '}' in styles.css");
  }
  assert.equal(depth, 0, "Unbalanced braces in styles.css");

  const requiredTokens = [
    "--ytd-masthead-height: 0px",
    "#masthead-container",
    "#comments",
    "#related",
    "ytd-shorts",
    ".ytp-ce-element",
    ".ytp-autonav-toggle-button-container",
    "#subscribe-button",
    "like-button-view-model",
    "#chat-container",
    "a[href*=\"/playables\"]",
    "a[href=\"/feed/subscriptions\"]",
    "#relax-yt-blocked-overlay"
  ];
  for (const token of requiredTokens) {
    assert.ok(css.includes(token), `styles.css missing required selector/rule: ${token}`);
  }
}

// 5. Validate content.js Trusted Types safety, syntax, and behavior
{
  const contentJs = readUtf8("extension/content.js");
  assert.ok(!contentJs.includes("innerHTML"), "content.js must never use innerHTML");
  assert.ok(!contentJs.includes("outerHTML"), "content.js must never use outerHTML");
  assert.ok(!contentJs.includes("insertAdjacentHTML"), "content.js must never use insertAdjacentHTML");

  execFileSync(process.execPath, ["--check", path.join(EXT_DIR, "content.js")], {
    stdio: "pipe"
  });

  const contentMod = require(path.join(EXT_DIR, "content.js"));
  const { getBlockedReason, disableAutoplay, enforceRoute, OVERLAY_ID, BLOCKED_ATTR } = contentMod;

  // Route blocking assertions
  const blockedRoutes = [
    "/",
    "",
    "/shorts",
    "/shorts/xyz",
    "/feed/subscriptions",
    "/feed/subscriptions/videos",
    "/feed/explore",
    "/feed/trending",
    "/playables",
    "/gaming"
  ];
  for (const route of blockedRoutes) {
    const reason = getBlockedReason(route);
    assert.ok(typeof reason === "string" && reason.length > 0, `Expected route to be blocked: ${route}`);
  }

  const allowedRoutes = ["/watch", "/watch?v=dQw4w9WgXcQ", "/live/abc", "/embed/abc", "/playlist"];
  for (const route of allowedRoutes) {
    assert.equal(getBlockedReason(route), null, `Expected route to be allowed: ${route}`);
  }

  // Mock DOM test for disableAutoplay
  {
    let checkedClicks = 0;
    let uncheckedClicks = 0;
    let cancelClicks = 0;

    const checkedBtn = {
      click() {
        checkedClicks += 1;
      }
    };
    const uncheckedBtn = {
      click() {
        uncheckedClicks += 1;
      }
    };
    const cancelBtn = {
      offsetParent: {},
      click() {
        cancelClicks += 1;
      }
    };

    const mockDoc = {
      querySelectorAll(selector) {
        if (selector === '.ytp-autonav-toggle-button[aria-checked="true"]') {
          return [checkedBtn];
        }
        if (selector === '.ytm-autonav-toggle-button[aria-pressed="true"]') {
          return [];
        }
        if (selector === ".ytp-autonav-endscreen-upnext-cancel-button") {
          return [cancelBtn];
        }
        if (selector === '.ytp-autonav-toggle-button[aria-checked="false"]') {
          return [uncheckedBtn];
        }
        return [];
      }
    };

    assert.equal(disableAutoplay(mockDoc, 1000), 2);
    assert.equal(checkedClicks, 1);
    assert.equal(cancelClicks, 1);
    assert.equal(uncheckedClicks, 0);

    // Immediate call within 800ms cooldown should do 0 clicks
    assert.equal(disableAutoplay(mockDoc, 1200), 0);
    assert.equal(checkedClicks, 1);
    assert.equal(cancelClicks, 1);

    // Call after 800ms cooldown should click again
    assert.equal(disableAutoplay(mockDoc, 2000), 2);
    assert.equal(checkedClicks, 2);
    assert.equal(cancelClicks, 2);
  }

  // Mock DOM test for enforceRoute
  {
    const rootEl = createMockElement("html");
    const bodyEl = createMockElement("body");
    const mockVideo = {
      paused: false,
      muted: false,
      pauseCalls: 0,
      pause() {
        this.paused = true;
        this.pauseCalls += 1;
      }
    };

    const mockDoc = {
      documentElement: rootEl,
      body: bodyEl,
      createElement: createMockElement,
      getElementById(id) {
        return findElementById(bodyEl, id);
      },
      querySelectorAll(selector) {
        if (selector === "video") return [mockVideo];
        return [];
      }
    };

    const resizeEvents = [];
    const mockWin = {
      location: { pathname: "/shorts/abc", href: "https://www.youtube.com/shorts/abc" },
      Event: class FakeEvent {
        constructor(type) {
          this.type = type;
        }
      },
      setTimeout(fn) {
        fn();
      },
      dispatchEvent(evt) {
        resizeEvents.push(evt.type);
      }
    };

    const blockedRes = enforceRoute(mockDoc, mockWin);
    assert.equal(blockedRes, "Shorts are locked");
    assert.equal(rootEl.getAttribute(BLOCKED_ATTR), "true");
    assert.equal(mockVideo.paused, true);
    assert.equal(mockVideo.muted, true);
    assert.equal(mockVideo.pauseCalls, 1);
    assert.ok(findElementById(bodyEl, OVERLAY_ID), "Overlay should be mounted on blocked route");

    // Navigate to allowed /watch route
    mockWin.location = { pathname: "/watch", href: "https://www.youtube.com/watch?v=123" };
    const watchRes = enforceRoute(mockDoc, mockWin);
    assert.equal(watchRes, null);
    assert.equal(rootEl.getAttribute(BLOCKED_ATTR), null);
    assert.equal(findElementById(bodyEl, OVERLAY_ID), null, "Overlay must be removed on /watch");
    assert.deepEqual(resizeEvents, ["resize"]);
  }
}

console.log("ALL VALIDATION CHECKS PASSED");
