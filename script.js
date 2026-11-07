'use strict';

/* =========================================================
   TELGRAF · Feedback × Temporality
   ---------------------------------------------------------
   Premise 04 TEMPORALITY  → ORDER_DELAY: emirlerin geç ulaşması
                             (bkz. sendOrder)
   Premise 03 FEEDBACK     → REPORT_DELAY: haritanın eski olması
                             (bkz. getReport) ve keşfin
                             hız/doğruluk takası (bkz. scout)
   İkisi birbirine bağlı: bilgi ne kadar taze olursa o kadar
   şüpheli, ne kadar doğru olursa o kadar eski.
   ========================================================= */


/* ---------------------------------------------------------
   1) KNOBS · tüm kurallar ve sayılar burada.
      Canlı değişiklik için önce buraya bak.
      Ayarlar paneli de bu nesneyi değiştiriyor.
   --------------------------------------------------------- */
const DEFAULTS = Object.freeze({
  ORDER_DELAY: 3000,          // emrin cepheye ulaşma süresi (ms)        → Temporality
  REPORT_DELAY: 3000,         // haritanın ne kadar eski olduğu (ms)     → Feedback
  FAST_SCOUT_TIME: 1000,      // hızlı keşif kaç ms'de gelir
  FAST_SCOUT_ACCURACY: 0.5,   // hızlı keşif doğruluk olasılığı (0–1)
  DEEP_SCOUT_TIME: 5000,      // derin keşif kaç ms'de gelir
  DEEP_SCOUT_ACCURACY: 0.9,   // derin keşif doğruluk olasılığı (0–1)
  ENEMY_INTERVAL: 4000,       // düşman kaç ms'de bir saldırır
  ENEMY_RANDOMNESS: 0.3,      // düşmanın en zayıf yer yerine rastgele seçme olasılığı
  ATTACK_POWER: 25,           // bir saldırının götürdüğü kontrol (%)
  REINFORCE_POWER: 15,        // bir takviyenin kazandırdığı kontrol (%)
  START_CONTROL: 50,          // her sektörün başlangıç kontrolü (%)
  TELEGRAPH_LINES: 2,         // aynı anda yolda olabilecek emir sayısı
  ORDER_COOLDOWN: 0,          // iki emir arasında beklenmesi gereken süre (ms)
  ROUND_TIME: 60,             // tur süresi (saniye)
  SECTORS: 5                  // sektör sayısı (değişirse sayfayı yenile)
});

const KNOBS = { ...DEFAULTS };

/* Hangi tuş neyi kontrol ediyor. "Girişleri değiştir" isteği için burası. */
const INPUT_MAP = {
  sectors: ['1', '2', '3', '4', '5'],
  fastScout: 'q',
  deepScout: 'e',
  mode: 'm',
  restart: 'r',
  settings: 's'
};

/* Ayarlar panelinde hangi knob'lar kaydırıcı olarak görünsün */
const SETTINGS_UI = [
  { key: 'ORDER_DELAY',         label: 'Emir gecikmesi',          min: 0,    max: 10000, step: 250,  unit: 'ms' },
  { key: 'REPORT_DELAY',        label: 'Rapor gecikmesi',         min: 0,    max: 10000, step: 250,  unit: 'ms' },
  { key: 'FAST_SCOUT_TIME',     label: 'Hızlı keşif süresi',      min: 0,    max: 10000, step: 250,  unit: 'ms' },
  { key: 'FAST_SCOUT_ACCURACY', label: 'Hızlı keşif doğruluğu',   min: 0,    max: 1,     step: 0.05, unit: '%'  },
  { key: 'DEEP_SCOUT_TIME',     label: 'Derin keşif süresi',      min: 0,    max: 10000, step: 250,  unit: 'ms' },
  { key: 'DEEP_SCOUT_ACCURACY', label: 'Derin keşif doğruluğu',   min: 0,    max: 1,     step: 0.05, unit: '%'  },
  { key: 'ENEMY_INTERVAL',      label: 'Düşman saldırı aralığı',  min: 1000, max: 10000, step: 250,  unit: 'ms' },
  { key: 'TELEGRAPH_LINES',     label: 'Telgraf hattı (aynı anda emir)', min: 1, max: 5, step: 1,   unit: ''   },
  { key: 'ORDER_COOLDOWN',      label: 'Emirler arası bekleme',   min: 0,    max: 5000,  step: 250,  unit: 'ms' }
];

const TICK_MS = 100;          // oyun döngüsü sıklığı
const HISTORY_KEEP_MS = 12000; // geçmiş anlık görüntüleri ne kadar saklansın (max gecikme + pay)


/* ---------------------------------------------------------
   2) DURUM
   --------------------------------------------------------- */
let state;

function freshState() {
  return {
    phase: 'ready',               // 'ready' → 'running' → 'over'
    instant: state ? state.instant : false, // karşılaştırma modu turlar arası korunur
    startTime: 0,
    control: Array(KNOBS.SECTORS).fill(KNOBS.START_CONTROL), // GERÇEK durum
    history: [],                  // { t, control[] } · raporlar buradan okunur
    orders: [],                   // yoldaki emirler { sector, sentAt, arriveAt }
    lastOrderAt: -Infinity,
    nextAttackAt: 0,
    nextTarget: 0,                // düşmanın planladığı bir sonraki hedef
    scouts: { fast: null, deep: null }, // bekleyen keşifler
    intel: null,                  // son gelen keşif { sector, accuracy, gatheredAt, type }
    events: [],                   // kayıt { t, text, kind, delayed }
    lastShown: null               // vuruş animasyonu için son gösterilen değerler
  };
}

const now = () => performance.now();

/* Karşılaştırma modu: ANLIK modda tüm bekleme süreleri sıfır */
function wait(ms) {
  return state.instant ? 0 : ms;
}

function gameSeconds(t) {
  if (state.phase === 'ready') return 0;
  return Math.max(0, (t - state.startTime) / 1000);
}


/* ---------------------------------------------------------
   3) KURALLAR
   --------------------------------------------------------- */

/* TEMPORALITY · emir gönder: hemen değil, ORDER_DELAY sonra etki eder */
function sendOrder(sector) {
  if (state.phase === 'over') return;
  if (state.phase === 'ready') startRound();

  const t = now();
  if (state.orders.length >= KNOBS.TELEGRAPH_LINES) {
    notify(`Telgraf hattı meşgul: aynı anda en fazla ${KNOBS.TELEGRAPH_LINES} emir gönderebilirsin.`);
    return;
  }
  if (t - state.lastOrderAt < KNOBS.ORDER_COOLDOWN) {
    const left = (KNOBS.ORDER_COOLDOWN - (t - state.lastOrderAt)) / 1000;
    notify(`Telgrafçı hazır değil: ${left.toFixed(1)} sn bekle.`);
    return;
  }

  const delay = wait(KNOBS.ORDER_DELAY);
  state.orders.push({ sector, sentAt: t, arriveAt: t + delay });
  state.lastOrderAt = t;
  logEvent(`→ S${sector + 1}'e takviye emri (varış ${(delay / 1000).toFixed(1)} sn)`, 'sent', false);
}

function arriveOrder(order) {
  const c = state.control;
  c[order.sector] = Math.min(100, c[order.sector] + KNOBS.REINFORCE_POWER);
  // Varış bilgisi de cepheden gelir, yani o da gecikmeli raporlanır
  logEvent(`S${order.sector + 1}: takviye ulaştı (+${KNOBS.REINFORCE_POWER})`, 'arrive', true);
}

/* Düşman botu: çoğunlukla en zayıf sektöre, bazen rastgele bir sektöre saldırır */
function planNextTarget() {
  const c = state.control;
  if (Math.random() < KNOBS.ENEMY_RANDOMNESS) {
    state.nextTarget = Math.floor(Math.random() * c.length);
    return;
  }
  let best = -1;
  for (let i = 0; i < c.length; i++) {
    if (c[i] <= 0) continue;                       // düşmüş sektöre tekrar saldırmaz
    if (best === -1 || c[i] < c[best]) best = i;
  }
  state.nextTarget = best === -1 ? 0 : best;
}

function enemyAttack() {
  const i = state.nextTarget;
  state.control[i] = Math.max(0, state.control[i] - KNOBS.ATTACK_POWER);
  logEvent(`S${i + 1}: düşman saldırısı (−${KNOBS.ATTACK_POWER})`, 'attack', true);
  planNextTarget();
}

/* FEEDBACK · keşif: hızlı ama şüpheli ya da yavaş ama doğru.
   Bilgi istendiği anda toplanır, geldiğinde eskimiş olabilir. */
function scout(type) {
  if (state.phase === 'over') return;
  if (state.phase === 'ready') startRound();
  if (state.scouts[type]) return; // aynı türden keşif zaten yolda

  const t = now();
  const time = type === 'fast' ? KNOBS.FAST_SCOUT_TIME : KNOBS.DEEP_SCOUT_TIME;
  const accuracy = type === 'fast' ? KNOBS.FAST_SCOUT_ACCURACY : KNOBS.DEEP_SCOUT_ACCURACY;

  state.scouts[type] = {
    type,
    gatheredAt: t,
    truth: state.nextTarget,      // istendiği andaki gerçek plan
    accuracy,
    arriveAt: t + wait(time)
  };
}

function deliverScout(s) {
  let sector = s.truth;
  if (Math.random() >= s.accuracy) {
    // Yanlış bilgi: gerçek hedef dışında rastgele bir sektör
    const others = [...Array(KNOBS.SECTORS).keys()].filter(i => i !== s.truth);
    sector = others[Math.floor(Math.random() * others.length)];
  }
  state.intel = { sector, accuracy: s.accuracy, gatheredAt: s.gatheredAt, type: s.type };
  state.scouts[s.type] = null;
}

/* FEEDBACK · oyuncunun gördüğü harita: REPORT_DELAY kadar önceki durum */
function getReport() {
  const h = state.history;
  if (h.length === 0) return state.control.slice();
  const target = now() - wait(KNOBS.REPORT_DELAY);
  let snap = h[0];
  for (const s of h) {
    if (s.t <= target) snap = s; else break;
  }
  return snap.control;
}


/* ---------------------------------------------------------
   4) OYUN DÖNGÜSÜ
   --------------------------------------------------------- */
function startRound() {
  state.phase = 'running';
  state.startTime = now();
  state.nextAttackAt = state.startTime + KNOBS.ENEMY_INTERVAL;
  state.history = [{ t: state.startTime, control: state.control.slice() }];
  planNextTarget();
}

function tick() {
  const t = now();

  if (state.phase === 'running') {
    // Varan emirler
    const arrived = state.orders.filter(o => o.arriveAt <= t);
    state.orders = state.orders.filter(o => o.arriveAt > t);
    arrived.forEach(arriveOrder);

    // Düşman
    if (t >= state.nextAttackAt) {
      enemyAttack();
      state.nextAttackAt = t + KNOBS.ENEMY_INTERVAL;
    }

    // Gelen keşifler
    for (const type of ['fast', 'deep']) {
      const s = state.scouts[type];
      if (s && s.arriveAt <= t) deliverScout(s);
    }

    // Gerçek durumun anlık görüntüsü (raporlar buradan gecikmeli okunur)
    state.history.push({ t, control: state.control.slice() });
    while (state.history.length > 1 && state.history[1].t < t - HISTORY_KEEP_MS) {
      state.history.shift();
    }

    // Tur sonu
    const allLost = state.control.every(v => v <= 0);
    if (gameSeconds(t) >= KNOBS.ROUND_TIME || allLost) endRound(allLost);
  }

  render();
}

function endRound(allLost) {
  state.phase = 'over';
  const report = getReport();
  const seen = report.filter(v => v > 0).length;
  const real = state.control.filter(v => v > 0).length;

  $('overTitle').textContent = allLost ? 'CEPHE ÇÖKTÜ' : 'TUR BİTTİ';
  $('overReport').textContent = `Son raporuna göre elinde ${seen} / ${KNOBS.SECTORS} sektör vardı.`;
  $('overTruth').textContent = `Gerçekte elinde kalan: ${real} / ${KNOBS.SECTORS} sektör.`;
  $('overNote').textContent = seen === real
    ? 'Rapor bu sefer doğru çıktı.'
    : 'Gördüğün harita ile gerçek cephe aynı değildi: aradaki fark, raporun gecikmesi.';
  $('overlay').hidden = false;
  $('overRestart').focus();
}

function restart() {
  state = freshState();
  $('overlay').hidden = true;
  $('scoutResult').textContent = 'Henüz keşif yok. Düşmanın bir sonraki hedefini öğrenmek için keşif yap.';
  notify('');
  render();
}


/* ---------------------------------------------------------
   5) ÇİZİM
   --------------------------------------------------------- */
const $ = id => document.getElementById(id);
const sectorEls = [];

function buildFront() {
  const front = $('front');
  front.innerHTML = '';
  for (let i = 0; i < KNOBS.SECTORS; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sector';
    b.innerHTML = `
      <span class="sector-name">S${i + 1} <span class="key">[${INPUT_MAP.sectors[i] || ''}]</span></span>
      <span class="bar" aria-hidden="true"><span class="fill-us"></span></span>
      <span class="pct">%50</span>
      <span class="status">TUTULUYOR</span>
      <span class="flight"></span>
      <span class="intel"></span>`;
    b.addEventListener('click', () => sendOrder(i));
    front.appendChild(b);
    sectorEls.push({
      root: b,
      fill: b.querySelector('.fill-us'),
      pct: b.querySelector('.pct'),
      status: b.querySelector('.status'),
      flight: b.querySelector('.flight'),
      intel: b.querySelector('.intel')
    });
  }
}

function render() {
  const t = now();
  const report = getReport();

  // Durum çubuğu
  const left = state.phase === 'ready' ? KNOBS.ROUND_TIME : Math.max(0, KNOBS.ROUND_TIME - gameSeconds(t));
  $('time').textContent = left.toFixed(1);
  $('mode').textContent = state.instant ? 'ANLIK' : 'TELGRAF';
  $('lines').textContent = `${state.orders.length} / ${KNOBS.TELEGRAPH_LINES}`;
  const rd = wait(KNOBS.REPORT_DELAY);
  $('reportAge').textContent = rd === 0 ? 'canlı' : `${(rd / 1000).toFixed(1)} sn eski`;
  $('reportAge').parentElement.classList.toggle('live', rd === 0);

  // Sektörler (RAPORA göre, gerçeğe göre değil)
  report.forEach((v, i) => {
    const el = sectorEls[i];
    if (!el) return;
    const lost = v <= 0;
    el.fill.style.height = `${v}%`;
    el.pct.textContent = `%${Math.round(v)}`;
    el.status.textContent = lost ? 'DÜŞTÜ' : 'TUTULUYOR';
    el.root.classList.toggle('lost', lost);

    // Raporda bir düşüş göründüğünde vuruş animasyonu
    if (state.lastShown && v < state.lastShown[i]) {
      el.root.classList.remove('hit');
      void el.root.offsetWidth; // animasyonu yeniden başlat
      el.root.classList.add('hit');
    }

    // Yoldaki takviyeler: kendi gönderdiğimiz için bunu hemen biliyoruz
    const mine = state.orders.filter(o => o.sector === i);
    el.flight.textContent = mine
      .map(o => `↑ takviye ${Math.max(0, (o.arriveAt - t) / 1000).toFixed(1)} sn`)
      .join('\n');

    // Keşif işareti
    const intel = state.intel;
    const targeted = intel && intel.sector === i;
    el.root.classList.toggle('targeted', !!targeted);
    el.intel.textContent = targeted
      ? `HEDEF? %${Math.round(intel.accuracy * 100)}\n${((t - intel.gatheredAt) / 1000).toFixed(1)} sn önceki bilgi`
      : '';

    el.root.setAttribute('aria-label',
      `Sektör ${i + 1}: raporda yüzde ${Math.round(v)}, ${lost ? 'düştü' : 'tutuluyor'}. Takviye göndermek için tıkla.`);
  });
  state.lastShown = report.slice();

  // Keşif butonları
  renderScoutButton('fast', $('fastScout'), $('fastInfo'), KNOBS.FAST_SCOUT_TIME, KNOBS.FAST_SCOUT_ACCURACY, t);
  renderScoutButton('deep', $('deepScout'), $('deepInfo'), KNOBS.DEEP_SCOUT_TIME, KNOBS.DEEP_SCOUT_ACCURACY, t);

  if (state.intel) {
    const i = state.intel;
    const age = ((t - i.gatheredAt) / 1000).toFixed(1);
    $('scoutResult').textContent =
      `${i.type === 'fast' ? 'HIZLI' : 'DERİN'} KEŞİF · Düşmanın muhtemel hedefi: S${i.sector + 1} · ` +
      `güven %${Math.round(i.accuracy * 100)} · bilgi ${age} sn önce toplandı.`;
  }

  // Kayıt: kendi emirlerimiz hemen, cepheden gelenler REPORT_DELAY sonra görünür
  const visibleBefore = t - rd;
  const visible = state.events.filter(e => !e.delayed || e.t <= visibleBefore).slice(-10).reverse();
  const html = visible.map(e =>
    `<li class="${e.kind}"><span class="t">[${gameSeconds(e.t).toFixed(1)}]</span>${e.text}</li>`).join('');
  if ($('log').innerHTML !== html) $('log').innerHTML = html;
}

function renderScoutButton(type, btn, info, time, accuracy, t) {
  const pending = state.scouts[type];
  btn.disabled = !!pending || state.phase === 'over';
  info.textContent = pending
    ? `geliyor… ${Math.max(0, (pending.arriveAt - t) / 1000).toFixed(1)} sn`
    : `${(wait(time) / 1000).toFixed(1)} sn · %${Math.round(accuracy * 100)} doğru`;
}

function logEvent(text, kind, delayed) {
  state.events.push({ t: now(), text, kind, delayed });
  if (state.events.length > 200) state.events.shift();
}

let noticeTimer = null;
function notify(msg) {
  $('notice').textContent = msg;
  clearTimeout(noticeTimer);
  if (msg) noticeTimer = setTimeout(() => { $('notice').textContent = ''; }, 2500);
}


/* ---------------------------------------------------------
   6) AYARLAR PANELİ · KNOBS'u canlı değiştirir
   --------------------------------------------------------- */
function formatValue(value, unit) {
  if (unit === 'ms') return `${(value / 1000).toFixed(2).replace(/0$/, '')} sn`;
  if (unit === '%') return `%${Math.round(value * 100)}`;
  return String(value);
}

function buildSettings() {
  const list = $('settingsList');
  list.innerHTML = '';
  SETTINGS_UI.forEach(s => {
    const id = `set-${s.key}`;
    const row = document.createElement('div');
    row.className = 'setting';
    row.innerHTML = `
      <label for="${id}"><span>${s.label}</span><output id="${id}-out"></output></label>
      <input type="range" id="${id}" min="${s.min}" max="${s.max}" step="${s.step}">`;
    list.appendChild(row);

    const input = row.querySelector('input');
    const out = row.querySelector('output');
    input.value = KNOBS[s.key];
    out.textContent = formatValue(KNOBS[s.key], s.unit);

    input.addEventListener('input', () => {
      KNOBS[s.key] = Number(input.value);
      out.textContent = formatValue(KNOBS[s.key], s.unit);
      render();
    });
  });
}

function toggleSettings(force) {
  const panel = $('settings');
  const open = typeof force === 'boolean' ? force : panel.hidden;
  panel.hidden = !open;
  $('settingsBtn').setAttribute('aria-expanded', String(open));
  if (open) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetSettings() {
  Object.assign(KNOBS, DEFAULTS);
  buildSettings();
  render();
}


/* ---------------------------------------------------------
   7) GİRİŞLER · fare/dokunma + klavye alternatifi
   --------------------------------------------------------- */
function toggleMode() {
  state.instant = !state.instant;
  notify(state.instant
    ? 'ANLIK mod: gecikme yok. Karşılaştır, sonra M ile Telgraf moduna dön.'
    : 'TELGRAF modu: emirler ve raporlar gecikmeli.');
}

$('fastScout').addEventListener('click', () => scout('fast'));
$('deepScout').addEventListener('click', () => scout('deep'));
$('modeBtn').addEventListener('click', toggleMode);
$('restartBtn').addEventListener('click', restart);
$('overRestart').addEventListener('click', restart);
$('settingsBtn').addEventListener('click', () => toggleSettings());
$('resetSettings').addEventListener('click', resetSettings);

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' && e.target.type !== 'range') return;

  const key = e.key.toLowerCase();
  const sectorIndex = INPUT_MAP.sectors.indexOf(key);

  if (sectorIndex !== -1 && sectorIndex < KNOBS.SECTORS) sendOrder(sectorIndex);
  else if (key === INPUT_MAP.fastScout) scout('fast');
  else if (key === INPUT_MAP.deepScout) scout('deep');
  else if (key === INPUT_MAP.mode) toggleMode();
  else if (key === INPUT_MAP.restart) restart();
  else if (key === INPUT_MAP.settings) toggleSettings();
  else return;
  e.preventDefault();
});


/* ---------------------------------------------------------
   8) BAŞLAT
   --------------------------------------------------------- */
state = freshState();
buildFront();
buildSettings();
render();
setInterval(tick, TICK_MS);
