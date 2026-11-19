# Relax YouTube

Kapatma tuşu ve değiştirilebilir ayarı olmayan, daima aktif **Microsoft Edge (Manifest V3)** YouTube odaklanma eklentisi ve resmi Edge kurumsal zorunlu kilit araçları.

> **English Summary:** Relax YouTube is an always-on Manifest V3 Microsoft Edge extension designed for distraction-free YouTube watching. It has no off-switch or user-editable settings page and is built to pair with official Windows Registry Edge policies (`ExtensionInstallForcelist`) so it cannot be casually disabled.

---

## Sabit Özellikler (Kapatılamaz)

- **Clean Mode:** İzleme sayfalarında (`/watch`) yalnızca video oynatıcıyı ortalanmış şekilde gösterir.
- **Ana Sayfa Gizli & Kilitli:** `/` rotasında akışı gizler ve odak ekranı gösterir.
- **Shorts Tamamen Engelli:** Shorts sekmesi, Shorts rafları, önerilenlerdeki Shorts videoları gizlenir ve `/shorts/*` sayfaları engellenir.
- **Üst Çubuk, Arama & Bildirimler Gizli:** YouTube üst çubuğu, arama kutusu ve bildirim simgesi gizlenir; `/` arama kısayolu engellenir.
- **Yorumlar & İlgili Videolar Gizli:** İzleme sayfasındaki tüm yan öneriler, yorumlar ve duraklatma önerileri kaldırılır.
- **Keşfet, Trendler, Abonelikler & Playables Engelli:** Sol menü ve ilgili akış sayfaları kapatılır.
- **Otomatik Oynatma (Autoplay) Kapalı:** Oynatıcıdaki autoplay anahtarı kapatılır ve sıradaki video sayacı iptal edilir.
- **Abone Ol, Beğeniler, Canlı Sohbet & Bitiş Kartları Gizli:** Video sonu kartları ve dikkat dağıtıcı etkileşim butonları gizlenir.
- **Sıfır Ayar & Sıfır Kapatma Tuşu:** Popup penceresi yalnızca aktif korumaları gösteren salt-okunur bir durum kartıdır.

*(Siyah-Beyaz Modu, Küçük Resimleri Gizle ve Küçük Resimleri Bulanıklaştır özellikleri kapalıdır.)*

---

## Proje Yapısı

```text
relax-youtube/
├── extension/              # Manifest V3 eklenti kaynak kodları
│   ├── manifest.json
│   ├── styles.css
│   ├── content.js
│   ├── popup.html
│   ├── popup.css
│   └── icons/
├── policy/                 # Resmi Edge zorunlu kilit (HKLM Policy) araçları
│   ├── apply-lock.ps1
│   ├── verify-lock.ps1
│   └── lock-extension.reg.template
├── scripts/
│   ├── generate-icons.py   # Eklenti ve mağaza ikon üretici (Python stdlib)
│   └── pack-for-store.ps1  # Edge Partner Center için zip paketleyici
├── store-assets/
│   ├── logo-300x300.png
│   └── STORE_LISTING.md
├── tests/
│   └── validate.mjs        # Otomatik doğrulama ve birim testleri (Node.js)
├── KURULUM.md              # Adım adım Türkçe kurulum ve kilit rehberi
├── PRIVACY.md              # Gizlilik politikası (Partner Center URL için)
└── LICENSE
```

---

## Hızlı Test & Doğrulama

1. **Yerel deneme (kilitsiz test):**
   - Edge'de `edge://extensions` adresini açın.
   - **Geliştirici Modu**'nu açın → **Paketten çıkarılmışı yükle** → `extension/` klasörünü seçin.
2. **Otomatik doğrulama testleri:**
   ```powershell
   node tests/validate.mjs
   ```
3. **Mağaza `.zip` paketini yeniden oluşturma:**
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/pack-for-store.ps1
   ```

Tam **GitHub + Ücretsiz Hidden Edge Add-ons Store + Zorunlu Registry Kilidi** adımları için [KURULUM.md](KURULUM.md) dosyasına bakın.
