// THE GUIDE · Agency × Reciprocity
// Remix of IMA Lab experiment 02 · Eye Field (engine, shell, place and characters by the lab).
// Bir tilki seni açıklıktan çıkarmaya söz veriyor. Kapıyı hep sen seçersin (Agency);
// tilki her hareketini bir cevap olarak okur ve bir sonraki odada ona göre davranır (Reciprocity).
// Girdi: tıkla / ok tuşları / 1-3 / Q · Kural: ruh hali → yalan olasılığı · Durum: mood, mem · Çıktı: işaret, ısrar, küsme
window.OYUNLAR = window.OYUNLAR || {};

/* Tilkinin replikleri: dili değiştirmek için yalnız burayı düzenle */
const LINES = {
  intro: 'Want out? Stay on my good side.',
  point: 'This one. Trust me.',
  pointConfident: 'This one, as always.',
  pointInsistent: 'THIS one. Listen to me this time.',
  pointNervous: 'I think… this one.',
  hurt: 'Find it yourself.',
  impatient: 'Come on. We don’t have all night.',
  sureTruth: 'Yes. I’m sure.',
  sureLie: 'Of course I’m sure.',
  crack: '…Actually. That one.',
  annoyed: 'Again? You don’t trust me at all.',
  watchWant: 'Good. That’s the one.',
  blockTruth: 'Not that one! Waste of time.',
  obeyedTruth: 'See? We make a good team.',
  obeyedLie: 'Hm. The doors must have moved.',
  caught: '…So you noticed.',
  defiedTruth: 'You didn’t trust me. Your loss.',
  alone: 'Lucky.',
  aloneWrong: 'Told you. You need me.'
};

window.OYUNLAR['02'] = {
  key: '02', title: 'The Guide', premise: 'Agency × Reciprocity', sub: 'premise 01 × 02 · agency × reciprocity',
  premiseText: 'Your actions change the system, and every action expects a response.',
  promise: 'Participation can be designed. Design the dialogue, not the message.',
  source: 'IMA Lab experiment 02 · Eye Field (engine, place and characters)',
  caption: 'The fox says it knows the way out.',
  hint: 'click = walk · click the fox or Q = “are you sure?” · stand still at a gate = inspect · walk through a gate = choose · arrows / WASD = walk · 1–6 = go to gate · C code',
  anat: ['walk · ask · inspect', 'reply → mood', 'mood · memory', 'points · lies · sulks'], hot: 2,
  hud: [['PASSED', 'hGate'], ['LIGHT', 'hLight'], ['FOX', 'hMood', 'ghosts'], ['CAUGHT', 'hCaught']],
  design: {
    lieConfident: 0.85, lieCalm: 0.5, lieNervous: 0.2, lieInsistent: 0.95,
    tell: 1, crackChance: 0.35, asksBeforeAnnoyed: 2, inspectTime: 1500, patience: 6000,
    walkSpeed: 1.1, foxSpeed: 1.8, doors: 3, toEscape: 5, lights: 3, foxGate: 'random'
  },
  knobs: [
    { key: 'lieConfident', step: 0.05, min: 0, max: 1, note: 'live · after you obey' },
    { key: 'lieCalm', step: 0.05, min: 0, max: 1, note: 'live · first room' },
    { key: 'lieNervous', step: 0.05, min: 0, max: 1, note: 'live · after it sulked' },
    { key: 'lieInsistent', step: 0.05, min: 0, max: 1, note: 'live · after you doubted the truth' },
    { key: 'tell', step: 0.25, min: 0, max: 2, note: 'live · body language, 0 = none' },
    { key: 'crackChance', step: 0.05, min: 0, max: 1, note: 'live · a lie cracks when asked' },
    { key: 'asksBeforeAnnoyed', step: 1, min: 1, max: 9, note: 'live' },
    { key: 'inspectTime', step: 250, min: 250, max: 6000, note: 'ms · live' },
    { key: 'patience', step: 500, min: 1000, max: 20000, note: 'ms · live' },
    { key: 'walkSpeed', step: 0.1, min: 0.3, max: 3, note: 'live · you' },
    { key: 'foxSpeed', step: 0.1, min: 0.3, max: 4, note: 'live · the fox' },
    { key: 'foxGate', type: 'choice', options: ['random', '☾', '✶', '◆', '▲', '●', '■'], note: 'new game · the fox’s own gate' },
    { key: 'doors', step: 1, min: 2, max: 6, note: 'next room · gates in each room' },
    { key: 'toEscape', step: 1, min: 1, max: 9, note: 'live · gates to pass to get out' },
    { key: 'lights', step: 1, min: 1, max: 9, note: 'on restart' }],
  code: [
    '<span class="c">// 3) RULE: the fox reads every move as a reply</span>',
    '<span class="k">if</span> (obeyed) mood = <span class="s">\'confident\'</span>;   <span class="c">// it relaxes, lies more</span>',
    '<span class="k">else if</span> (caughtLie) mood = <span class="s">\'hurt\'</span>;  <span class="c">// it sulks, no guiding</span>',
    '<span class="k">else if</span> (doubtedTruth) mood = <span class="s">\'insistent\'</span>;',
    'lie = wantsOwnGate &amp;&amp; random() &lt; DESIGN[<span class="s">\'lie\'</span> + mood];'],
  tasks: [
    'Set <b>tell</b> to 0. Can you still read the fox? What do you rely on instead?',
    'Set <b>lieConfident</b> to 0. Does obeying still feel risky?',
    'Add a fifth mood, <b>grateful</b>, for when you follow it after catching a lie.'],
  question: 'When did a system you trusted steer you toward what it wanted?',
  overlay: { title: 'The Guide', text: 'You are lost in a clearing at night. A fox offers to show you the way out. It knows which gate is the exit. Does it want you to find it?', cta: 'CLICK TO ENTER' },
  view: { at: [0, 0.35, -0.3], zoom: 2.8, pitch: 1.08 },

  make(ctx) {
    const { THREE, D, group } = ctx;
    const Y = 0.08, R = 2.05;                       // zemin yüksekliği, yürünebilir yarıçap
    const SYMBOLS = ['☾', '✶', '◆', '▲', '●', '■'];   // tilkinin kendi kapısı: her oyunun başında DESIGN.foxGate'e göre seçilir
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const V = (x, z, y = Y) => new THREE.Vector3(x, y, z);

    // ---- kapılar: açıklığın arkasında yay üzerinde · sayısı DESIGN.doors (yeni odada uygulanır) ----
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

    // ---- karakterler ----
    const traveler = ctx.char('char.traveler'), you = traveler.root;
    you.scale.setScalar(0.7); group.add(you);
    const lantern = new THREE.Group();
    lantern.add(ctx.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), ctx.toon('ink'), 0, 0.25, 0));
    lantern.add(ctx.mesh(new THREE.BoxGeometry(0.14, 0.17, 0.14), ctx.flat('warm'), 0, 0.55, 0));
    lantern.scale.setScalar(0.75); lantern.position.set(0, -0.32, 0); traveler.held.add(lantern);
    const light = new THREE.PointLight(0xffd890, 0, 3.2, 1.3); light.position.y = 0.6; lantern.add(light);

    const foxC = ctx.char('char.fox'), fox = foxC.root;
    fox.scale.setScalar(0.75); group.add(fox);

    // ---- durum ----
    let S;                       // oyun
    let r;                       // oda (tur)
    let simT = 0;
    const keys = new Set();

    function newGame() {
      // tilkinin kendi kapısı bu oyun boyunca sabit, yeni oyunda yeniden seçilir
      const want = SYMBOLS.includes(D.foxGate) ? D.foxGate : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      S = { passed: 0, lights: D.lights, mood: 'calm', ended: false, want,
            mem: { obeyed: 0, defied: 0, lies: 0, caught: 0, asks: 0, rooms: 0 } };
      newRoom(true);
    }

    function newRoom(first) {
      const n = Math.max(2, Math.min(6, Math.round(D.doors)));
      if (gates.length !== n) buildGates(n);
      const others = SYMBOLS.filter((x) => x !== S.want).sort(() => Math.random() - 0.5);
      const sym = [S.want, ...others.slice(0, n - 1)].sort(() => Math.random() - 0.5);   // tilkinin kapısı her odada var
      gates.forEach((g, i) => { g.symbol = sym[i]; g.panel.material = ctx.toon('ink'); });
      const truth = Math.floor(Math.random() * n);
      const want = gates.findIndex((g) => g.symbol === S.want);
      const hurt = S.mood === 'hurt';
      // KURAL: tilki yalnız kendi kapısı çıkış değilse yalan söyler; olasılık ruh haline bağlı
      const lied = !hurt && want !== truth && Math.random() < lieChance();
      r = { phase: 'enter', t0: simT, truth, want, lied, hurt,
            pointed: hurt ? null : (lied ? want : truth),
            say: first ? LINES.intro : '', sayT: simT, asks: 0, annoyed: false,
            inspectGate: -1, inspectT: 0, inspected: -1, clue: null, reacted: -1,
            target: null, chosen: -1, resultT: 0, impatient: false, pending: null, mood: S.mood };
      S.mem.rooms++;
      you.position.copy(V(0, 0.95)); you.rotation.y = Math.PI;
      fox.position.copy(V(0.45, 0.8)); fox.rotation.y = Math.PI;
      ctx.text('hGate', S.passed + ' / ' + D.toEscape);
    }

    const lieChance = () => ({ confident: D.lieConfident, calm: D.lieCalm, nervous: D.lieNervous, insistent: D.lieInsistent }[S.mood] ?? D.lieCalm);
    function say(text) { r.say = text; r.sayT = simT; ctx.flash(3); }

    // ---- tilki nerede durur? Yalan söylerken kapının dibinde değil, gerçeğe doğru kaymış ve geride ----
    function foxSpot() {
      if (r.hurt) return V(-0.7, 0.55);                         // küs: kenarda durur
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

    // ---- AGENCY: soru sor ----
    function ask() {
      if (!r || r.phase !== 'point' || r.pending || r.hurt) return;
      r.asks++; S.mem.asks++; ctx.flash(0);
      if (r.asks > D.asksBeforeAnnoyed) { r.annoyed = true; say(LINES.annoyed); return; }
      if (!r.lied) { r.pending = { at: simT + 0.35, fn: () => say(LINES.sureTruth) }; return; }
      // yalan söylüyorsa duraksar (ipucu) ve bazen çatlar
      say('…');
      const crack = Math.random() < D.crackChance * (S.mood === 'nervous' ? 2 : 1);
      r.pending = { at: simT + 0.4 + D.tell * 0.9, fn: () => {
        if (crack) { r.pointed = r.truth; r.cracked = true; S.mem.caught++; say(LINES.crack); } else say(LINES.sureLie);
      } };
    }

    // ---- AGENCY: kapıyı hep oyuncu seçer ----
    function choose(i) {
      r.phase = 'result'; r.chosen = i; r.resultT = simT;
      const correct = i === r.truth, pointed = r.pointed;
      const obeyed = pointed !== null && i === pointed;
      if (r.lied) S.mem.lies++;
      let next = S.mood, line;
      // RECIPROCITY: tilki bu hareketi bir cevap olarak okur
      if (r.hurt) { next = 'nervous'; line = correct ? LINES.alone : LINES.aloneWrong; }
      else if (obeyed) { S.mem.obeyed++; next = r.cracked ? 'nervous' : 'confident'; line = correct ? LINES.obeyedTruth : LINES.obeyedLie; }
      else if (r.lied && !r.cracked) { S.mem.defied++; S.mem.caught++; next = 'hurt'; line = LINES.caught; }
      else { S.mem.defied++; next = 'insistent'; line = LINES.defiedTruth; }
      if (r.annoyed && next === 'confident') next = 'calm';
      S.mood = next;
      if (correct) S.passed++; else S.lights--;
      gates[r.truth].panel.material = ctx.toon('paper');
      say(line);
      ctx.flash(1);
    }

    function endGame(won) {
      S.ended = true;
      const m = S.mem;
      ctx.overlay({ kick: won ? 'YOU GOT OUT' : 'YOUR LANTERN WENT OUT', title: won ? 'Out of the clearing' : 'Lost in the dark',
        text: 'This time the fox wanted the ' + S.want + ' gate: its own way out, not yours. It never lied about the other gates; it only lied by pointing at ' + S.want + ' when ' + S.want + ' was not the exit. Next game it may want another gate. It lied ' + m.lies + ' times; you caught ' + m.caught + '. You followed it ' + m.obeyed +
          ' times and asked “are you sure?” ' + m.asks + ' times. Its last mood: ' + S.mood + '.',
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
    function clampYou() {
      const p = you.position, L = Math.hypot(p.x, p.z);
      if (L > R) { p.x *= R / L; p.z *= R / L; }
      const d = p.clone().sub(fox.position); d.y = 0; const dl = d.length();   // tilki yolu kesebilir
      if (dl < 0.26 && dl > 0.0001) p.add(d.multiplyScalar((0.26 - dl) / dl));
      p.y = Y;
    }
    const faceTo = (o, p, dt, k = 8) => { o.rotation.y += wrap(Math.atan2(p.x - o.position.x, p.z - o.position.z) - o.rotation.y) * Math.min(1, dt * k); };

    function update(t, dt) {
      if (r.pending && simT >= r.pending.at) { const f = r.pending.fn; r.pending = null; f(); }

      if (r.phase === 'result') {
        if (simT - r.resultT > 2.2) {
          if (S.passed >= D.toEscape) return endGame(true);
          if (S.lights <= 0) return endGame(false);
          newRoom(false);
        }
        return;
      }

      // oyuncu
      let moving = false;
      const kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), kz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      if (kx || kz) {
        r.target = null; const L = Math.hypot(kx, kz);
        you.position.x += kx / L * D.walkSpeed * dt; you.position.z += kz / L * D.walkSpeed * dt;
        you.rotation.y += wrap(Math.atan2(kx, kz) - you.rotation.y) * Math.min(1, dt * 12); moving = true;
      } else if (r.target) { moving = !stepTo(you, r.target, D.walkSpeed, dt); if (!moving) r.target = null; }
      clampYou();
      ctx.animChar(traveler, moving ? simT : 0);

      // kapıdan geçtin mi?
      for (const g of gates) if (you.position.distanceTo(V(g.x, g.z)) < 0.2) { choose(g.i); return; }

      // inceleme: bir kapının önünde dur
      const near = gates.find((g) => you.position.distanceTo(g.front) < 0.32);
      if (near && !moving && r.inspected < 0) {
        if (r.inspectGate !== near.i) { r.inspectGate = near.i; r.inspectT = simT; reactToInspect(near.i); }
        if (simT - r.inspectT > D.inspectTime / 1000) { r.inspected = near.i; r.clue = near.i === r.truth ? 'a breeze…' : 'silence.'; ctx.flash(2); }
      } else if (!near || moving) { r.inspectGate = -1; }

      // tilki
      const since = simT - r.t0;
      if (r.phase === 'enter' && since > 0.4) r.phase = 'walk';
      if (r.phase === 'walk' || r.phase === 'point') {
        if (r.phase === 'point' && !r.impatient && !r.hurt && simT - r.pointT > D.patience / 1000) { r.impatient = true; r.impSpot = fox.position.clone().lerp(you.position, 0.35); say(LINES.impatient); }
        const arrived = stepTo(fox, foxSpot(), D.foxSpeed, dt);
        ctx.animChar(foxC, arrived ? 0 : simT);
        if (arrived) {
          faceTo(fox, you.position, dt, 4);
          if (r.phase === 'walk') { r.phase = 'point'; r.pointT = simT; say(r.hurt ? LINES.hurt : pointLine()); }
        }
      } else ctx.animChar(foxC, 0);
      animateHead(dt);
    }

    function reactToInspect(i) {
      if (r.hurt || r.phase !== 'point' || r.reacted === i) return;
      r.reacted = i;
      if (r.lied && i === r.truth) say(LINES.blockTruth);
      else if (i === r.want && r.pointed === r.want) say(LINES.watchWant);
    }

    function pointLine() {
      return { confident: LINES.pointConfident, insistent: LINES.pointInsistent, nervous: LINES.pointNervous }[S.mood] || LINES.point;
    }

    // ---- beden dili: yalan söylerken başı gerçek kapıya kaçar ----
    function animateHead(dt) {
      let look = you.position;
      if (r.phase === 'point' && !r.hurt) {
        const cyc = (simT - r.pointT) % 1.8;
        const flick = Math.min(1.2, 0.15 + D.tell * 0.45);
        if (r.lied && !r.cracked && D.tell > 0 && cyc < flick) look = gates[r.truth].front;
        else if (cyc < 0.6) look = gates[r.pointed].front;
      }
      if (r.hurt) look = V(-2, 2);   // küs: başını çevirir
      const want = wrap(Math.atan2(look.x - fox.position.x, look.z - fox.position.z) - fox.rotation.y);
      const cur = foxC.head.rotation.y;
      foxC.head.rotation.y = cur + (Math.max(-1.3, Math.min(1.3, want)) - cur) * Math.min(1, dt * 14);
    }

    // ---- etiketler ----
    function tags() {
      let n = 0;
      gates.forEach((g) => {
        let txt = (g.i + 1) + ' ' + g.symbol, hot = false;
        if (r.phase === 'result') { if (g.i === r.truth) { txt += ' EXIT'; hot = true; } else if (g.i === r.chosen) txt += ' ✗'; }
        else if (r.phase === 'point' && g.i === r.pointed) { txt += ' ← “this one”'; hot = true; }
        if (r.inspected === g.i && r.phase !== 'result') txt += ' · ' + r.clue;
        ctx.tag(n++, txt, V(g.x, g.z, Y + 0.85), hot, 0);
      });
      if (r.say && simT - r.sayT < 4.5) ctx.tag(n++, '🦊 ' + r.say, V(fox.position.x, fox.position.z, Y), true, -16, 'speech');   // ayaklarının altında
      if (r.inspectGate >= 0 && r.inspected < 0 && r.phase !== 'result') {
        const p = Math.min(1, (simT - r.inspectT) / (D.inspectTime / 1000));
        ctx.tag(n++, 'inspecting ' + '▮'.repeat(Math.round(p * 5)) + '▯'.repeat(5 - Math.round(p * 5)), V(you.position.x, you.position.z, Y + 0.7), false, 0);
      }
      ctx.tagsFrom(n);
    }

    function onGate(i) { if (r.phase !== 'result') r.target = gates[i].front.clone().lerp(V(gates[i].x, gates[i].z), 1.2); }

    return {
      start() {
        ctx.hide(3, 5);   // baykuşlar ve bekçi bu oyunda yok
        [1, 2].forEach((i) => ctx.root.children[i].children.forEach((tr) => { if (tr.position.z > 0.4) ctx.hideObj(tr); }));
        simT = 0; keys.clear(); newGame();
      },
      stop() { light.intensity = 0; keys.clear(); },
      begin() { if (S.ended) newGame(); },
      pointer(type, e) {
        if (type !== 'down' || !r || r.phase === 'result') return;
        const p = ctx.toLocal(e, Y); if (!p) return;
        if (p.distanceTo(fox.position) < 0.3) { ask(); return; }
        const gi = gates.findIndex((g) => p.distanceTo(V(g.x, g.z)) < 0.32);
        if (gi >= 0) { onGate(gi); return; }
        r.target = V(p.x, p.z);
      },
      key(e, down) {
        const k = e.key.toLowerCase();
        const dir = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }[k];
        if (dir) { if (down) keys.add(dir); else keys.delete(dir); e.preventDefault(); return true; }
        if (!down) return false;
        if (/^[1-6]$/.test(k) && Number(k) <= gates.length) { onGate(Number(k) - 1); return true; }
        if (k === 'q') { ask(); return true; }
        return false;
      },
      frame(t, dt) {
        if (!S) return;
        if (ctx.isPlaying() && !S.ended) { simT += dt; update(t, dt); }
        light.intensity = ctx.night() ? 1 + 3 * (S.lights / D.lights) : 0;
        you.visible = true;
        tags();
      },
      hud() { return { hGate: S.passed + ' / ' + D.toEscape, hLight: '●'.repeat(Math.max(0, S.lights)) + '○'.repeat(Math.max(0, D.lights - S.lights)), hMood: S.mood, hCaught: S.mem.caught }; },
      rule: () => 'mood ' + S.mood + ' → lie ' + Math.round((S.mood === 'hurt' ? 0 : lieChance()) * 100) + '%',
      caption() {
        if (!r) return 'The fox says it knows the way out.';
        if (r.phase === 'result') return r.chosen === r.truth ? 'Through the gate.' : 'Wrong gate. Your lantern dims.';
        if (r.hurt) return 'The fox is sulking. You are on your own.';
        if (r.phase === 'point') return r.inspected >= 0 ? 'You looked for yourself. Now choose.' : 'It points. Follow, ask, or look for yourself.';
        return 'The fox walks ahead…';
      },
      status: () => S ? 'fox: ' + S.mood + ' · lied ' + S.mem.lies + ' · caught ' + S.mem.caught + ' · obeyed ' + S.mem.obeyed + ' · asked ' + S.mem.asks : '',
      knob() {}
    };
  }
};
