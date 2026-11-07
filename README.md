# TELGRAF

**Premise 03 Feedback × Premise 04 Temporality** · NMED 3203 premise remix

Gecikmeli emirler ve gecikmeli raporlarla bir cepheyi 60 saniye tutmaya çalıştığın bir deneyim. Gördüğün harita her zaman birkaç saniye eski. Keşif yaparak düşmanın sıradaki hedefini öğrenebilirsin, ama hızlı keşif şüpheli, doğru keşif ise yavaş.

**Canlı link:** https://alibicakcioglu.github.io/premise-remix/

## Nasıl kullanılır

| Eylem | Fare / dokunma | Klavye |
|---|---|---|
| Sektöre takviye gönder | Sektöre tıkla | `1`–`5` |
| Hızlı keşif (1 sn, %50 doğru) | "Hızlı keşif" butonu | `Q` |
| Derin keşif (5 sn, %90 doğru) | "Derin keşif" butonu | `E` |
| Telgraf / Anlık mod karşılaştırması | "Mod" butonu | `M` |
| Ayarlar paneli (gecikmeler ve kurallar) | "Ayarlar" butonu | `S` |
| Yeniden başla | "Yeniden başla" butonu | `R` |

Tur ilk emirde ya da ilk keşifte başlar. Tur sonunda son raporun ile gerçek cephe karşılaştırılır.

## Premise'ler kodda nerede

- **Temporality:** `script.js` → `KNOBS.ORDER_DELAY` ve `sendOrder()`. Emirler cepheye geç ulaşır.
- **Feedback:** `script.js` → `KNOBS.REPORT_DELAY` ve `getReport()`. Harita gerçeğin gecikmeli bir kopyasıdır. Keşfin hız/doğruluk takası `scout()` ve `KNOBS.*_SCOUT_*` içindedir.
- Tüm sayılar `script.js` dosyasının en üstündeki `KNOBS` nesnesinde. Tuş atamaları `INPUT_MAP` içinde. Uygulama içindeki **Ayarlar** paneli aynı nesneyi canlı değiştirir.

## Dosyalar

- `index.html`: sayfa yapısı
- `style.css`: görünüm
- `script.js`: kurallar, oyun döngüsü, ayarlar paneli
- `RATIONALE.md`: 350 kelimelik tasarım gerekçesi

## Kaynaklar ve krediler

- NMED 3203 Interactive Media Applications Lab (Mert Seven) premise'leri ve ödev rehberi: https://mertseven.com/ima/lab/
- Jota, R., Ng, A., Dietz, P. & Wigdor, D. (2013). How Fast is Fast Enough? *CHI 2013*. https://doi.org/10.1145/2470654.2481317
- Hattie, J. & Timperley, H. (2007). The Power of Feedback. *Review of Educational Research*, 77(1). https://doi.org/10.3102/003465430298487
- Harici kütüphane, görsel ya da font kullanılmadı.

## AI notu

<!-- Bu bölümü kendi cümlelerinle düzenle. -->
- **Kullanılan araç:** Claude (Anthropic). Fikri geliştirmek, kapsamı daraltmak ve `index.html`, `style.css`, `script.js` dosyalarının ilk sürümünü yazmak için kullanıldı.
- **Reddettiğim / düzelttiğim bir örnek:** _[Kendi örneğini yaz. Örneğin: İlk fikrimde zar atma ve 6 kart çekme aşaması vardı. AI ile konuşurken bunun Temporality'yi bozduğunu, çünkü sıra tabanlı oyunda zamanın durduğunu fark ettim ve bu aşamayı çıkardım. Ya da test sırasında kendi değiştirdiğin bir şey.]_
- Kodun tamamını okudum ve her bölümünü açıklayabilirim.
