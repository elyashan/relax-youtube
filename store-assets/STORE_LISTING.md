# Microsoft Edge Add-ons Store — Yayınlama Bilgileri

Bu dosya, **Relax YouTube** eklentisini Microsoft Partner Center üzerinden **ücretsiz** ve **Hidden (Liste Dışı)** olarak yüklerken form alanlarına doğrudan kopyalayıp yapıştırabilmen için hazırlanmıştır.

---

## Yüklenecek Dosyalar

- **Eklenti Paketi (`.zip`):** `dist/relax-youtube-store.zip`
- **Mağaza Logosu (300x300 PNG):** `store-assets/logo-300x300.png`
- **Gizlilik Politikası URL'si:** `https://github.com/elyashan/relax-youtube/blob/main/PRIVACY.md`

---

## Partner Center Form Alanları

- **Extension Name:** `Relax YouTube`
- **Visibility (Görünürlük):** `Hidden` *(Aramalarda görünmez, yalnızca doğrudan mağaza linki ve Edge Policy ile yüklenir)*
- **Category (Kategori):** `Productivity`
- **Primary Language:** `English` (veya Türkçe açıklamayla birlikte ikisi de kabul edilir; aşağıda ikisi de var)

### Short Description (EN — Mağaza İncelemesi İçin Önerilen)
> Always-on distraction-free YouTube player. Hides feeds, Shorts, comments, recommendations, search bar, and autoplay.

### Short Description (TR)
> Daima açık, dikkat dağıtıcıları gizleyen YouTube oynatıcı. Ana sayfa, Shorts, yorumlar, öneriler ve aramayı kapatır.

### Detailed Description (EN)
```text
Relax YouTube transforms YouTube into a calm, focused video player with zero off-switch or distracting settings.

Built specifically for people who want permanent focus without the temptation to toggle filters off:
- Clean Mode: Shows only the video player on watch pages.
- Hides Home Page, Explore, Trending, Subscriptions, and Playables feeds.
- Hides Shorts tab, Shorts shelves, Shorts in related videos, and blocks /shorts/ pages.
- Hides Top Header Bar, Search Bar, and Notifications.
- Hides Comments, Related Videos, Subscribe button, Likes, Live Chat, and End Screen cards.
- Permanently disables Autoplay.
- Collects zero user data, makes zero network requests, and stores nothing.
```

### Detailed Description (TR)
```text
Relax YouTube, kapatma tuşu veya değiştirilebilir ayarı olmayan, daima aktif bir YouTube odaklanma eklentisidir.

Özellikler:
- Clean Mode: Video izleme sayfasında yalnızca oynatıcıyı gösterir.
- Ana Sayfa, Keşfet, Trendler, Abonelikler ve Playables akışlarını gizler ve engeller.
- Shorts sekmesini, tüm Shorts videolarını ve /shorts/ sayfalarını engeller.
- Üst çubuğu, arama çubuğunu ve bildirimleri gizler.
- Yorumları, ilgili videoları, Abone Ol butonunu, beğenileri, canlı sohbeti ve video sonu kartlarını gizler.
- Otomatik oynatmayı (Autoplay) kapatır.
- Hiçbir kullanıcı verisi toplamaz, saklamaz veya paylaşmaz.
```

---

## Privacy & Certification Notes (İnceleme Notu)

- **Collects personal or browsing data?** `No`
- **Certification Notes (İnceleme ekibine kısa not):**
```text
This extension has no off-switch or user-configurable options page by design, as it is intended for permanent distraction blocking (often paired with Edge enterprise force-install policies). It uses only content_scripts on youtube.com, requests zero extra permissions, and collects no user data.
```
