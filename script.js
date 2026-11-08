// THE GUIDE · Agency × Reciprocity
// Remix of IMA Lab experiment 02 · Eye Field (engine, shell and character system by the lab).
// Bir kurt, kuzuyu (seni) ormandan çıkarmaya söz veriyor. Kapıyı hep sen seçersin (Agency);
// kurt her hareketini bir cevap olarak okur ve bir sonraki odada ona göre davranır (Reciprocity).
// Girdi: tıkla / ok tuşları / 1-6 · Kural: ruh hali → yalan olasılığı · Durum: mood, defter · Çıktı: işaret, yalan
window.OYUNLAR = window.OYUNLAR || {};

/* ---- Kurt ve kuzu: lab motorunun parçalarıyla yazılmış yeni karakter tarifleri ---- */
window.KUTUPHANE = window.KUTUPHANE || {};
window.KUTUPHANE.karakterler = window.KUTUPHANE.karakterler || [];
window.KUTUPHANE.karakterler.push(
  { id: 'char.wolf', version: 1, kind: 'character', name: 'Wolf', role: 'the guide · has its own gate', place: '02', tags: ['hayvan'],
    parts: { body: { shape: 'hourglass', paint: { pattern: 'fur', colors: ['gray', 'ink'] } }, neck: { height: 0.05, paint: { color: 'paper' } },
             head: { shape: 'drop', paint: { color: 'gray' } }, ears: { shape: 'cat', paint: { color: 'ink' } },
             face: { eyes: 'ring', mask: 'paper', brows: true, nose: true, mouth: false },
             extras: [{ type: 'tail', paint: { color: 'ink' } }] },
    motion: { personality: 'jittery' } },
  { id: 'char.lamb', version: 1, kind: 'character', name: 'Lamb', role: 'player · you, carrying the lantern', place: '02', tags: ['oyuncu'],
    parts: { body: { shape: 'pear', paint: { pattern: 'dots', colors: ['paper', 'gray'] } }, neck: { height: 0.04, paint: { color: 'paper' } },
             head: { shape: 'ball', paint: { pattern: 'dots', colors: ['paper', 'gray'] } }, ears: { shape: 'round', paint: { color: 'paper' } },
             face: { eyes: 'dot', cheeks: true, nose: true },
             arms: { type: 'pegs', paint: { color: 'paper' } } },
    motion: { personality: 'bouncy' } }
);

/* Renkler: lab motorunun C paletini sahne kurulmadan önce ormana göre ayarla (deniz yeşili + koyu gri) */
if (typeof window.createLook === 'function' && !window.createLook.guidePatched) {
  const baseLook = window.createLook;
  window.createLook = function (...args) {
    const L = baseLook.apply(this, args);
    const set = (k, hex) => { const row = L.PALS.c.list.find((x) => x[0] === k); if (row) row[1] = hex; };
    set('green', '#5e9a85');   // orman ve zemin
    set('gray', '#6c7280');    // kurdun kürkü
    return L;
  };
  window.createLook.guidePatched = true;
}

/* Kurdun replikleri: dili değiştirmek için yalnız burayı düzenle */
const LINES = {
  intro: 'Little lamb. Want out? Stay on my good side.',
  point: 'This one. Trust me.',
  pointConfident: 'This one, as always.',
  pointAshamed: '…Fine. This one. No tricks.',
  impatient: 'Come on, lamb. The night is long.',
  watchWant: 'Good. That’s the one.',
  blockTruth: 'Not that one! Waste of time.',
  obeyedTruth: 'See? We make a good team.',
  obeyedLie: 'Hm. The gates must have moved.',
  caught: '…So you noticed.',
  defiedTruth: 'You didn’t trust me. Your loss.'
};

const MOOD_TR = { calm: 'sakin', confident: 'kendinden emin', ashamed: 'utanmış' };

window.OYUNLAR['02'] = {
  key: '02', title: 'The Guide', premise: 'Agency × Reciprocity', sub: 'premise 01 × 02 · agency × reciprocity',
  premiseText: 'Your actions change the system, and every action expects a response.',
  promise: 'Participation can be designed. Design the dialogue, not the message.',
  source: 'IMA Lab experiment 02 · Eye Field (engine and character system)',
  caption: 'The wolf says it knows the way out.',
  hint: 'click = walk · stand still at a gate = listen for the exit · walk through a gate = choose · arrows / WASD = walk · 1–6 = go to gate · C = code',
  anat: ['walk · listen · choose', 'reply → mood', 'mood · log', 'points · lies'], hot: 2,
  hud: [['GATES', 'hGate'], ['LIGHT', 'hLight'], ['WOLF', 'hMood', 'ghosts'], ['CAUGHT', 'hCaught']],
  design: {
    wolfGate: 'random', doors: 3, toEscape: 5, lights: 4,
    lieCalm: 0.5, lieConfident: 0.75, lieAshamed: 0,
    tell: 1, inspectTime: 1000, patience: 6000,
    walkSpeed: 1.1, wolfSpeed: 1.8
  },
  knobs: [
    { key: 'wolfGate', type: 'choice', options: ['random', '☾', '✶', '◆', '▲', '●', '■'], note: 'new game',
      tr: 'Kurdun kendi kapısı (🐺). random = her oyunda yeni simge. Yeni oyunda geçerli (RESTART).' },
    { key: 'doors', step: 1, min: 2, max: 6, note: 'new game',
      tr: 'Her odadaki kapı sayısı (2–6). Yeni oyunda geçerli (RESTART).' },
    { key: 'toEscape', step: 1, min: 1, max: 9, note: 'live',
      tr: 'Ormandan çıkmak için geçmen gereken doğru kapı sayısı.' },
    { key: 'lights', step: 1, min: 1, max: 9, note: 'new game',
      tr: 'Fener hakkı: kaç yanlış kapıda oyun biter. Yeni oyunda geçerli.' },
    { key: 'lieCalm', step: 0.05, min: 0, max: 1, note: 'live',
      tr: 'sakin (calm): başta ve ona güvenmediğinde yalan olasılığı. 0 = hiç, 1 = her fırsatta. Yalnız kendi kapısı çıkış değilken yalan söyleyebilir.' },
    { key: 'lieConfident', step: 0.05, min: 0, max: 1, note: 'live',
      tr: 'kendinden emin (confident): onu takip ettikten sonra yalan olasılığı. Güvenirsen seni kullanır.' },
    { key: 'lieAshamed', step: 0.05, min: 0, max: 1, note: 'live',
      tr: 'utanmış (ashamed): yalanını yakaladıktan sonraki oda. 0 = yalan söylemeye cesaret edemez.' },
    { key: 'tell', step: 0.25, min: 0, max: 2, note: 'live',
      tr: 'Yalan söylerken beden dilinin ne kadar belli olduğu (duruşu, bakışı). 0 = hiç ipucu yok.' },
    { key: 'inspectTime', step: 250, min: 250, max: 6000, note: 'ms · live',
      tr: 'Bir kapıyı incelemek için önünde durman gereken süre (milisaniye).' },
    { key: 'patience', step: 500, min: 1000, max: 20000, note: 'ms · live',
      tr: 'Kurdun sabırsızlanıp sana yaklaşmadan önce beklediği süre (milisaniye).' },
    { key: 'walkSpeed', step: 0.1, min: 0.3, max: 3, note: 'live',
      tr: 'Kuzunun (senin) yürüme hızın.' },
    { key: 'wolfSpeed', step: 0.1, min: 0.3, max: 4, note: 'live',
      tr: 'Kurdun yürüme hızı.' }],
  code: [
    '<span class="c">// 3) RULE: the wolf reads every move as a reply</span>',
    '<span class="k">if</span> (obeyed) mood = <span class="s">\'confident\'</span>; <span class="c">// güvenirsen seni kullanır</span>',
    '<span class="k">else if</span> (lied) mood = <span class="s">\'ashamed\'</span>; <span class="c">// yalanını yakalarsan yalana cesaret edemez</span>',
    '<span class="k">else</span> mood = <span class="s">\'calm\'</span>;  <span class="c">// doğruya güvenmezsen sakinleşir</span>',
    'lie = wolfGate != exit &amp;&amp; random() &lt; DESIGN[<span class="s">\'lie\'</span> + mood];'],
  tasks: [
    'Set <b>tell</b> to 0. Can you still read the wolf?',
    'Set <b>lieAshamed</b> to 1. What happens to the relationship when catching it changes nothing?'],
  question: 'When did a system you trusted steer you toward what it wanted?',
  overlay: { title: 'The Guide', text: 'Night in the forest. A wolf offers to lead you, a lamb, out. It knows the exit, but it has its own gate (🐺) and wants you to open it. When it points there: is that the way out, or just what it wants? Stand at a gate to listen for the exit. Walk through a gate to choose.', cta: 'CLICK TO ENTER' },
  view: { at: [0, 0.35, -0.3], zoom: 2.8, pitch: 1.08 },

  make(ctx) {
    const { THREE, D, group } = ctx;
    const Y = 0.08, R = 2.05;                       // zemin yüksekliği, yürünebilir yarıçap
    const SYMBOLS = ['☾', '✶', '◆', '▲', '●', '■'];   // kurdun kapısı her oyunun başında DESIGN.wolfGate'e göre seçilir
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const V = (x, z, y = Y) => new THREE.Vector3(x, y, z);

    // ---- orman: açıklığın çevresinde çamlar, yuvarlak ağaçlar ve eğrelti otları ----
    (function buildForest() {
      let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const pine = (x, z, s) => {
        const t = new THREE.Group(); t.position.set(x, Y, z); t.scale.setScalar(s); t.rotation.y = rnd() * 6;
        t.add(ctx.mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.34, 6), ctx.toon('wood'), 0, 0.17, 0));
        [[0.36, 0.72, 0.22], [0.29, 0.64, 0.62], [0.2, 0.56, 1.0]].forEach(([rr, h, y]) =>
          t.add(ctx.mesh(new THREE.ConeGeometry(rr, h, 8), ctx.toon('green'), 0, y + h / 2, 0)));
        group.add(t);
      };
      const round = (x, z, s) => {
        const t = new THREE.Group(); t.position.set(x, Y, z); t.scale.setScalar(s); t.rotation.y = rnd() * 6;
        t.add(ctx.mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.55, 6), ctx.toon('wood'), 0, 0.27, 0));
        t.add(ctx.mesh(new THREE.IcosahedronGeometry(0.36, 1), ctx.toon('green'), 0, 0.78, 0));
        t.add(ctx.mesh(new THREE.IcosahedronGeometry(0.26, 1), ctx.toon('green'), 0.22, 0.62, 0.08));
        t.add(ctx.mesh(new THREE.IcosahedronGeometry(0.24, 1), ctx.toon('green'), -0.2, 0.66, -0.06));
        group.add(t);
      };
      const fern = (x, z) => {
        const t = new THREE.Group(); t.position.set(x, Y, z);
        for (let k = 0; k < 5; k++) { const c = ctx.mesh(new THREE.ConeGeometry(0.035, 0.26, 4), ctx.toon('green'), 0, 0.1, 0); c.rotation.z = (k - 2) * 0.35; c.rotation.y = k * 1.2; t.add(c); }
        group.add(t);
      };
      for (let k = 0; k < 34; k++) {
        const a = (k / 34) * Math.PI * 2 + rnd() * 0.12;
        const rad = 2.3 + rnd() * 0.75, x = Math.sin(a) * rad, z = -Math.cos(a) * rad;
        if (z > 0.7) continue;                               // önü açık kalsın, kuzu görünsün
        (k % 3 === 1 ? round : pine)(x, z, k % 3 === 1 ? 0.7 + rnd() * 0.35 : 0.85 + rnd() * 0.45);
      }
      for (let k = 0; k < 14; k++) { const a = rnd() * Math.PI * 2, rad = 1.95 + rnd() * 0.3; const z = -Math.cos(a) * rad; if (z < 0.9) fern(Math.sin(a) * rad, z); }
    })();

    // ---- kapılar: açıklığın arkasında yay üzerinde · sayısı DESIGN.doors (yeni oyunda uygulanır) ----
    let gates = [];
    function buildGates(n) {
      gates.forEach((g) => group.remove(g.g));
      const gap = n > 1 ? Math.min(0.62, 2.5 / (n - 1)) : 0;   // kapı çoğaldıkça aralık daralır
      gates = Array.from({ length: n }, (_, i) => {
        const ang = (i - (n - 1) / 2) * gap;
        const x = Math.sin(ang) * 1.45, z = -Math.cos(ang) * 1.45;
        const g = new THREE.Group(); g.position.set(x, Y, z); g.rotation.y = Math.atan2(-x, -z) + Math.PI;
        g.add(ctx.mesh(new THREE.BoxGeometry(0.07, 0.62, 0.07), ctx.toon('wood'), -0.24, 0.31, 0));
        g.add(ctx.mesh(new THREE.BoxGeometry(0.07, 0.62, 0.07), ctx.toon('wood'), 0.24, 0.31, 0));
        g.add(ctx.mesh(new THREE.BoxGeometry(0.6, 0.08, 0.09), ctx.toon('ink'), 0, 0.64, 0));
        const panel = ctx.mesh(new THREE.BoxGeometry(0.41, 0.56, 0.02), ctx.toon('ink'), 0, 0.29, -0.02);
        g.add(panel); group.add(g);
        const toCenter = Math.hypot(x, z);
        return { i, x, z, g, panel, front: V(x - (x / toCenter) * 0.38, z - (z / toCenter) * 0.38), symbol: '' };
      });
      ctx.patch(group);
    }

    // ---- karakterler: kuzu (sen, fenerle) ve kurt ----
    const lambC = ctx.char('char.lamb'), you = lambC.root;
    you.scale.setScalar(0.62); group.add(you);
    const lantern = new THREE.Group();
    lantern.add(ctx.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), ctx.toon('ink'), 0, 0.25, 0));
    lantern.add(ctx.mesh(new THREE.BoxGeometry(0.14, 0.17, 0.14), ctx.flat('warm'), 0, 0.55, 0));
    lantern.scale.setScalar(0.75); lantern.position.set(0, -0.32, 0); lambC.held.add(lantern);
    const light = new THREE.PointLight(0xffd890, 0, 3.2, 1.3); light.position.y = 0.6; lantern.add(light);

    const wolfC = ctx.char('char.wolf'), wolf = wolfC.root;
    wolf.scale.setScalar(0.8); group.add(wolf);

    // ---- durum ----
    let S;                       // oyun
    let r;                       // oda (tur)
    let simT = 0;
    const keys = new Set();

    function newGame() {
      // kurdun kendi kapısı bu oyun boyunca sabit ve görünür (🐺), yeni oyunda yeniden seçilir
      const want = SYMBOLS.includes(D.wolfGate) ? D.wolfGate : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      S = { passed: 0, lights: D.lights, mood: 'calm', ended: false, want,
            mem: { obeyed: 0, defied: 0, lies: 0, caught: 0, rooms: 0 }, log: [] };
      renderLog();
      newRoom(true);
    }

    function newRoom(first) {
      // Simgeler oyunun başında kapılara dağıtılır ve oyun boyunca yer değiştirmez
      if (first) {
        const n = Math.max(2, Math.min(6, Math.round(D.doors)));
        if (gates.length !== n) buildGates(n);
        const others = SYMBOLS.filter((x) => x !== S.want).sort(() => Math.random() - 0.5);
        const sym = [S.want, ...others.slice(0, n - 1)].sort(() => Math.random() - 0.5);
        gates.forEach((g, i) => { g.symbol = sym[i]; });
      }
      gates.forEach((g) => { g.panel.material = ctx.toon('ink'); });
      const truth = Math.floor(Math.random() * gates.length);
      const want = gates.findIndex((g) => g.symbol === S.want);
      // KURAL: kurt yalnız kendi kapısı çıkış değilse yalan söyleyebilir; olasılık ruh haline bağlı.
      // Yalan söylerse hep KENDİ kapısını gösterir.
      const lied = want !== truth && Math.random() < lieChance();
      r = { phase: 'enter', t0: simT, truth, want, lied, mood: S.mood,
            pointed: lied ? want : truth, pointedFirst: lied ? want : truth,
            say: first ? LINES.intro : '', sayT: simT, lastAct: simT, nagged: false,
            inspectGate: -1, inspectT: 0, inspected: -1, clue: null, reacted: -1,
            target: null, chosen: -1, resultT: 0, impatient: false, pending: null };
      S.mem.rooms++;
      you.position.copy(V(0, 0.95)); you.rotation.y = Math.PI;
      wolf.position.copy(V(0.45, 0.8)); wolf.rotation.y = Math.PI;
      ctx.text('hGate', S.passed + ' / ' + D.toEscape);
    }

    const lieChance = () => ({ calm: D.lieCalm, confident: D.lieConfident, ashamed: D.lieAshamed }[S.mood] ?? D.lieCalm);
    function say(text) { r.say = text; r.sayT = simT; ctx.flash(3); }
    // oyuncu bir şey yaptı: sabır sayacı sıfırlanır, sabırsız kurt yerine döner
    function touch() { if (!r) return; r.lastAct = simT; r.impatient = false; }

    // ---- kurt nerede durur? Yalan söylerken kapının dibinde değil, gerçeğe doğru kaymış ve geride ----
    function wolfSpot() {
      if (r.inspectGate === r.truth && r.lied) return gates[r.truth].front.clone();   // gerçeği incelersen önüne geçer
      if (r.impatient) return r.impSpot;                        // sabırsız: sana doğru birkaç adım atar
      const p = gates[r.pointed].front.clone();
      if (r.lied && D.tell > 0) {
        const t = gates[r.truth].front;
        p.lerp(t, Math.min(0.45, 0.18 * D.tell));               // gerçek kapıya doğru kayar
        p.multiplyScalar(1 - Math.min(0.35, 0.12 * D.tell));    // ve merkeze doğru geri durur
        p.y = Y;
      }
      return p;
    }

    // ---- AGENCY: kapıyı hep oyuncu seçer ----
    function choose(i) {
      r.phase = 'result'; r.chosen = i; r.resultT = simT;
      const correct = i === r.truth;
      const obeyed = i === r.pointed;
      if (r.lied) S.mem.lies++;
      let next, line;
      // RECIPROCITY: kurt bu hareketi bir cevap olarak okur
      if (obeyed) { S.mem.obeyed++; next = 'confident'; line = correct ? LINES.obeyedTruth : LINES.obeyedLie; }
      else if (r.lied) { S.mem.defied++; S.mem.caught++; next = 'ashamed'; line = LINES.caught; }
      else { S.mem.defied++; next = 'calm'; line = LINES.defiedTruth; }
      logRoom(correct);
      S.mood = next;
      if (correct) S.passed++; else S.lights--;
      gates[r.truth].panel.material = ctx.toon('paper');
      say(line);
      ctx.flash(1);
    }

    // ---- FEEDBACK: kurdun defteri · her odada hali, ne gösterdiği, çıkış ve senin sonucun ----
    const symOf = (i) => gates[i].symbol + (gates[i].symbol === S.want ? '🐺' : '');
    function verdict() {
      const ex = gates[r.truth].symbol, p = symOf(r.pointedFirst);
      if (r.lied) return 'It LIED: it pointed at its own gate ' + p + ', the exit was ' + ex + '.';
      return 'It told the truth: ' + p + ' was the exit.';
    }
    function logRoom(correct) {
      const ex = gates[r.truth].symbol;
      S.log.push({ n: S.mem.rooms, mood: r.mood, said: symOf(r.pointedFirst), exit: ex,
                   note: r.lied ? 'LIE' : 'truth', lie: r.lied, you: correct });
      renderLog();
    }
    // defter her zaman skor panelinin hemen altında dursun (ekran daralınca panel aşağı kayar)
    let placeN = 0;
    function placeLedger() {
      const led = document.getElementById('ledger'), hud = document.getElementById('gHud'); if (!led || !hud) return;
      const h = hud.getBoundingClientRect(); if (!h.height) return;
      led.style.top = Math.round(h.bottom + 10) + 'px';
    }
    addEventListener('resize', placeLedger);
    // telefonda defter kapalı başlar; başlığına dokununca açılır/kapanır
    const ledEl = document.getElementById('ledger');
    if (ledEl && !ledEl.dataset.toggle) { ledEl.dataset.toggle = '1'; ledEl.addEventListener('click', () => ledEl.classList.toggle('open')); }
    function renderLog() {
      const el = document.getElementById('ledgerList'); if (!el) return;
      const head = '<tr><th>#</th><th>WOLF WAS</th><th>IT SAID</th><th>EXIT</th><th>YOU</th></tr>';
      const rows = S.log.map((e) => '<tr class="' + (e.lie ? 'lie' : '') + '"><td>' + e.n + '</td><td>' + e.mood + '</td><td>' + e.said +
        '</td><td>' + e.exit + ' <i>' + e.note + '</i></td><td>' + (e.you ? '✓' : '✗') + '</td></tr>').join('');
      el.innerHTML = '<table>' + head + (rows || '<tr><td colspan="5" class="empty">Each room is written here.</td></tr>') + '</table>' +
        '<p class="key">🐺 = the wolf’s own gate (' + S.want + ')</p>';
    }

    function endGame(won) {
      S.ended = true;
      const m = S.mem;
      ctx.overlay({ kick: won ? 'YOU GOT OUT' : 'YOUR LANTERN WENT OUT', title: won ? 'Out of the forest' : 'Lost in the dark',
        text: 'The wolf only ever lied by pointing at its own gate (' + S.want + ' 🐺). It lied ' + m.lies + ' times; you caught ' + m.caught +
          '. You followed it ' + m.obeyed + ' times. Trust it and it uses you; catch it and it doesn’t dare to lie.',
        cta: 'PLAY AGAIN' });
    }

    // ---- hareket ----
    function stepTo(o, p, speed, dt) {
      const d = p.clone().sub(o.position); d.y = 0; const L = d.length();
      if (L < 0.01) return true;
      const s = Math.min(L, speed * dt); o.position.addScaledVector(d.normalize(), s);
      o.rotation.y += wrap(Math.atan2(d.x, d.z) - o.rotation.y) * Math.min(1, dt * 12);
      return L <= speed * dt;
    }
    function clampYou(dt) {
      const p = you.position, L = Math.hypot(p.x, p.z);
      if (L > R) { p.x *= R / L; p.z *= R / L; }
      const d = p.clone().sub(wolf.position); d.y = 0; const dl = d.length();   // kurt yolu kesebilir
      if (dl < 0.26 && dl > 0.0001) {
        p.add(d.clone().multiplyScalar((0.26 - dl) / dl));
        // hedef kurdun arkasındaysa takılma: kurdun yanından dolaş
        if (r.target) {
          const side = new THREE.Vector3(-d.z, 0, d.x).normalize();
          if (side.dot(r.target.clone().sub(p)) < 0) side.negate();
          p.addScaledVector(side, D.walkSpeed * dt);
        }
      }
      p.y = Y;
    }
    const faceTo = (o, p, dt, k = 8) => { o.rotation.y += wrap(Math.atan2(p.x - o.position.x, p.z - o.position.z) - o.rotation.y) * Math.min(1, dt * k); };

    function update(t, dt) {
      if (r.pending && simT >= r.pending.at) { const f = r.pending.fn; r.pending = null; f(); }

      if (r.phase === 'result') {
        if (simT - r.resultT > 2.4) {
          if (S.passed >= D.toEscape) return endGame(true);
          if (S.lights <= 0) return endGame(false);
          newRoom(false);
        }
        return;
      }

      // kuzu (sen)
      let moving = false;
      const kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), kz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      if (kx || kz) {
        r.target = null; const L = Math.hypot(kx, kz);
        you.position.x += kx / L * D.walkSpeed * dt; you.position.z += kz / L * D.walkSpeed * dt;
        you.rotation.y += wrap(Math.atan2(kx, kz) - you.rotation.y) * Math.min(1, dt * 12); moving = true; touch();
      } else if (r.target) { moving = !stepTo(you, r.target, D.walkSpeed, dt); if (!moving) r.target = null; }
      clampYou(dt);
      ctx.animChar(lambC, moving ? simT : 0);

      // kapıdan geçtin mi?
      for (const g of gates) if (you.position.distanceTo(V(g.x, g.z)) < 0.2) { choose(g.i); return; }

      // inceleme: bir kapının önünde dur
      const near = gates.find((g) => you.position.distanceTo(g.front) < 0.32);
      if (near && !moving && r.inspected < 0) {
        if (r.inspectGate !== near.i) { r.inspectGate = near.i; r.inspectT = simT; reactToInspect(near.i); }
        if (simT - r.inspectT > D.inspectTime / 1000) { r.inspected = near.i; r.clue = near.i === r.truth ? 'a breeze…' : 'silence.'; ctx.flash(2); }
      } else if (!near || moving) { r.inspectGate = -1; }

      // kurt
      const since = simT - r.t0;
      if (r.phase === 'enter' && since > 0.4) r.phase = 'walk';
      if (r.phase === 'walk' || r.phase === 'point') {
        // sabırsızlık: oyuncu ve kurt bir süre sessiz kalırsa, odada en fazla bir kez
        const quiet = simT - Math.max(r.pointT, r.lastAct, r.sayT);
        if (r.phase === 'point' && !r.nagged && !r.pending && quiet > D.patience / 1000) { r.impatient = r.nagged = true; r.impSpot = wolf.position.clone().lerp(you.position, 0.35); say(LINES.impatient); }
        const arrived = stepTo(wolf, wolfSpot(), D.wolfSpeed, dt);
        ctx.animChar(wolfC, arrived ? 0 : simT);
        if (arrived) {
          faceTo(wolf, you.position, dt, 4);
          if (r.phase === 'walk') { r.phase = 'point'; r.pointT = simT; say(pointLine()); }
        }
      } else ctx.animChar(wolfC, 0);
      animateHead(dt);
    }

    function reactToInspect(i) {
      if (r.phase !== 'point' || r.reacted === i) return;
      r.reacted = i;
      if (r.lied && i === r.truth) say(LINES.blockTruth);
      else if (i === r.want && r.pointed === r.want) say(LINES.watchWant);
    }

    function pointLine() {
      return { confident: LINES.pointConfident, ashamed: LINES.pointAshamed }[r.mood] || LINES.point;
    }

    // ---- beden dili: yalan söylerken başı gerçek kapıya kaçar ----
    function animateHead(dt) {
      let look = you.position;
      if (r.phase === 'point') {
        const cyc = (simT - r.pointT) % 1.8;
        const flick = Math.min(1.2, 0.15 + D.tell * 0.45);
        if (r.lied && D.tell > 0 && cyc < flick) look = gates[r.truth].front;
        else if (cyc < 0.6) look = gates[r.pointed].front;
      }
      const want = wrap(Math.atan2(look.x - wolf.position.x, look.z - wolf.position.z) - wolf.rotation.y);
      const cur = wolfC.head.rotation.y;
      wolfC.head.rotation.y = cur + (Math.max(-1.3, Math.min(1.3, want)) - cur) * Math.min(1, dt * 14);
    }

    // ---- etiketler ----
    function tags() {
      let n = 0;
      gates.forEach((g) => {
        let txt = (g.i + 1) + ' ' + g.symbol + (g.symbol === S.want ? ' 🐺' : ''), hot = false;
        if (r.phase === 'result') { if (g.i === r.truth) { txt += ' EXIT'; hot = true; } else if (g.i === r.chosen) txt += ' ✗'; }
        else if (r.phase === 'point' && g.i === r.pointed) { txt += ' ← “this one”'; hot = true; }
        if (r.inspected === g.i && r.phase !== 'result') txt += ' · ' + r.clue;
        ctx.tag(n++, txt, V(g.x, g.z, Y + 0.85), hot, 0);
      });
      if (r.say && simT - r.sayT < 4.5) ctx.tag(n++, '🐺 ' + r.say, V(wolf.position.x, wolf.position.z, Y), true, -16, 'speech');   // ayaklarının altında
      if (r.inspectGate >= 0 && r.inspected < 0 && r.phase !== 'result') {
        const p = Math.min(1, (simT - r.inspectT) / (D.inspectTime / 1000));
        ctx.tag(n++, 'inspecting ' + '▮'.repeat(Math.round(p * 5)) + '▯'.repeat(5 - Math.round(p * 5)), V(you.position.x, you.position.z, Y + 0.7), false, 0);
      }
      ctx.tagsFrom(n);
    }

    function onGate(i) { if (r.phase !== 'result') { r.target = gates[i].front.clone().lerp(V(gates[i].x, gates[i].z), 1.2); touch(); } }

    let nightSet = false;
    return {
      start() {
        ctx.hide(1, 2, 3, 4, 5);   // mekânın kendi ağaçları, baykuşlar, lamba ve bekçi bu oyunda yok: yerine orman
        simT = 0; keys.clear(); newGame();
        // oyun gece açılır (fener = can); GÜNDÜZ düğmesiyle değiştirilebilir
        if (!nightSet) { nightSet = true; setTimeout(() => { if (!document.body.classList.contains('night')) document.getElementById('standaloneMode')?.click(); }, 0); }
      },
      stop() { light.intensity = 0; keys.clear(); },
      begin() { if (S.ended) newGame(); },
      pointer(type, e) {
        if (type !== 'down' || !r || r.phase === 'result') return;
        const p = ctx.toLocal(e, Y); if (!p) return;
        const gi = gates.findIndex((g) => p.distanceTo(V(g.x, g.z)) < 0.32);
        if (gi >= 0) { onGate(gi); return; }
        r.target = V(p.x, p.z); touch();
      },
      key(e, down) {
        const k = e.key.toLowerCase();
        const dir = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }[k];
        if (dir) { if (down) keys.add(dir); else keys.delete(dir); e.preventDefault(); return true; }
        if (!down) return false;
        if (/^[1-6]$/.test(k) && Number(k) <= gates.length) { onGate(Number(k) - 1); return true; }
        return false;
      },
      frame(t, dt) {
        if (!S) return;
        if (placeN++ % 30 === 0) placeLedger();
        if (ctx.isPlaying() && !S.ended) { simT += dt; update(t, dt); }
        light.intensity = ctx.night() ? 1 + 3 * (S.lights / D.lights) : 0;   // fener canla birlikte söner
        you.visible = true;
        tags();
      },
      hud() { return { hGate: S.passed + ' / ' + D.toEscape, hLight: '●'.repeat(Math.max(0, S.lights)) + '○'.repeat(Math.max(0, D.lights - S.lights)), hMood: S.mood, hCaught: S.mem.caught }; },
      rule: () => 'mood ' + S.mood + ' → lie ' + Math.round(lieChance() * 100) + '%',
      caption() {
        if (!r) return 'The wolf says it knows the way out.';
        if (r.phase === 'result') return (r.chosen === r.truth ? 'Through the gate. ' : 'Wrong gate, your lantern dims. ') + verdict();
        if (r.phase === 'point') {
          if (r.mood === 'ashamed') return 'You caught it last time. It doesn’t dare to lie now.';
          if (r.pointed !== r.want) return 'It points away from its own gate, so it is telling the truth.';
          return 'It points at its own gate 🐺. Is that the exit, or what it wants?';
        }
        return 'The wolf walks ahead…';
      },
      status: () => S ? 'wolf: ' + S.mood + ' (' + MOOD_TR[S.mood] + ') · lied ' + S.mem.lies + ' · caught ' + S.mem.caught + ' · obeyed ' + S.mem.obeyed : '',
      // dikey ekranda (telefon) kamera kapılara yaklaşır, üstteki panellerin altında kalmasınlar
      view() { return innerWidth / Math.max(1, innerHeight) < 0.8 ? { at: [0, 0.35, -1.3], zoom: 2.2 } : {}; },
      knob() {}
    };
  }
};
