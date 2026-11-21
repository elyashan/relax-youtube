# Kurulum ve Zorunlu Kilit Rehberi (Relax YouTube)

Bu rehber, **Relax YouTube** eklentisini yerel olarak test etmenizi, GitHub'a yüklemenizi, Microsoft Edge Add-ons Store üzerinden **ücretsiz ve gizli (Hidden)** olarak yayınlamanızı ve Windows Kayıt Defteri üzerinden **elle kapatılamaz zorunlu kilit** altına almanızı adım adım anlatır.

---

## Bölüm 1: Yerel Test (Önizleme)

Zorunlu kilidi uygulamadan önce eklentinin YouTube üzerindeki davranışını hemen test edebilirsiniz:

1. Microsoft Edge'de adres çubuğuna `edge://extensions` yazıp açın.
2. Sol alttan **Geliştirici Modu (Developer mode)** anahtarını açın.
3. **Paketten çıkarılmışı yükle (Load unpacked)** butonuna tıklayın ve proje içindeki `extension` klasörünü seçin.
4. `https://www.youtube.com/` adresine gidin: Ana sayfanın kilitlendiğini görmelisiniz.
5. Doğrudan bir video linkine (`https://www.youtube.com/watch?v=...`) gidin: Yalnızca video oynatıcının kaldığını, arama çubuğu/yorumlar/öneriler/Shorts/bitiş kartlarının gizlendiğini ve autoplay'in kapandığını doğrulayın.
6. Test bitince mağaza sürümünü kilitlemeden önce bu geçici geliştirici sürümünü kaldırabilirsiniz.

---

## Bölüm 2: GitHub'a Yükleme ve Gizlilik Politikası Linkini Alma

Microsoft Partner Center mağaza başvurusunda bir **Privacy Policy URL** ister. Bunun için projedeki `PRIVACY.md` dosyasını kullanacağız:

1. GitHub'da oturum açıp yeni bir depo (örneğin `relax-youtube`, Public olması gerekir ki Microsoft inceleme ekibi `PRIVACY.md` linkini okuyabilsin) oluşturun. **README/License eklemeden** boş oluşturun.
2. Bu klasörde terminal açıp kendi repo adresinizle push yapın:
   ```powershell
   git remote add origin https://github.com/elyashan/relax-youtube.git
   git push -u origin main
   ```
3. Push sonrası tarayıcıdan şu linkin açıldığını kontrol edin:
   ```text
   https://github.com/elyashan/relax-youtube/blob/main/PRIVACY.md
   ```
   Bu URL'yi mağaza formunda **Privacy policy URL** alanına yapıştıracaksınız.

---

## Bölüm 3: Microsoft Edge Add-ons Store'da Ücretsiz & Hidden Yayınlama

> **Neden mağaza gerekiyor?** Kişisel (Active Directory domain'ine bağlı olmayan) Windows bilgisayarlarda Microsoft Edge, güvenlik nedeniyle yalnızca resmi Edge Add-ons Store'dan gelen eklentilerin `ExtensionInstallForcelist` ile zorunlu kilitlenmesine izin verir. Microsoft geliştirici hesabı **ücretsizdir** ve **Hidden (Liste Dışı)** yayınladığınızda eklenti mağaza aramalarında çıkmaz.

1. `https://partner.microsoft.com/dashboard/microsoftedge/overview` adresine gidip kişisel Microsoft hesabınızla ücretsiz geliştirici kaydını tamamlayın.
2. **Create new extension** (Yeni uzantı oluştur) butonuna tıklayın.
3. Paket olarak proje içindeki hazır dosyayı yükleyin:
   - `dist/relax-youtube-store.zip` *(Yeniden üretmek gerekirse: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/pack-for-store.ps1`)*
4. **Availability (Kullanılabilirlik)** sekmesinde **Visibility (Görünürlük)** ayarını **`Hidden`** olarak seçin.
5. **Properties & Store Listing** alanları için `store-assets/STORE_LISTING.md` içindeki hazır metinleri yapıştırın ve logo olarak `store-assets/logo-300x300.png` yükleyin.
6. **Privacy Policy URL** alanına Bölüm 2'deki GitHub `PRIVACY.md` bağlantısını yapıştırın ve veri toplamadığınızı (`No`) işaretleyin.
7. Gönderin (**Submit**). Onay genellikle birkaç gün içinde gelir.
8. Onaylandıktan sonra Partner Center'da eklentinin genel bakış sayfasından veya doğrudan mağaza linkinden **32 karakterlik Extension ID**'yi (`a`–`p` harflerinden oluşan kimlik, örn: `abcdefghijklmnopqrstuvwxyzabcdef`) kopyalayın.

---

## Bölüm 4: Zorunlu Kilit Uygulama (Kapatılamaz Mod)

Eklenti mağazada onaylandıktan sonra yerel geliştirici sürümünü (`edge://extensions` üzerinden) kaldırın ve zorunlu kilidi uygulayın:

1. **PowerShell'i Yönetici (Run as Administrator)** olarak açın.
2. Proje klasörüne geçip aşağıdaki komutu kendi 32 karakterlik Extension ID'nizle çalıştırın:
   ```powershell
   cd c:\Users\elyas\Documents\code\relax-youtube
   .\policy\apply-lock.ps1 -ExtensionId "<32_KARAKTER_EXTENSION_ID>"
   ```
   *(Bu komut aynı zamanda InPrivate gizli pencere ve Misafir modunu da kapatır, böylece kilitten kaçılamaz. Eğer InPrivate veya Misafir modunu açık bırakmak isterseniz `-KeepInPrivate` veya `-KeepGuestMode` parametrelerini ekleyebilirsiniz.)*
3. **Microsoft Edge'i tamamen kapatıp yeniden açın** (gerekirse Görev Yöneticisinden çalışan `msedge.exe` işlemlerini sonlandırın).
4. Edge'de kontrol edin:
   - `edge://policy` sayfasını açıp **İlkeleri yeniden yükle (Reload policies)** butonuna basın → `ExtensionInstallForcelist`, `InPrivateModeAvailability`, `BrowserGuestModeEnabled` politikalarının göründüğünü doğrulayın.
   - `edge://extensions` sayfasında **Relax YouTube** eklentisinin otomatik yüklendiğini, kapatma/kaldırma tuşunun devre dışı olduğunu ve **"Kuruluşunuz tarafından yönetiliyor"** ibaresinin göründüğünü doğrulayın.
5. Terminalden kilit durumunu istediğiniz zaman salt-okunur doğrulamak için:
   ```powershell
   .\policy\verify-lock.ps1
   ```

> **Teknik Not:** Zorunlu kilit tamamen Microsoft Edge'in resmi `HKLM\SOFTWARE\Policies\Microsoft\Edge` kurumsal kayıt defteri politikasını kullanır; tarayıcı dosyalarını değiştirmez veya sistem güvenliğini atlatmaz.
