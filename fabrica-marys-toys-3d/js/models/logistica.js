/*
 * Modelos 3D da logística, feitos com primitivas: estante porta-palete, pallet com caixas e empilhadeira.
 * Mesmo formato dos modelos de js/models/office.js: grupo com origem no chão, frente para +z,
 * userData.back (fundo, para encostar na parede) e userData.colliders (caixas locais).
 */
(function () {
  const MT = (window.MT = window.MT || {});
  MT.MODELS = MT.MODELS || {};

  let K = null;
  const mats = () => K || (K = {
    upright: MT.mat(0x1f4fa0, { r: 0.5, m: 0.4 }),  // montante azul
    beam: MT.mat(0xe36414, { r: 0.45, m: 0.3 }),    // longarina laranja
    deck: MT.mat(0x9aa0a6, { r: 0.6, m: 0.5 }),
    wood: MT.mat(0xb48a57, { r: 0.95 }),
    kraft: MT.mat(0xb08a5a, { r: 0.9 }),
    kraft2: MT.mat(0xc49a66, { r: 0.9 }),
    kraft3: MT.mat(0x9c7848, { r: 0.9 }),
    label: MT.mat(0xf6f3ea, { r: 0.8 }),
    wrap: MT.mat(0xe8eef2, { r: 0.2, t: true, op: 0.35 }),
    yellow: MT.mat(0xf2b705, { r: 0.45, m: 0.2 }),
    dark: MT.mat(0x1f2124, { r: 0.6 }),
    steel: MT.mat(0x6b7076, { r: 0.4, m: 0.7 }),
    seat: MT.mat(0x2b2f36, { r: 0.9 }),
  });
  const B = (g, w, h, d, x, y, z, m) => MT.box(g, w, h, d, x, y, z, m, { collide: false });
  // peças pequenas e numerosas (caixas, pallets): sem sombra, que dentro das estantes nem aparece
  const Bs = (g, w, h, d, x, y, z, m) => MT.box(g, w, h, d, x, y, z, m, { collide: false, cast: false });
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const group = () => {
    const g = new THREE.Group();
    g.userData.colliders = [];
    return g;
  };
  const model = (name, fn) => { MT.MODELS[name] = (o = {}) => fn(o, mats()); };

  // Pallet de madeira 1,2 × 1,0 m com caixas empilhadas (até `layers` camadas); wrap = filme plástico em volta
  function pallet(g, x, y, z, layers, wrap, maxH) {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    g.add(p);
    for (const sz of [-0.45, 0, 0.45]) Bs(p, 1.2, 0.1, 0.1, 0, 0, sz, K.wood);
    for (const sx of [-0.55, -0.27, 0, 0.27, 0.55]) Bs(p, 0.1, 0.03, 1.0, sx, 0.1, 0, K.wood);
    const bh = 0.36;
    const n = Math.max(0, Math.min(layers, Math.floor(((maxH || 9) - 0.14) / bh)));
    for (let l = 0; l < n; l++) {
      for (const bx of [-0.3, 0.3]) for (const bz of [-0.25, 0.25]) {
        if (l === n - 1 && Math.random() < 0.25) continue; // camada de cima incompleta
        const box = Bs(p, 0.58, bh - 0.01, 0.48, bx, 0.13 + l * bh, bz, pick([K.kraft, K.kraft2, K.kraft3]));
        box.rotation.y = (Math.random() - 0.5) * 0.04;
        if (bz > 0 && Math.random() < 0.6) Bs(p, 0.16, 0.1, 0.005, bx + 0.1, 0.13 + l * bh + 0.12, bz + 0.243, K.label);
      }
    }
    if (wrap && n) Bs(p, 1.22, n * bh + 0.05, 1.02, 0, 0.12, 0, K.wrap);
    return p;
  }

  // Estante porta-palete: montantes azuis, longarinas laranja, 3 níveis; `bays` vãos de 2,7 m
  model('palletRack', (o) => {
    const g = group();
    const bays = o.bays || 3, bw = 2.7, d = 1.1, h = 4.6, W = bays * bw;
    const levels = [0, 1.7, 3.3];
    for (let k = 0; k <= bays; k++) {
      const x = -W / 2 + k * bw;
      for (const sz of [-1, 1]) B(g, 0.09, h, 0.09, x, 0, sz * (d / 2 - 0.045), K.upright);
      // travamento em X na lateral
      for (let y = 0.3; y < h - 0.6; y += 1.2) {
        const brace = B(g, 0.03, 1.25, 0.03, x, y, 0, K.upright);
        brace.rotation.x = 0.73 * (Math.round(y / 1.2) % 2 ? 1 : -1);
      }
    }
    for (const y of levels.slice(1)) {
      for (const sz of [-1, 1]) B(g, W, 0.12, 0.06, 0, y, sz * (d / 2 - 0.03), K.beam);
      B(g, W - 0.1, 0.02, d - 0.1, 0, y + 0.1, 0, K.deck);
    }
    const fill = o.fill === undefined ? 0.8 : o.fill;
    levels.forEach((y, li) => {
      const top = li < levels.length - 1 ? levels[li + 1] - y - 0.25 : 1.3;
      for (let b = 0; b < bays; b++) for (const s of [-0.65, 0.65]) {
        if (Math.random() > fill) continue;
        pallet(g, -W / 2 + bw * (b + 0.5) + s, y + (li ? 0.12 : 0), 0, 1 + Math.floor(Math.random() * 3), o.wrap && Math.random() < 0.5, top);
      }
    });
    g.userData.colliders.push([-W / 2, W / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Pallet solto no chão (recebido ou pronto para expedir)
  model('pallet', (o) => {
    const g = group();
    pallet(g, 0, 0, 0, o.layers || 3, !!o.wrap);
    g.userData.colliders.push([-0.6, 0.6, 0, 0.14 + (o.layers || 3) * 0.36, -0.5, 0.5]);
    return g;
  });

  // Empilhadeira com os garfos para +z
  model('forklift', (o) => {
    const g = group();
    const wheel = (x, z, r, w) => {
      const c = MT.cyl(g, r, r, w, 0, 0, 0, K.dark, { seg: 14 });
      c.rotation.z = Math.PI / 2;
      c.position.set(x, r, z);
    };
    B(g, 1.1, 0.9, 1.7, 0, 0.25, -0.2, K.yellow);          // chassi
    B(g, 1.1, 0.55, 0.45, 0, 0.6, -1.05, K.dark);          // contrapeso
    B(g, 0.5, 0.12, 0.45, 0, 1.15, -0.45, K.seat);         // assento
    B(g, 0.5, 0.5, 0.08, 0, 1.25, -0.68, K.seat);          // encosto
    MT.cyl(g, 0.16, 0.16, 0.04, 0, 1.45, 0.25, K.dark, { seg: 16 }).rotation.x = -0.9; // volante
    for (const sx of [-0.5, 0.5]) for (const sz of [-0.75, 0.45]) B(g, 0.06, 1.15, 0.06, sx, 1.15, sz, K.dark); // colunas da proteção
    B(g, 1.06, 0.05, 1.3, 0, 2.28, -0.15, K.dark);         // teto de proteção
    for (const sx of [-0.35, 0.35]) B(g, 0.08, 2.4, 0.1, sx, 0.1, 0.72, K.steel); // torre
    B(g, 0.78, 0.1, 0.08, 0, 0.35, 0.8, K.steel);          // carro dos garfos
    for (const sx of [-0.25, 0.25]) B(g, 0.1, 0.05, 1.1, sx, 0.12, 1.33, K.steel); // garfos
    wheel(-0.5, 0.35, 0.3, 0.22); wheel(0.5, 0.35, 0.3, 0.22);
    wheel(-0.48, -0.85, 0.24, 0.2); wheel(0.48, -0.85, 0.24, 0.2);
    if (o.load) pallet(g, 0, 0.17, 1.35, 2, false);
    g.userData.colliders.push([-0.6, 0.6, 0, 2.3, -1.3, 1.9]);
    return g;
  });
})();
