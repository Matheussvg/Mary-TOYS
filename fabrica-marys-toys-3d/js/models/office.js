/*
 * Modelos 3D de escritório para a ala da TI, feitos com primitivas (sem arquivos externos).
 * Cada modelo devolve um grupo com origem no chão, frente para +z, e em userData:
 *   back       distância da origem até o fundo (para encostar na parede)
 *   colliders  caixas locais [x1, x2, y1, y2, z1, z2] que o jogador não atravessa
 * Telas de PC levam userData.pc (viram computadores clicáveis) e userData.keep (não são fundidas no MT.bake).
 */
(function () {
  const MT = (window.MT = window.MT || {});
  const DESK_H = 0.75;

  let K = null;
  const mats = () => K || (K = {
    wood: MT.mat(0xc49a6c, { r: 0.6 }),
    woodDark: MT.mat(0x7a5638, { r: 0.65 }),
    white: MT.mat(0xebe8e1, { r: 0.5 }),
    graphite: MT.mat(0x30343a, { r: 0.45, m: 0.5 }),
    chrome: MT.mat(0xb8bcc2, { r: 0.25, m: 0.9, env: 1 }),
    black: MT.mat(0x17191c, { r: 0.4 }),
    keys: MT.mat(0x3a3e45, { r: 0.6 }),
    blue: MT.mat(0x2a4b9b, { r: 0.9 }),
    blueDark: MT.mat(0x1d3570, { r: 0.9 }),
    red: MT.mat(0xa3161c, { r: 0.6 }),
    wine: MT.mat(0x8e1b2a, { r: 0.9 }), // tecido das cadeiras da Comunicação
    gold: MT.mat(0xd9a441, { r: 0.35, m: 0.6 }),
    yellow: MT.mat(0xf4c51c, { r: 0.4 }),
    green: MT.mat(0x1f6b3a, { r: 0.5 }),
    kraft: MT.mat(0xb08a5a, { r: 0.9 }),
    paper: MT.mat(0xf6f3ea, { r: 0.9 }),
    pot: MT.mat(0xd8d2c4, { r: 0.7 }),
    soil: MT.mat(0x3b2a1e, { r: 1 }),
    leaf: MT.mat(0x2f6b32, { r: 0.8 }),
    leaf2: MT.mat(0x3d8a3c, { r: 0.8 }),
    led: MT.mat(0x6fb6ff, { e: 0x6fb6ff, ei: 1.6 }),
    water: MT.mat(0x8fc4e8, { r: 0.1, t: true, op: 0.55 }),
    pcb: MT.mat(0x1f6b3a, { r: 0.6 }),
  });
  const TOY = () => [K.red, K.yellow, K.blue, K.green, K.gold, K.white];

  // Caixa sem colisão com base em y
  const B = (g, w, h, d, x, y, z, m) => MT.box(g, w, h, d, x, y, z, m, { collide: false });
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const group = () => {
    const g = new THREE.Group();
    g.userData.colliders = [];
    return g;
  };
  let wheelGeo = null, leafGeo = null;

  MT.MODELS = {};
  const model = (name, fn) => { MT.MODELS[name] = (o = {}) => fn(o, mats()); };

  // ---------- peças ----------
  function desk(g, w, d, top) {
    B(g, w, 0.03, d, 0, DESK_H - 0.03, 0, top);
    for (const s of [-1, 1]) B(g, 0.03, DESK_H - 0.03, d - 0.04, s * (w / 2 - 0.035), 0, 0, K.graphite);
    B(g, w - 0.1, 0.36, 0.015, 0, 0.32, -d / 2 + 0.06, K.graphite);
    g.userData.colliders.push([-w / 2, w / 2, 0, DESK_H, -d / 2, d / 2]);
  }

  // Cadeira giratória; quem senta olha para −z
  function chair(g, x, z, yaw, fabric) {
    const c = new THREE.Group();
    c.position.set(x, 0, z);
    c.rotation.y = yaw;
    g.add(c);
    wheelGeo = wheelGeo || new THREE.SphereGeometry(0.03, 6, 4);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      B(c, 0.3, 0.035, 0.045, Math.cos(a) * 0.15, 0.045, Math.sin(a) * 0.15, K.black).rotation.y = -a;
      const wh = new THREE.Mesh(wheelGeo, K.black);
      wh.position.set(Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29);
      c.add(wh);
    }
    MT.cyl(c, 0.025, 0.025, 0.34, 0, 0.07, 0, K.chrome, { seg: 10 });
    B(c, 0.3, 0.03, 0.3, 0, 0.4, 0, K.black);
    B(c, 0.5, 0.08, 0.48, 0, 0.43, 0, fabric);
    B(c, 0.06, 0.4, 0.03, 0, 0.42, 0.25, K.black);
    B(c, 0.46, 0.52, 0.06, 0, 0.6, 0.28, fabric).rotation.x = 0.12;
    for (const s of [-1, 1]) {
      B(c, 0.03, 0.2, 0.03, s * 0.26, 0.47, 0.02, K.black);
      B(c, 0.06, 0.03, 0.24, s * 0.26, 0.67, 0, K.black);
    }
    g.userData.colliders.push([x - 0.3, x + 0.3, 0, 1.1, z - 0.3, z + 0.3]);
  }

  // Monitor com a tela no centro do grupo; devolve a malha da tela
  function monitor(g, x, z, yaw, sw, sh, kind, variant, pc) {
    const m = new THREE.Group();
    const elev = 0.11; // da mesa até a borda de baixo da tela
    m.position.set(x, DESK_H + elev + sh / 2, z);
    m.rotation.y = yaw;
    g.add(m);
    const bz = 0.014;
    B(m, sw + bz * 2, sh + bz * 2, 0.022, 0, -(sh / 2 + bz), -0.011, K.black);
    B(m, sw * 0.6, sh * 0.55, 0.035, 0, -sh * 0.3, -0.04, K.black);
    B(m, 0.05, elev + sh * 0.3, 0.025, 0, -(elev + sh / 2), -0.07, K.graphite);
    B(m, 0.24, 0.012, 0.17, 0, -(elev + sh / 2), -0.06, K.graphite);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({ map: MT.screenTexture(kind, variant % 2), toneMapped: false })
    );
    screen.position.z = 0.002;
    screen.userData = { keep: true, w: sw, h: sh, pc };
    m.add(screen);
    return screen;
  }

  function brick(g, x, y, z, mat, nx = 2, nz = 1, s = 0.05) {
    B(g, nx * s, s * 0.6, nz * s, x, y, z, mat);
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      MT.cyl(g, s * 0.3, s * 0.3, s * 0.18, x + (i - (nx - 1) / 2) * s, y + s * 0.6, z + (k - (nz - 1) / 2) * s, mat, { seg: 6, cast: false });
    }
  }

  function legs(g, w, d, h, inset = 0.06) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.05, h, 0.05, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), K.graphite);
  }

  // ---------- estações de trabalho ----------
  model('workstation', (o) => {
    const g = group();
    const w = 1.6, d = 0.8;
    desk(g, w, d, K[o.top || 'wood']);
    const pc = { owner: o.owner || null, role: o.role || null, label: o.label || null, main: !!o.main };
    const v = o.variant || 0;
    if (o.dual) {
      monitor(g, -0.34, -0.17, 0.2, 0.6, 0.34, o.screen, v, pc);
      monitor(g, 0.34, -0.17, -0.2, 0.6, 0.34, o.screen2 || o.screen, v + 1, pc);
    } else if (o.big) {
      monitor(g, 0, -0.17, 0, 0.72, 0.405, o.screen, v, pc);
    } else {
      monitor(g, 0, -0.17, 0, 0.6, 0.34, o.screen, v, pc);
    }
    // teclado e mouse (ou mesa digitalizadora no Design)
    B(g, 0.44, 0.022, 0.14, -0.06, DESK_H, 0.17, K.black);
    B(g, 0.42, 0.006, 0.12, -0.06, DESK_H + 0.022, 0.17, K.keys);
    if (o.tablet) {
      B(g, 0.34, 0.012, 0.24, 0.48, DESK_H, 0.14, K.black);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({ map: MT.screenTexture('design', 1), toneMapped: false }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(0.48, DESK_H + 0.0135, 0.14);
      g.add(pad);
      MT.cyl(g, 0.006, 0.006, 0.16, 0.68, DESK_H + 0.006, 0.12, K.graphite, { seg: 6, cast: false }).rotation.z = Math.PI / 2;
    } else {
      B(g, 0.26, 0.004, 0.22, 0.32, DESK_H, 0.16, K.blueDark);
      B(g, 0.06, 0.03, 0.1, 0.32, DESK_H + 0.004, 0.17, K.black);
    }
    // gabinete embaixo da mesa, com a faixa de luz para a frente
    B(g, 0.2, 0.45, 0.45, w / 2 - 0.2, 0, -0.08, K.black);
    B(g, 0.02, 0.3, 0.004, w / 2 - 0.2, 0.08, 0.147, K.led);
    // detalhes: caneca, papéis e um bloco de montar
    MT.cyl(g, 0.04, 0.04, 0.1, -0.68, DESK_H, -0.25, pick([K.red, K.white, K.blue]), { seg: 12 });
    B(g, 0.21, 0.01, 0.29, -0.55, DESK_H, 0.15, K.paper).rotation.y = 0.2;
    if (v % 3 === 0) brick(g, 0.65, DESK_H, -0.25, pick(TOY()), 2, 2, 0.04);
    chair(g, (Math.random() - 0.5) * 0.15, 0.72, (Math.random() - 0.5) * 0.5, K[o.chair || 'blue']);
    g.userData.back = d / 2;
    return g;
  });

  // Ilha de mesas: metade das cadeiras de cada lado, com divisória no meio
  model('pod', (o) => {
    const g = group();
    const seats = o.seats || [];
    const n = Math.ceil(seats.length / 2), w = 1.6, d = 0.8;
    seats.forEach((s, i) => {
      const side = i < n ? 0 : 1, k = side ? i - n : i;
      const ws = MT.MODELS.workstation(Object.assign({ variant: i, chair: o.chair }, s));
      ws.position.set((k - (n - 1) / 2) * w, 0, side ? -d / 2 : d / 2);
      ws.rotation.y = side ? Math.PI : 0;
      g.add(ws);
    });
    B(g, n * w, 0.42, 0.04, 0, DESK_H, 0, K.blue);
    B(g, n * w + 0.02, 0.02, 0.05, 0, DESK_H + 0.42, 0, K.graphite);
    return g;
  });

  // ---------- mesas ----------
  model('roundTable', (o) => {
    const g = group();
    MT.cyl(g, 0.6, 0.6, 0.03, 0, 0.72, 0, K.white, { seg: 28 });
    MT.cyl(g, 0.04, 0.04, 0.72, 0, 0, 0, K.chrome, { seg: 10 });
    MT.cyl(g, 0.28, 0.3, 0.02, 0, 0, 0, K.graphite, { seg: 20 });
    g.userData.colliders.push([-0.6, 0.6, 0, 0.75, -0.6, 0.6]);
    const n = o.chairs || 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / 4;
      chair(g, Math.sin(a) * 0.98, Math.cos(a) * 0.98, a, K[o.chair || 'blue']);
    }
    B(g, 0.3, 0.01, 0.22, 0.1, 0.75, -0.05, K.paper).rotation.y = 0.4;
    MT.cyl(g, 0.04, 0.04, 0.1, -0.2, 0.75, 0.15, K.red, { seg: 12 });
    return g;
  });

  function longTable(g, w, d, top, n, fabric) {
    B(g, w, 0.04, d, 0, 0.71, 0, top);
    for (const s of [-1, 1]) B(g, 0.06, 0.71, d - 0.3, s * (w / 2 - 0.3), 0, 0, K.graphite);
    g.userData.colliders.push([-w / 2, w / 2, 0, 0.75, -d / 2, d / 2]);
    const per = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const side = i < per ? 1 : -1, k = i < per ? i : i - per;
      chair(g, (k - (per - 1) / 2) * (w / per), side * (d / 2 + 0.45), side > 0 ? 0 : Math.PI, fabric || K.blue);
    }
  }

  model('meetingTable', (o) => {
    const g = group();
    const w = o.w || 3.2, d = o.d || 1.2;
    longTable(g, w, d, K.wood, o.chairs === undefined ? 6 : o.chairs, K[o.chair || 'blue']);
    // notebooks e papéis da reunião
    for (const [x, z, r] of [[-0.9, 0.25, 0.1], [0.8, -0.25, Math.PI - 0.15]]) {
      const nb = new THREE.Group();
      nb.position.set(x, 0.75, z);
      nb.rotation.y = r;
      g.add(nb);
      B(nb, 0.34, 0.015, 0.24, 0, 0, 0, K.graphite);
      const lid = B(nb, 0.34, 0.22, 0.01, 0, 0.015, -0.12, K.graphite);
      lid.rotation.x = -0.25;
    }
    B(g, 0.3, 0.01, 0.22, 0.1, 0.75, 0.2, K.paper).rotation.y = -0.3;
    return g;
  });

  // Mesa de criação do Design: papéis, amostras de cor e protótipos
  model('workTable', (o) => {
    const g = group();
    const w = o.w || 3.0, d = o.d || 1.4;
    longTable(g, w, d, K.white, o.chairs === undefined ? 4 : o.chairs);
    for (let i = 0; i < 6; i++) B(g, 0.3, 0.004, 0.21, -1.1 + i * 0.42, 0.75, (Math.random() - 0.5) * 0.6, K.paper).rotation.y = (Math.random() - 0.5) * 0.6;
    TOY().forEach((m, i) => B(g, 0.08, 0.006, 0.12, 0.6 + i * 0.1, 0.754, 0.35, m));
    for (let i = 0; i < 5; i++) brick(g, -0.9 + i * 0.4, 0.75, -0.3, pick(TOY()), 2 + (i % 2), 1 + (i % 2), 0.06);
    return g;
  });

  // ---------- móveis ----------
  model('shelf', (o) => {
    const g = group();
    const w = 1.8, d = 0.4, h = 2.0;
    for (const s of [-1, 1]) B(g, 0.03, h, d, s * (w / 2 - 0.015), 0, 0, K.graphite);
    B(g, w, h, 0.015, 0, 0, -d / 2 + 0.008, K.white);
    const levels = [0, 0.48, 0.96, 1.44, 1.94];
    for (const y of levels) B(g, w - 0.06, 0.03, d - 0.02, 0, y, 0.005, K.wood);
    for (const y0 of levels.slice(0, 4)) {
      const y = y0 + 0.03;
      let x = -w / 2 + 0.06;
      while (x < w / 2 - 0.12) {
        if (o.fill === 'binders') {
          const t = 0.05 + Math.random() * 0.03, bh = 0.3 + Math.random() * 0.06;
          if (Math.random() < 0.12) { x += 0.12; continue; }
          B(g, t, bh, 0.28, x + t / 2, y, 0, pick([K.blue, K.red, K.gold, K.graphite, K.green]));
          x += t + 0.005;
        } else if (o.fill === 'boxes') {
          const bw = 0.3 + Math.random() * 0.14;
          if (x + bw > w / 2 - 0.05) break;
          B(g, bw, 0.22 + Math.random() * 0.12, 0.32, x + bw / 2, y, 0, K.kraft);
          x += bw + 0.04;
        } else if (o.fill === 'filament') {
          const spool = MT.cyl(g, 0.1, 0.1, 0.07, x + 0.1, y + 0.1, 0, pick(TOY()), { seg: 12 });
          spool.rotation.z = Math.PI / 2;
          spool.position.set(x + 0.04, y + 0.1, 0);
          x += 0.11;
        } else {
          // protótipos de brinquedo
          const s = 0.05 + Math.random() * 0.03;
          brick(g, x + s, y, (Math.random() - 0.5) * 0.12, pick(TOY()), 2, 2, s);
          x += s * 2 + 0.08;
        }
      }
    }
    if (o.minifig) {
      const fig = MT.minifig();
      fig.scale.setScalar(0.11);
      fig.position.set(0.55, 1.97, 0);
      g.add(fig);
    }
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Quadro branco (kanban, referências, planejamento) pendurado na parede
  model('board', (o) => {
    const g = group();
    const w = o.w || 3, h = o.h || 1.3;
    B(g, w + 0.06, h + 0.06, 0.03, 0, 0, 0, K.chrome);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MT.mat(0xffffff, { map: MT.screenTexture(o.kind || 'kanban', o.variant || 0), r: 0.35 }));
    face.position.set(0, h / 2 + 0.03, 0.017);
    g.add(face);
    B(g, w * 0.5, 0.025, 0.07, 0, -0.01, 0.035, K.chrome);
    for (let i = 0; i < 3; i++) MT.cyl(g, 0.01, 0.01, 0.12, -0.2 + i * 0.05, 0.03, 0.05, pick([K.red, K.blue, K.green]), { seg: 6, cast: false }).rotation.z = Math.PI / 2;
    g.userData.back = 0.015;
    return g;
  });

  model('tv', (o) => {
    const g = group();
    const w = o.w || 1.6, h = o.h || 0.9;
    B(g, w + 0.04, h + 0.04, 0.05, 0, 0, 0, K.black);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: MT.screenTexture(o.kind || 'dashboard'), toneMapped: false }));
    scr.position.set(0, h / 2 + 0.02, 0.026);
    g.add(scr);
    g.userData.back = 0.025;
    return g;
  });

  model('sofa', () => {
    const g = group();
    const w = 2.1, d = 0.9;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.06, 0.08, 0.06, sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1), K.black);
    B(g, w, 0.25, d, 0, 0.08, 0, K.blue);
    for (const s of [-1, 1]) B(g, w / 2 - 0.2, 0.14, d - 0.26, s * (w / 4 - 0.04), 0.33, 0.1, K.blueDark);
    B(g, w, 0.48, 0.22, 0, 0.33, -d / 2 + 0.11, K.blue);
    for (const s of [-1, 1]) B(g, 0.16, 0.3, d, s * (w / 2 - 0.08), 0.33, 0, K.blue);
    B(g, 0.4, 0.36, 0.12, -0.6, 0.45, -0.2, K.red).rotation.set(-0.2, 0.15, 0);
    B(g, 0.4, 0.36, 0.12, 0.6, 0.45, -0.2, K.gold).rotation.set(-0.2, -0.15, 0);
    g.userData.colliders.push([-w / 2, w / 2, 0, 0.81, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  model('coffeeTable', () => {
    const g = group();
    B(g, 1.1, 0.04, 0.55, 0, 0.38, 0, K.wood);
    legs(g, 1.1, 0.55, 0.38);
    B(g, 0.24, 0.01, 0.3, -0.2, 0.42, 0, K.red).rotation.y = 0.3;
    B(g, 0.24, 0.01, 0.3, -0.12, 0.43, 0.04, K.paper).rotation.y = -0.1;
    brick(g, 0.3, 0.42, 0, K.yellow, 2, 2, 0.06);
    g.userData.colliders.push([-0.55, 0.55, 0, 0.42, -0.28, 0.28]);
    return g;
  });

  model('plant', () => {
    const g = group();
    MT.cyl(g, 0.22, 0.17, 0.42, 0, 0, 0, K.pot, { seg: 16 });
    MT.cyl(g, 0.2, 0.2, 0.02, 0, 0.4, 0, K.soil, { seg: 16 });
    leafGeo = leafGeo || new THREE.IcosahedronGeometry(0.2, 0);
    for (let i = 0; i < 8; i++) {
      const leaf = new THREE.Mesh(leafGeo, i % 2 ? K.leaf : K.leaf2);
      const a = Math.random() * Math.PI * 2, r = i ? 0.12 + Math.random() * 0.1 : 0;
      leaf.position.set(Math.cos(a) * r, 0.62 + i * 0.09, Math.sin(a) * r);
      leaf.scale.set(1, 1.3, 1).multiplyScalar(0.8 + Math.random() * 0.4);
      leaf.castShadow = true;
      g.add(leaf);
    }
    g.userData.colliders.push([-0.25, 0.25, 0, 1.4, -0.25, 0.25]);
    return g;
  });

  // Copiadora/impressora de rede
  model('copier', () => {
    const g = group();
    B(g, 0.62, 0.9, 0.6, 0, 0, 0, K.white);
    B(g, 0.62, 0.12, 0.6, 0, 0.9, 0, K.graphite);
    for (let i = 0; i < 3; i++) B(g, 0.56, 0.006, 0.01, 0, 0.18 + i * 0.22, 0.301, K.graphite);
    B(g, 0.2, 0.08, 0.12, 0.18, 1.02, 0.18, K.black);
    B(g, 0.14, 0.004, 0.08, 0.18, 1.1, 0.18, K.led);
    B(g, 0.36, 0.03, 0.26, -0.08, 0.66, 0.35, K.graphite);
    B(g, 0.3, 0.012, 0.22, -0.08, 0.69, 0.35, K.paper);
    g.userData.colliders.push([-0.31, 0.31, 0, 1.12, -0.3, 0.48]);
    g.userData.back = 0.3;
    return g;
  });

  model('cooler', () => {
    const g = group();
    B(g, 0.32, 0.95, 0.32, 0, 0, 0, K.white);
    B(g, 0.05, 0.05, 0.04, -0.06, 0.78, 0.17, K.blue);
    B(g, 0.05, 0.05, 0.04, 0.06, 0.78, 0.17, K.red);
    MT.cyl(g, 0.13, 0.13, 0.42, 0, 0.95, 0, K.water, { seg: 18 });
    MT.cyl(g, 0.05, 0.05, 0.03, 0, 1.37, 0, K.blue, { seg: 12 });
    g.userData.colliders.push([-0.16, 0.16, 0, 1.4, -0.16, 0.16]);
    g.userData.back = 0.16;
    return g;
  });

  // ---------- Suporte ----------
  let rackTex = null;
  model('racks', (o) => {
    const g = group();
    const n = o.n || 4, rw = 0.6, gap = 0.02, d = 1.0, h = 2.0;
    rackTex = rackTex || [0, 1].map(rackTextures);
    const body = MT.mat(0x1c1f24, { r: 0.5, m: 0.4 });
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * (rw + gap);
      B(g, rw, h, d, x, 0, 0, body);
      const t = rackTex[i % 2];
      const front = new THREE.Mesh(new THREE.PlaneGeometry(rw - 0.06, h - 0.12), t.panel);
      front.position.set(x, h / 2, d / 2 + 0.002);
      g.add(front);
      const leds = new THREE.Mesh(new THREE.PlaneGeometry(rw - 0.06, h - 0.12), t.leds);
      leds.position.set(x, h / 2, d / 2 + 0.004);
      leds.userData.keep = true;
      g.add(leds);
      B(g, rw - 0.02, 0.04, d - 0.02, x, h, 0, K.graphite);
    }
    // cabos saindo pelo topo
    for (let i = 0; i < n; i++) MT.cyl(g, 0.02, 0.02, 0.9, (i - (n - 1) / 2) * (rw + gap) + 0.15, h, -0.3, K.blue, { seg: 6 });
    const W = n * (rw + gap);
    g.userData.colliders.push([-W / 2, W / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Frente do rack (servidores) + camada de LEDs que pisca
  function rackTextures(variant) {
    const W = 128, H = 420, units = 20, uh = H / units;
    const spots = [];
    const panel = MT.canvasTexture(W, H, (g) => {
      g.fillStyle = '#16181c';
      g.fillRect(0, 0, W, H);
      for (let u = 0; u < units; u++) {
        if ((u + variant) % 7 === 3) continue; // vão vazio
        const y = u * uh;
        g.fillStyle = u % 5 === 0 ? '#2b3038' : '#23272e';
        g.fillRect(4, y + 1, W - 8, uh - 2);
        g.fillStyle = '#121418';
        for (let k = 0; k < 9; k++) g.fillRect(40 + k * 8, y + 5, 4, uh - 10);
        spots.push([12, y + uh / 2], [22, y + uh / 2]);
        if (u % 3 === variant) spots.push([W - 14, y + uh / 2]);
      }
    });
    const ledCanvas = document.createElement('canvas');
    ledCanvas.width = W;
    ledCanvas.height = H;
    const lg = ledCanvas.getContext('2d');
    const colors = ['#5dff8a', '#5dff8a', '#5dff8a', '#ffb347', '#6fb6ff'];
    const leds = new THREE.CanvasTexture(ledCanvas);
    leds.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({ map: leds, transparent: true, toneMapped: false, depthWrite: false });
    // a cada 0,2 s alguns LEDs mudam de estado (atividade de disco e rede)
    let acc = 0;
    const on = spots.map(() => Math.random() < 0.7);
    const draw = () => {
      lg.clearRect(0, 0, W, H);
      spots.forEach(([x, y], i) => {
        if (!on[i]) return;
        lg.fillStyle = colors[i % colors.length];
        lg.fillRect(x - 2.5, y - 2, 5, 4);
      });
      leds.needsUpdate = true;
    };
    draw();
    MT.animators.push((dt) => {
      acc += dt;
      if (acc < 0.2) return;
      acc = 0;
      for (let i = 0; i < on.length; i++) if (Math.random() < 0.18) on[i] = !on[i];
      draw();
    });
    return { panel: MT.mat(0xffffff, { map: panel, r: 0.6, m: 0.3 }), leds: mat };
  }

  model('helpdesk', () => {
    const g = group();
    const w = 2.4, d = 0.6, h = 1.05;
    B(g, w, h - 0.04, d, 0, 0, 0, K.red);
    const sign = MT.canvasTexture(1024, 256, (c, W, H) => {
      c.fillStyle = '#a3161c';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#d9a441';
      c.lineWidth = 8;
      c.strokeRect(14, 14, W - 28, H - 28);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#f4ead2';
      c.font = `400 92px ${MT.FONTS.display}`;
      c.fillText('SUPORTE TI', W / 2, 108);
      c.font = `600 44px ${MT.FONTS.label}`;
      c.fillStyle = '#f4d27a';
      c.fillText('ABRA SEU CHAMADO AQUI', W / 2, 192);
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, (w - 0.2) / 4), MT.mat(0xffffff, { map: sign, r: 0.6 }));
    face.position.set(0, 0.55, d / 2 + 0.003);
    g.add(face);
    B(g, w + 0.06, 0.04, d + 0.1, 0, h - 0.04, 0.03, K.wood);
    MT.cyl(g, 0.06, 0.07, 0.02, 0.8, h, 0.1, K.graphite, { seg: 14 });
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.gold);
    bell.position.set(0.8, h + 0.02, 0.1);
    g.add(bell);
    B(g, 0.3, 0.01, 0.22, -0.5, h, 0.05, K.paper).rotation.y = 0.2;
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2 + 0.08]);
    g.userData.back = d / 2;
    return g;
  });

  model('repairBench', () => {
    const g = group();
    const w = 2.4, d = 0.75, h = 0.9;
    B(g, w, 0.05, d, 0, h - 0.05, 0, K.woodDark);
    legs(g, w, d, h - 0.05);
    B(g, w - 0.1, 0.03, d - 0.1, 0, 0.2, 0, K.graphite);
    // painel de ferramentas na parede
    B(g, w, 0.9, 0.02, 0, h + 0.3, -d / 2 + 0.01, K.kraft);
    for (let i = 0; i < 9; i++) B(g, 0.03, 0.18 + (i % 3) * 0.06, 0.02, -0.95 + i * 0.24, h + 0.6, -d / 2 + 0.03, pick([K.red, K.graphite, K.yellow, K.chrome]));
    // notebook aberto mostrando os servidores
    const nb = new THREE.Group();
    nb.position.set(-0.6, h, 0.05);
    nb.rotation.y = 0.15;
    g.add(nb);
    B(nb, 0.36, 0.018, 0.25, 0, 0, 0, K.graphite);
    const lid = new THREE.Group();
    lid.position.set(0, 0.018, -0.125);
    lid.rotation.x = -0.3;
    nb.add(lid);
    B(lid, 0.36, 0.24, 0.01, 0, 0, 0, K.graphite);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), new THREE.MeshBasicMaterial({ map: MT.screenTexture('infra', 1), toneMapped: false }));
    scr.position.set(0, 0.12, 0.006);
    lid.add(scr);
    // gabinete aberto, placas e caixa de ferramentas
    B(g, 0.2, 0.42, 0.42, 0.25, h, -0.05, K.black);
    B(g, 0.16, 0.3, 0.005, 0.25, h + 0.05, 0.165, K.pcb);
    for (let i = 0; i < 3; i++) B(g, 0.12, 0.01, 0.08, 0.6 + i * 0.05, h + i * 0.01, 0.15 - i * 0.04, K.pcb);
    B(g, 0.4, 0.18, 0.2, 0.85, h, -0.1, K.red);
    B(g, 0.42, 0.03, 0.04, 0.85, h + 0.18, -0.1, K.graphite);
    // caixas embaixo
    B(g, 0.5, 0.3, 0.4, -0.6, 0.23, 0, K.kraft);
    B(g, 0.4, 0.25, 0.4, 0.4, 0.23, 0, K.kraft);
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // ---------- Modelagem 3D ----------
  model('printerBench', (o) => {
    const g = group();
    const w = o.w || 3.6, d = 0.8, h = 0.85;
    B(g, w, 0.05, d, 0, h - 0.05, 0, K.wood);
    legs(g, w, d, h - 0.05);
    B(g, w - 0.1, 0.03, d - 0.1, 0, 0.2, 0, K.graphite);
    const n = o.printers || 3;
    for (let i = 0; i < n; i++) printer(g, (i - (n - 1) / 2) * (w / n), h, -0.05, i);
    for (let i = 0; i < 6; i++) {
      const s = MT.cyl(g, 0.1, 0.1, 0.07, 0, 0, 0, pick(TOY()), { seg: 12 });
      s.rotation.z = Math.PI / 2;
      s.position.set(-w / 2 + 0.3 + i * 0.16, 0.33, 0.1);
    }
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Impressora 3D com cabeçote andando e a peça crescendo camada a camada
  function printer(g, x, y, z, i) {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    g.add(p);
    B(p, 0.46, 0.07, 0.46, 0, 0, 0, K.black);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(p, 0.03, 0.52, 0.03, sx * 0.21, 0.07, sz * 0.21, K.black);
    B(p, 0.46, 0.03, 0.46, 0, 0.59, 0, K.black);
    B(p, 0.32, 0.01, 0.32, 0, 0.13, 0, K.chrome);
    const spool = MT.cyl(p, 0.09, 0.09, 0.06, 0, 0, 0, pick(TOY()), { seg: 16 });
    spool.rotation.x = Math.PI / 2;
    spool.position.set(0, 0.72, -0.18);
    const gantry = B(p, 0.42, 0.025, 0.025, 0, 0, 0, K.chrome);
    const head = B(p, 0.07, 0.07, 0.06, 0, 0, 0, K.red);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.14, 0);
    p.add(pivot);
    const part = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.08), pick([K.yellow, K.blue, K.green, K.red]));
    part.position.y = 0.045;
    pivot.add(part);
    for (const m of [gantry, head, part]) m.userData.keep = true;
    const phase = i * 1.7 + Math.random();
    MT.animators.push((dt, pl, t) => {
      const k = t * 1.6 + phase;
      const prog = ((t * 0.04 + phase * 0.13) % 1) * 0.98 + 0.02;
      pivot.scale.y = prog;
      const top = 0.14 + 0.09 * prog;
      head.position.set(Math.sin(k * 3.1) * 0.05, top + 0.01, Math.sin(k * 2.3) * 0.035);
      gantry.position.set(0, top + 0.045, head.position.z);
    });
  }
})();
