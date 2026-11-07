'use strict';

/* =========================================================
   REHBER · Agency × Reciprocity
   ---------------------------------------------------------
   AGENCY      → Oyuncu rehbere uyabilir ya da karşı gelebilir.
                 Kapıyı her zaman oyuncu seçer.  (bkz. choose)
   RECIPROCITY → Rehber oyuncunun kararlarını hatırlar ve bir
                 sonraki turda yönlendirme biçimini değiştirir.
                 (bkz. adapt)
   ========================================================= */


/* ---------------------------------------------------------
   1) KNOBS · tüm kurallar ve sayılar burada
   --------------------------------------------------------- */
const KNOBS = {
  ROUNDS: 6,                  // kaç tur
  DOORS: 3,                   // kapı sayısı

  LIE_CHANCE: 0.35,           // rehberin başlangıçtaki yalan söyleme olasılığı
  LIE_GROWTH_IF_OBEYED: 0.15, // sen uydukça yalan olasılığı ne kadar artar
  LIE_DROP_IF_CAUGHT: 0.10,   // yalanı yakalanınca ne kadar azalır
  LIE_MAX: 0.9,

  TELL_STRENGTH: 1,           // yalan söylerken beden dilinin ne kadar belli olduğu (0 = hiç)
  TELL_DECAY_IF_CAUGHT: 0.25, // yakalandıkça yalanlarını ne kadar iyi saklar
  TELL_MIN: 0.25,

  GUIDE_SPEED: 140,           // rehberin yürüme hızı (piksel/sn)
  PLAYER_SPEED: 230,          // senin hızın (piksel/sn)
  GUIDE_WAIT: 700,            // tur başında rehberin yola çıkmadan beklediği süre (ms)
  PATIENCE: 4000,             // rehber kaç ms sonra sabırsızlanır
  RESULT_TIME: 2200           // tur sonucunun ekranda kalma süresi (ms)
};

/* Tuşlar. "Girişleri değiştir" isteği için burası. */
const INPUT_MAP = {
  up: ['arrowup', 'w'],
  down: ['arrowdown', 's'],
  left: ['arrowleft', 'a'],
  right: ['arrowright', 'd'],
  doors: ['1', '2', '3', '4', '5'],
  restart: 'r'
};

/* Rehberin replikleri */
const LINES = {
  intro: 'Buradan çıkmak istiyorsan benimle iyi geçinmelisin.',
  point: 'Bu kapı. Bana güven.',
  pointAfterCaught: 'Bu sefer gerçekten bu. Söz veriyorum.',
  pointAfterObeyStreak: 'Beni dinlemeye devam et. Bu kapı.',
  pointAfterWrongDistrust: 'Bir kez daha güvenmeyecek misin? Bu kapı.',
  impatient: 'Ne bekliyorsun? Zaman daralıyor.',
  obeyedTruth: 'Gördün mü? Birlikte iyiyiz.',
  obeyedLie: 'Hmm… kapılar yer değiştirmiş olmalı.',
  defiedLieRight: '…Fark ettin demek.',
  defiedLieWrong: 'Beni dinlemedin, ama doğruyu da bulamadın.',
  defiedTruth: 'Bana güvenmedin. Yazık.',
  ignoredRight: 'Beni beklemedin bile.',
  ignoredWrong: 'Acele ettin. Beni dinlemeliydin.'
};


/* ---------------------------------------------------------
   2) SAHNE
   --------------------------------------------------------- */
const canvas = document.getElementById('room');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const WALL_Y = 70;      // kapıların bulunduğu üst duvar
const DOOR_W = 76;

function doorX(i) {
  return (W * (i + 1)) / (KNOBS.DOORS + 1);
}


/* ---------------------------------------------------------
   3) DURUM
   --------------------------------------------------------- */
let game;

function newGame() {
  game = {
    round: 0,
    score: 0,
    lieChance: KNOBS.LIE_CHANCE,   // rehberin hafızasıyla değişir
    tell: KNOBS.TELL_STRENGTH,      // rehberin hafızasıyla değişir
    mem: { obeyed: 0, defied: 0, obeyStreak: 0, caught: 0, lies: 0, last: null },
    player: { x: W / 2, y: H - 60 },
    guide: { x: W / 2 + 60, y: H - 60, tx: W / 2 + 60, ty: H - 60, look: null },
    moveTarget: null,
    over: false
  };
  document.getElementById('end').hidden = true;
  startRound();
}

function startRound() {
  const r = {
    phase: 'enter',                 // enter → point → result
    startedAt: performance.now(),
    pointedAt: 0,
    truth: Math.floor(Math.random() * KNOBS.DOORS),
    lied: false,
    pointed: null,
    chosen: null,
    impatient: false,
    speech: game.round === 0 ? LINES.intro : '',
    resultAt: 0,
    resultText: ''
  };
  r.lied = Math.random() < game.lieChance;
  if (r.lied) {
    const others = [...Array(KNOBS.DOORS).keys()].filter(i => i !== r.truth);
    r.pointedDoor = others[Math.floor(Math.random() * others.length)];
  } else {
    r.pointedDoor = r.truth;
  }
  game.r = r;

  // Herkes odanın altına döner
  game.player.x = W / 2;
  game.player.y = H - 60;
  game.guide.x = W / 2 + 60;
  game.guide.y = H - 60;
  game.moveTarget = null;

  say(r.speech);
  updateHud();
}


/* ---------------------------------------------------------
   4) KURALLAR
   --------------------------------------------------------- */

/* Rehber nerede durur? Doğru söylüyorsa kapının dibinde.
   Yalan söylüyorsa gösterdiği kapıdan biraz uzakta ve gerçek
   kapıya doğru kaymış durur. TELL ne kadar büyükse o kadar belli. */
function guideStandSpot() {
  const r = game.r;
  const dx = doorX(r.pointedDoor);
  if (!r.lied) return { x: dx, y: WALL_Y + 55 };
  const dir = Math.sign(doorX(r.truth) - dx);
  return {
    x: dx + dir * game.tell * 45,
    y: WALL_Y + 55 + game.tell * 55
  };
}

/* Rehber nereye bakar? Yalan söylerken arada bir gerçek kapıya
   kaçamak bakış atar. TELL büyüdükçe bakış uzar. */
function guideLookTarget(t) {
  const r = game.r;
  const pointed = { x: doorX(r.pointedDoor), y: WALL_Y };
  if (r.phase !== 'point') return game.player;

  const cycle = (t - r.pointedAt) % 1700;
  if (r.lied && game.tell > 0) {
    const flick = Math.min(1000, 100 + game.tell * 400);
    return cycle < flick ? { x: doorX(r.truth), y: WALL_Y } : pointed;
  }
  return cycle < 1200 ? pointed : game.player; // dürüstken sana bakar
}

/* AGENCY · kapıyı her zaman oyuncu seçer */
function choose(door) {
  const r = game.r;
  if (r.phase === 'result' || game.over) return;

  r.chosen = door;
  r.phase = 'result';
  r.resultAt = performance.now();
  const correct = door === r.truth;
  if (correct) game.score++;

  r.resultText = adapt(r, correct);
  say(r.resultText + ' ' + (correct ? 'Doğru kapı.' : 'Yanlış kapı.') +
      ' Rehber bu turda ' + (r.lied ? 'yalan söyledi.' : 'doğruyu söyledi.'));
  updateHud();
}

/* RECIPROCITY · rehber oyuncunun kararını hatırlar ve değişir */
function adapt(r, correct) {
  const m = game.mem;
  if (r.lied) m.lies++;

  // Rehber henüz bir kapı göstermeden seçtiysen
  if (r.pointed === null) {
    m.last = 'ignored';
    return correct ? LINES.ignoredRight : LINES.ignoredWrong;
  }

  if (r.chosen === r.pointed) {
    // UYDUN → rehber sana güvenebileceğini öğrenir, daha çok yalan söyler
    m.obeyed++;
    m.obeyStreak++;
    m.last = 'obeyed';
    game.lieChance = Math.min(KNOBS.LIE_MAX, game.lieChance + KNOBS.LIE_GROWTH_IF_OBEYED);
    return r.lied ? LINES.obeyedLie : LINES.obeyedTruth;
  }

  // KARŞI GELDİN
  m.defied++;
  m.obeyStreak = 0;
  if (r.lied) {
    // Yalanı yakaladın → rehber daha dikkatli yalan söyler ama bir süre daha az yalan söyler
    m.caught++;
    m.last = 'caught';
    game.tell = Math.max(KNOBS.TELL_MIN, game.tell - KNOBS.TELL_DECAY_IF_CAUGHT);
    game.lieChance = Math.max(0.05, game.lieChance - KNOBS.LIE_DROP_IF_CAUGHT);
    return correct ? LINES.defiedLieRight : LINES.defiedLieWrong;
  }
  m.last = 'wrongDistrust';
  return LINES.defiedTruth;
}

function pointLine() {
  const m = game.mem;
  if (m.last === 'caught') return LINES.pointAfterCaught;
  if (m.obeyStreak >= 2) return LINES.pointAfterObeyStreak;
  if (m.last === 'wrongDistrust') return LINES.pointAfterWrongDistrust;
  return LINES.point;
}

function endGame() {
  game.over = true;
  const m = game.mem;
  let title, text;
  if (m.lies > 0 && m.caught >= Math.ceil(m.lies * 0.6)) {
    title = 'Rehberi çözdün';
    text = 'Yalanlarının çoğunu yakaladın. Rehber de bunu fark etti ve yalanlarını saklamaya başladı.';
  } else if (m.obeyed >= KNOBS.ROUNDS - 1) {
    title = 'Rehber seni yönetti';
    text = 'Neredeyse her seferinde onu dinledin. O da sana güvenip daha çok yalan söyledi.';
  } else {
    title = 'Kendi yolunu çizdin';
    text = 'Bazen dinledin, bazen dinlemedin. Rehber hangisini yapacağını kestiremedi.';
  }
  document.getElementById('endTitle').textContent = title;
  document.getElementById('endText').textContent = text;
  document.getElementById('endStats').textContent =
    `Doğru kapı: ${game.score} / ${KNOBS.ROUNDS} · Rehber ${m.lies} kez yalan söyledi, ` +
    `sen ${m.caught} tanesini yakaladın · Rehberin son yalan oranı: %${Math.round(game.lieChance * 100)} · ` +
    `Yalanlarının belli olma oranı: %${Math.round((game.tell / KNOBS.TELL_STRENGTH || 0) * 100)}`;
  document.getElementById('end').hidden = false;
  document.getElementById('endRestart').focus();
}


/* ---------------------------------------------------------
   5) DÖNGÜ
   --------------------------------------------------------- */
const keys = new Set();
let last = performance.now();

function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (!game.over) update(t, dt);
  draw(t);
  requestAnimationFrame(loop);
}

function update(t, dt) {
  const r = game.r;

  // Tur sonucu ekranda bekliyor
  if (r.phase === 'result') {
    if (t - r.resultAt > KNOBS.RESULT_TIME) {
      game.round++;
      if (game.round >= KNOBS.ROUNDS) endGame();
      else startRound();
    }
    return;
  }

  movePlayer(dt);

  // Rehber: önce bekler, sonra kapıya yürür, sonra gösterir
  const g = game.guide;
  if (r.phase === 'enter' && t - r.startedAt > KNOBS.GUIDE_WAIT) {
    const spot = guideStandSpot();
    g.tx = spot.x;
    g.ty = spot.y;
    if (stepTo(g, g.tx, g.ty, KNOBS.GUIDE_SPEED * dt)) {
      r.phase = 'point';
      r.pointed = r.pointedDoor;
      r.pointedAt = t;
      r.speech = pointLine();
      say(r.speech);
    }
  } else if (r.phase === 'point') {
    // Sabırsızlık: oyuncu karar vermezse yanına gelip ısrar eder
    if (!r.impatient && t - r.pointedAt > KNOBS.PATIENCE) {
      r.impatient = true;
      r.speech = LINES.impatient;
      say(r.speech);
    }
    if (r.impatient) {
      const p = game.player;
      const dist = Math.hypot(p.x - g.x, p.y - g.y);
      if (dist > 90) stepTo(g, p.x, p.y, KNOBS.GUIDE_SPEED * 0.8 * dt);
    }
  }

  // Oyuncu bir kapıya girdi mi?
  const p = game.player;
  if (p.y <= WALL_Y + 22) {
    for (let i = 0; i < KNOBS.DOORS; i++) {
      if (Math.abs(p.x - doorX(i)) < DOOR_W / 2) { choose(i); break; }
    }
  }
}

function movePlayer(dt) {
  const p = game.player;
  let vx = 0, vy = 0;
  if (anyKey(INPUT_MAP.left)) vx -= 1;
  if (anyKey(INPUT_MAP.right)) vx += 1;
  if (anyKey(INPUT_MAP.up)) vy -= 1;
  if (anyKey(INPUT_MAP.down)) vy += 1;

  if (vx || vy) {
    game.moveTarget = null;
    const len = Math.hypot(vx, vy);
    p.x += (vx / len) * KNOBS.PLAYER_SPEED * dt;
    p.y += (vy / len) * KNOBS.PLAYER_SPEED * dt;
  } else if (game.moveTarget) {
    if (stepTo(p, game.moveTarget.x, game.moveTarget.y, KNOBS.PLAYER_SPEED * dt)) game.moveTarget = null;
  }
  p.x = clamp(p.x, 20, W - 20);
  p.y = clamp(p.y, WALL_Y + 10, H - 20);
}

function stepTo(o, x, y, step) {
  const dx = x - o.x, dy = y - o.y;
  const d = Math.hypot(dx, dy);
  if (d <= step) { o.x = x; o.y = y; return true; }
  o.x += (dx / d) * step;
  o.y += (dy / d) * step;
  return false;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const anyKey = list => list.some(k => keys.has(k));


/* ---------------------------------------------------------
   6) ÇİZİM
   --------------------------------------------------------- */
function draw(t) {
  const r = game.r;
  ctx.clearRect(0, 0, W, H);

  // Duvar
  ctx.fillStyle = '#23262d';
  ctx.fillRect(0, 0, W, WALL_Y);

  // Kapılar
  for (let i = 0; i < KNOBS.DOORS; i++) {
    const x = doorX(i);
    const isExit = r.phase === 'result' && i === r.truth;
    ctx.fillStyle = isExit ? '#d8d8d8' : '#050505';
    ctx.fillRect(x - DOOR_W / 2, 8, DOOR_W, WALL_Y - 8);
    ctx.strokeStyle = r.phase === 'result' && i === r.chosen ? '#ffffff' : '#555';
    ctx.lineWidth = r.phase === 'result' && i === r.chosen ? 4 : 2;
    ctx.strokeRect(x - DOOR_W / 2, 8, DOOR_W, WALL_Y - 8);
    ctx.fillStyle = isExit ? '#000' : '#aaa';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x, 46);
    if (isExit) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('ÇIKIŞ', x, 62);
    }
  }

  drawGuide(t);
  drawPlayer();

  // Konuşma balonu
  const g = game.guide;
  const text = r.phase === 'result' ? r.resultText : r.speech;
  if (text) drawBubble(text, g.x, g.y + 34);   // balon rehberin altında, kolunu kapatmasın

  // Tur sonucu
  if (r.phase === 'result') {
    const correct = r.chosen === r.truth;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(correct ? '✓ DOĞRU KAPI' : '✗ YANLIŞ KAPI', W / 2, H - 40);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(r.lied ? 'Rehber bu turda yalan söyledi.' : 'Rehber bu turda doğruyu söyledi.', W / 2, H - 16);
  }
}

function drawPlayer() {
  const p = game.player;
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SEN', p.x, p.y + 4);
}

function drawGuide(t) {
  const g = game.guide;
  const r = game.r;

  // Gövde
  ctx.fillStyle = '#7a6a9a';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 24, 0, Math.PI * 2);
  ctx.fill();

  // İşaret eden kol
  if (r.phase === 'point' || (r.phase === 'result' && r.pointed !== null)) {
    const dx = doorX(r.pointedDoor) - g.x;
    const dy = WALL_Y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    ctx.strokeStyle = '#7a6a9a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(g.x + (dx / d) * 20, g.y + (dy / d) * 20);
    ctx.lineTo(g.x + (dx / d) * 50, g.y + (dy / d) * 50);
    ctx.stroke();
  }

  // Gözler: nereye baktığı ipucu
  const look = guideLookTarget(t);
  const lx = look.x - g.x, ly = look.y - g.y;
  const ld = Math.hypot(lx, ly) || 1;
  for (const side of [-1, 1]) {
    const ex = g.x + side * 9, ey = g.y - 5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex, ey, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(ex + (lx / ld) * 3.5, ey + (ly / ld) * 3.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBubble(text, x, y) {
  ctx.font = '15px system-ui, sans-serif';
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > 240 && line) { lines.push(line); line = w; }
    else line = test;
  }
  lines.push(line);

  const lh = 19;
  const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20;
  const bh = lines.length * lh + 12;
  const bx = clamp(x - bw / 2, 6, W - bw - 6);
  const by = clamp(y, WALL_Y + 4, H - bh - 6);

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#111';
  ctx.textAlign = 'left';
  lines.forEach((l, i) => ctx.fillText(l, bx + 10, by + 22 + i * lh - 4));
}


/* ---------------------------------------------------------
   7) GİRİŞLER · klavye, fare/dokunma ve kapı butonları
   --------------------------------------------------------- */
function say(text) {
  document.getElementById('speech').textContent = text;
}

function updateHud() {
  document.getElementById('round').textContent = `Tur ${Math.min(game.round + 1, KNOBS.ROUNDS)} / ${KNOBS.ROUNDS}`;
  document.getElementById('score').textContent = `Doğru kapı: ${game.score}`;
}

function walkToDoor(i) {
  if (i < 0 || i >= KNOBS.DOORS) return;
  game.moveTarget = { x: doorX(i), y: WALL_Y };
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === INPUT_MAP.restart) { newGame(); e.preventDefault(); return; }
  const d = INPUT_MAP.doors.indexOf(k);
  if (d !== -1) { walkToDoor(d); e.preventDefault(); return; }
  if ([...INPUT_MAP.up, ...INPUT_MAP.down, ...INPUT_MAP.left, ...INPUT_MAP.right].includes(k)) {
    keys.add(k);
    e.preventDefault();
  }
});
document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  const y = ((e.clientY - rect.top) / rect.height) * H;
  // Bir kapıya tıkladıysan oraya yürü
  for (let i = 0; i < KNOBS.DOORS; i++) {
    if (y < WALL_Y + 30 && Math.abs(x - doorX(i)) < DOOR_W / 2) { walkToDoor(i); return; }
  }
  game.moveTarget = { x, y };
});

document.querySelectorAll('[data-door]').forEach(b =>
  b.addEventListener('click', () => walkToDoor(Number(b.dataset.door))));
document.getElementById('restart').addEventListener('click', newGame);
document.getElementById('endRestart').addEventListener('click', newGame);


/* ---------------------------------------------------------
   8) BAŞLAT
   --------------------------------------------------------- */
newGame();
requestAnimationFrame(loop);
