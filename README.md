# REHBER (prototip)

**Premise 01 Agency × Premise 02 Reciprocity** · NMED 3203 premise remix

Sana yolu gösteren birine güvenebilir misin? Her turda bir rehber sana bir kapı gösteriyor, ama her zaman doğruyu söylemiyor. Kapıyı her zaman sen seçiyorsun. Rehber senin kararlarını hatırlıyor ve bir sonraki turda seni nasıl yönlendireceğini değiştiriyor.

**Canlı link:** https://alibicakcioglu.github.io/premise-remix/

## Nasıl kullanılır

- Hareket: ok tuşları / WASD, ya da odada bir yere tıkla
- Kapıya git: `1` `2` `3` tuşları, kapıya tıklamak ya da alttaki "Kapı" butonları
- Yeniden başla: `R`

## Premise'ler kodda nerede

- **Agency:** `script.js` → `choose()`. Kapıyı her zaman oyuncu seçer, rehber sadece önerir.
- **Reciprocity:** `script.js` → `adapt()`. Uyarsan rehber daha çok yalan söyler (`LIE_GROWTH_IF_OBEYED`). Yalanını yakalarsan yalanlarını daha iyi saklar (`TELL_DECAY_IF_CAUGHT`).
- **İpucu:** Yalan söylerken rehber gösterdiği kapının dibinde durmaz ve gözleri gerçek kapıya kayar (`guideStandSpot()`, `guideLookTarget()`, `TELL_STRENGTH`).
- Tüm sayılar `script.js` dosyasının en üstündeki `KNOBS` nesnesinde, tuşlar `INPUT_MAP` içinde, replikler `LINES` içinde.

## Kaynaklar ve krediler

- NMED 3203 Interactive Media Applications Lab: https://mertseven.com/ima/lab/
- Wardrip-Fruin, N., Mateas, M., Dow, S. & Sali, S. (2009). Agency Reconsidered.
- Dubberly, H., Haque, U. & Pangaro, P. (2009). What is interaction? Are there different types?

## AI notu

<!-- Kendi cümlelerinle düzenle. -->
- Claude (Anthropic) fikri küçültmek ve kodun ilk sürümünü yazmak için kullanıldı. ChatGPT ilk fikir geliştirme aşamasında kullanıldı.
- Reddettiğim / değiştirdiğim bir örnek: _[Kendi örneğini yaz.]_
