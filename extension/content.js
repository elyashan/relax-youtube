(() => {
  "use strict";

  const OVERLAY_ID = "relax-yt-blocked-overlay";
  const REASON_ID = "relax-yt-blocked-reason";
  const BLOCKED_ATTR = "data-relax-yt-blocked";
  const AUTOPLAY_COOLDOWN_MS = 800;

  const DISCOVERY_PREFIXES = [
    "/feed/explore",
    "/feed/trending",
    "/feed/channels",
    "/feed/news_destination",
    "/feed/sports",
    "/feed/storefront"
  ];

  const lastToggleAttempts = new WeakMap();
  const lastUnblockedHrefByDoc = new WeakMap();

  function normalizePathname(pathname) {
    if (typeof pathname !== "string" || pathname.length === 0) {
      return "/";
    }
    const clean = pathname.split("?")[0].split("#")[0];
    if (clean.length > 1 && clean.endsWith("/")) {
      return clean.slice(0, -1);
    }
    return clean || "/";
  }

  function matchesRoutePrefix(path, prefix) {
    return path === prefix || path.startsWith(prefix + "/");
  }

  function getBlockedReason(pathname) {
    const path = normalizePathname(pathname);

    if (path === "/") {
      return "Ana sayfa kilitli";
    }
    if (matchesRoutePrefix(path, "/shorts")) {
      return "Shorts kilitli";
    }
    if (matchesRoutePrefix(path, "/feed/subscriptions")) {
      return "Abonelikler kilitli";
    }
    for (let i = 0; i < DISCOVERY_PREFIXES.length; i += 1) {
      if (matchesRoutePrefix(path, DISCOVERY_PREFIXES[i])) {
        return "Keşfet ve Trendler kilitli";
      }
    }
    if (matchesRoutePrefix(path, "/playables") || matchesRoutePrefix(path, "/gaming")) {
      return "Playables / Oyunlar kilitli";
    }
    return null;
  }

  function pauseAllVideos(doc) {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return;
    }
    const videos = doc.querySelectorAll("video");
    for (let i = 0; i < videos.length; i += 1) {
      const video = videos[i];
      if (!video) {
        continue;
      }
      video.muted = true;
      if (typeof video.pause === "function" && !video.paused) {
        try {
          video.pause();
        } catch (_) {
          // Ignore media pause rejection in restricted contexts.
        }
      }
    }
  }

  function buildOverlay(doc, reason) {
    const overlay = doc.createElement("div");
    overlay.id = OVERLAY_ID;

    const card = doc.createElement("div");
    card.className = "relax-yt-card";

    const badge = doc.createElement("div");
    badge.className = "relax-yt-badge";
    badge.textContent = "Relax YouTube • Kilitli";

    const title = doc.createElement("h1");
    title.className = "relax-yt-title";
    title.textContent = "Odak Modu Aktif";

    const reasonEl = doc.createElement("p");
    reasonEl.id = REASON_ID;
    reasonEl.className = "relax-yt-reason";
    reasonEl.textContent = reason;

    const desc = doc.createElement("p");
    desc.className = "relax-yt-desc";
    desc.textContent =
      "Ana sayfa, Shorts, arama, abonelikler ve keşfet akışları kalıcı olarak kapalıdır. Yalnızca doğrudan video bağlantıları açılır.";

    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(reasonEl);
    card.appendChild(desc);
    overlay.appendChild(card);

    return overlay;
  }

  function mountOrUpdateOverlay(doc, reason) {
    if (!doc || !doc.body) {
      return;
    }
    const existing =
      typeof doc.getElementById === "function" ? doc.getElementById(OVERLAY_ID) : null;
    if (existing) {
      const reasonEl =
        typeof doc.getElementById === "function" ? doc.getElementById(REASON_ID) : null;
      if (reasonEl && reasonEl.textContent !== reason) {
        reasonEl.textContent = reason;
      }
      return;
    }
    const overlay = buildOverlay(doc, reason);
    doc.body.appendChild(overlay);
  }

  function removeOverlay(doc) {
    if (!doc || typeof doc.getElementById !== "function") {
      return;
    }
    const existing = doc.getElementById(OVERLAY_ID);
    if (existing && typeof existing.remove === "function") {
      existing.remove();
    } else if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function disableAutoplay(doc, now = Date.now()) {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return 0;
    }

    let actions = 0;
    const toggleSelectors = [
      '.ytp-autonav-toggle-button[aria-checked="true"]',
      '.ytm-autonav-toggle-button[aria-pressed="true"]'
    ];

    for (let s = 0; s < toggleSelectors.length; s += 1) {
      const buttons = doc.querySelectorAll(toggleSelectors[s]);
      for (let i = 0; i < buttons.length; i += 1) {
        const btn = buttons[i];
        if (!btn || typeof btn.click !== "function") {
          continue;
        }
        const prevAttempt = lastToggleAttempts.get(btn);
        if (typeof prevAttempt === "number" && now - prevAttempt < AUTOPLAY_COOLDOWN_MS) {
          continue;
        }
        lastToggleAttempts.set(btn, now);
        btn.click();
        actions += 1;
      }
    }

    const cancelButtons = doc.querySelectorAll(".ytp-autonav-endscreen-upnext-cancel-button");
    for (let i = 0; i < cancelButtons.length; i += 1) {
      const cancelBtn = cancelButtons[i];
      if (!cancelBtn || typeof cancelBtn.click !== "function") {
        continue;
      }
      if (cancelBtn.offsetParent === null) {
        continue;
      }
      const prevAttempt = lastToggleAttempts.get(cancelBtn);
      if (typeof prevAttempt === "number" && now - prevAttempt < AUTOPLAY_COOLDOWN_MS) {
        continue;
      }
      lastToggleAttempts.set(cancelBtn, now);
      cancelBtn.click();
      actions += 1;
    }

    return actions;
  }

  function schedulePlayerResize(doc, win) {
    if (!win || !win.location) {
      return;
    }
    const href = win.location.href || win.location.pathname || "";
    if (lastUnblockedHrefByDoc.get(doc) === href) {
      return;
    }
    lastUnblockedHrefByDoc.set(doc, href);

    if (typeof win.dispatchEvent !== "function" || typeof win.Event !== "function") {
      return;
    }
    const trigger = () => {
      try {
        win.dispatchEvent(new win.Event("resize"));
      } catch (_) {
        // Ignore synthetic resize issues.
      }
    };
    if (typeof win.setTimeout === "function") {
      win.setTimeout(trigger, 100);
    } else {
      trigger();
    }
  }

  function enforceRoute(doc, win) {
    if (!doc || !win || !win.location) {
      return null;
    }

    const reason = getBlockedReason(win.location.pathname);
    const root = doc.documentElement;

    if (reason) {
      lastUnblockedHrefByDoc.delete(doc);
      if (root && typeof root.setAttribute === "function") {
        root.setAttribute(BLOCKED_ATTR, "true");
      }
      pauseAllVideos(doc);
      mountOrUpdateOverlay(doc, reason);
      return reason;
    }

    if (root && typeof root.removeAttribute === "function") {
      root.removeAttribute(BLOCKED_ATTR);
    }
    removeOverlay(doc);
    disableAutoplay(doc);
    schedulePlayerResize(doc, win);
    return null;
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    const tag = typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const run = () => enforceRoute(document, window);

    run();

    document.addEventListener("DOMContentLoaded", run, { passive: true });
    window.addEventListener("yt-navigate-start", run, true);
    window.addEventListener("yt-navigate-finish", run, true);
    window.addEventListener("yt-page-data-updated", run, true);
    window.addEventListener("popstate", run, true);
    window.addEventListener("hashchange", run, true);

    document.addEventListener(
      "play",
      (event) => {
        if (!getBlockedReason(window.location.pathname)) {
          return;
        }
        const target = event && event.target;
        if (target && typeof target.pause === "function") {
          target.muted = true;
          try {
            target.pause();
          } catch (_) {
            // Ignore pause error.
          }
        }
        pauseAllVideos(document);
      },
      true
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          event.key === "/" &&
          !isEditableTarget(event.target)
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true
    );

    if (typeof MutationObserver === "function" && document.documentElement) {
      let scheduled = false;
      const observer = new MutationObserver(() => {
        if (scheduled) {
          return;
        }
        scheduled = true;
        const flush = () => {
          scheduled = false;
          run();
        };
        if (typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(flush);
        } else {
          window.setTimeout(flush, 200);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    if (typeof window.setInterval === "function") {
      window.setInterval(run, 1000);
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      OVERLAY_ID,
      BLOCKED_ATTR,
      AUTOPLAY_COOLDOWN_MS,
      getBlockedReason,
      disableAutoplay,
      enforceRoute
    };
  }
})();
