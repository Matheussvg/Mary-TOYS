/*
 * Modelos 3D das salas da Produção (Metrologia e Qualidade; Laminação, Refugo e Sucata; Manutenção e Segurança),
 * feitos com primitivas. Mesmo formato de js/models/office.js: grupo com origem no chão, frente para +z,
 * userData.back (fundo, para encostar na parede) e userData.colliders (caixas locais).
 * As peças que se mexem ficam num grupo com userData.keep (o MT.bake não as funde) e só animam com o jogador por perto.
 */
(function () {
  const MT = (window.MT = window.MT || {});
  MT.MODELS = MT.MODELS || {};

  let K = null;
  const mats = () => K || (K = {
    granite: MT.mat(0x2e2f33, { r: 0.3 }),
    steel: MT.mat(0x9aa0a6, { r: 0.4, m: 0.6 }),
    chrome: MT.mat(0xc8ccd2, { r: 0.18, m: 0.95, env: 1 }),
    machine: MT.mat(0xd9dcd6, { r: 0.55, m: 0.2 }),  // carenagem cinza-claro
    machine2: MT.mat(0x2f5d8a, { r: 0.5, m: 0.2 }),  // azul das máquinas
    dark: MT.mat(0x1f2124, { r: 0.6 }),
    yellow: MT.mat(0xf2b705, { r: 0.45, m: 0.1 }),
    red: MT.mat(0xc0161d, { r: 0.45, m: 0.15 }),
    green: MT.mat(0x1f8a4c, { r: 0.6 }),
    blue: MT.mat(0x2a4b9b, { r: 0.6 }),
    orange: MT.mat(0xe36414, { r: 0.5 }),
    white: MT.mat(0xf1efe8, { r: 0.6 }),
    woodDark: MT.mat(0x7a5638, { r: 0.65 }),
    sack: MT.mat(0xe7e3d6, { r: 0.95 }),
    film: MT.mat(0xc23a2e, { r: 0.3 }),
    glass: MT.mat(0xcfe3ea, { r: 0.05, t: true, op: 0.22 }),
    ledG: MT.mat(0x5dff8a, { e: 0x5dff8a, ei: 1.5 }),
    ledR: MT.mat(0xff5a4f, { e: 0xff5a4f, ei: 1.5 }),
    lamp: MT.mat(0xfff6d8, { e: 0xfff6d8, ei: 1.2 }),
    // fita zebrada do piso em volta das máquinas
    tape: MT.mat(0xffffff, { r: 0.7, map: MT.canvasTexture(64, 64, (g, w, h) => {
      g.fillStyle = '#f2b705';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1f2124';
      for (let k = -1; k < 2; k++) {
        g.beginPath();
        g.moveTo(k * w, h); g.lineTo(k * w + w / 2, h); g.lineTo(k * w + w, 0); g.lineTo(k * w + w / 2, 0);
        g.fill();
      }
    }, { repeat: [1, 1] }) }),
    // filme plástico saindo da laminadora (a textura corre com a máquina ligada)
    sheet: MT.mat(0xffffff, { r: 0.3, map: MT.canvasTexture(128, 64, (g, w, h) => {
      g.fillStyle = '#c23a2e';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 6; x < w; x += 32) g.fillRect(x, 0, 3, h);
    }, { repeat: [4, 1] }) }),
    // material moído (grãos coloridos)
    granules: MT.mat(0xffffff, { r: 0.8, map: MT.canvasTexture(128, 128, (g, w, h) => {
      g.fillStyle = '#8a8478';
      g.fillRect(0, 0, w, h);
      const cols = ['#c0161d', '#f4c51c', '#2a4b9b', '#1f6b3a', '#e86f1c', '#f6f3ea'];
      for (let i = 0; i < 900; i++) {
        g.fillStyle = cols[i % cols.length];
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
    }, { repeat: [2, 2] }) }),
  });
  const TOY = () => [K.red, K.yellow, K.blue, K.green, K.orange, K.white];

  const B = (g, w, h, d, x, y, z, m) => MT.box(g, w, h, d, x, y, z, m, { collide: false });
  const Bs = (g, w, h, d, x, y, z, m) => MT.box(g, w, h, d, x, y, z, m, { collide: false, cast: false });
  const C = (g, r, h, x, y, z, m, seg) => MT.cyl(g, r, r, h, x, y, z, m, { seg: seg || 16 });
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const group = () => {
    const g = new THREE.Group();
    g.userData.colliders = [];
    return g;
  };
  const model = (name, fn) => { MT.MODELS[name] = (o = {}) => fn(o, mats()); };

  // Cilindro deitado, centrado em (x, y, z), ao longo do eixo 'x' ou 'z'
  function rod(g, r, len, x, y, z, axis, m, seg) {
    const geo = new THREE.CylinderGeometry(r, r, len, seg || 18);
    if (axis === 'x') geo.rotateZ(Math.PI / 2);
    else geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  }

  function brick(g, x, y, z, mat, nx = 2, nz = 1, s = 0.04) {
    Bs(g, nx * s, s * 0.6, nz * s, x, y, z, mat);
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      MT.cyl(g, s * 0.3, s * 0.3, s * 0.18, x + (i - (nx - 1) / 2) * s, y + s * 0.6, z + (k - (nz - 1) / 2) * s, mat, { seg: 6, cast: false });
    }
  }

  // Faixa zebrada no piso em volta de uma máquina (retângulo w × d centrado em cx, cz)
  function floorTape(g, w, d, cx = 0, cz = 0) {
    const t = 0.08, o = { collide: false, cast: false, uvScale: 0.25 };
    MT.box(g, w, 0.01, t, cx, 0, cz - d / 2, K.tape, o);
    MT.box(g, w, 0.01, t, cx, 0, cz + d / 2, K.tape, o);
    MT.box(g, t, 0.01, d, cx - w / 2, 0, cz, K.tape, o);
    MT.box(g, t, 0.01, d, cx + w / 2, 0, cz, K.tape, o);
  }

  // Plaquinha com texto (identificação de máquinas, caçambas e armários)
  const plates = new Map();
  function plate(g, text, w, h, x, y, z, bg, fg) {
    const key = [text, bg, fg].join('|');
    if (!plates.has(key)) {
      const W = 512, H = Math.round(512 * h / w);
      plates.set(key, MT.mat(0xffffff, { r: 0.6, map: MT.canvasTexture(W, H, (c) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);
        c.strokeStyle = fg;
        c.lineWidth = H * 0.06;
        c.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16);
        c.fillStyle = fg;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        MT.fitFont(c, text, 700, Math.round(H * 0.5), MT.FONTS.label, W - H * 0.5);
        c.fillText(text, W / 2, H / 2 + H * 0.03);
      }) }));
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), plates.get(key));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }

  // Anima só com o jogador a menos de 30 m (ou na vista aérea)
  function animate(g, fn) {
    let wp = null;
    MT.animators.push((dt, player, t) => {
      if (!wp) wp = g.getWorldPosition(new THREE.Vector3());
      if (!player.drone.on && Math.hypot(player.pos.x - wp.x, player.pos.z - wp.z) > 30) return;
      fn(dt, t);
    });
  }

  // ---------- Metrologia e Qualidade ----------

  // Máquina de medição por coordenadas (tridimensional): ponte que corre sobre a mesa de granito, carro e apalpador
  model('cmm', () => {
    const g = group();
    const W = 1.8, D = 1.3, TOP = 0.85;
    B(g, W - 0.2, 0.5, D - 0.3, 0, 0.1, 0, K.machine2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 0.05, 0.1, sx * (W / 2 - 0.2), 0, sz * (D / 2 - 0.25), K.dark);
    B(g, W, 0.25, D, 0, 0.6, 0, K.granite);
    // peça sendo medida e o gabarito
    brick(g, 0.1, TOP, 0.05, K.yellow, 4, 2, 0.05);
    B(g, 0.3, 0.06, 0.2, W / 2 - 0.25, TOP, D / 2 - 0.15, K.dark); // joystick
    Bs(g, 0.03, 0.02, 0.03, W / 2 - 0.3, TOP + 0.06, D / 2 - 0.15, K.ledG);
    const bridge = new THREE.Group();
    bridge.userData.keep = true;
    g.add(bridge);
    for (const sx of [-1, 1]) B(bridge, 0.12, 1.15, 0.18, sx * (W / 2 - 0.1), TOP, 0, K.machine);
    B(bridge, W, 0.18, 0.22, 0, TOP + 1.15, 0, K.machine);
    B(bridge, W - 0.3, 0.03, 0.01, 0, TOP + 1.22, 0.115, K.chrome); // régua
    const car = new THREE.Group();
    car.position.y = TOP + 1.15;
    bridge.add(car);
    B(car, 0.26, 0.3, 0.32, 0, -0.05, 0, K.machine);
    const quill = new THREE.Group();
    car.add(quill);
    B(quill, 0.07, 0.75, 0.07, 0, -0.8, 0, K.chrome);
    B(quill, 0.09, 0.08, 0.09, 0, -0.88, 0, K.dark);
    C(quill, 0.006, 0.16, 0, -1.04, 0, K.chrome, 6);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), K.red);
    tip.position.y = -1.04;
    quill.add(tip);
    animate(g, (dt, t) => {
      bridge.position.z = Math.sin(t * 0.45) * 0.3;
      car.position.x = Math.sin(t * 0.6 + 1) * 0.45;
      quill.position.y = -0.06 * Math.max(0, Math.sin(t * 1.3));
    });
    floorTape(g, W + 1.0, D + 1.0);
    g.userData.colliders.push([-W / 2, W / 2, 0, 2.2, -D / 2, D / 2]);
    g.userData.back = D / 2;
    return g;
  });

  // Bancada de inspeção: manta antiestática, lupa com luz, paquímetro, micrômetro, traçador de altura e amostras
  model('inspectionBench', () => {
    const g = group();
    const w = 2.4, d = 0.8, h = 0.9;
    B(g, w, 0.05, d, 0, h - 0.05, 0, K.white);
    Bs(g, w - 0.2, 0.004, d - 0.15, 0, h, 0.02, K.green);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.05, h - 0.05, 0.05, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), K.steel);
    B(g, 0.5, 0.6, d - 0.1, w / 2 - 0.32, 0.2, 0, K.steel);
    for (let i = 0; i < 3; i++) Bs(g, 0.2, 0.015, 0.02, w / 2 - 0.32, 0.3 + i * 0.2, d / 2 - 0.04, K.dark);
    // lupa de bancada com luz
    C(g, 0.08, 0.03, -0.85, h, -0.25, K.dark);
    C(g, 0.012, 0.45, -0.85, h + 0.03, -0.25, K.steel, 8);
    rod(g, 0.012, 0.36, -0.85, h + 0.47, -0.07, 'z', K.steel, 8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 24), K.white);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-0.85, h + 0.45, 0.13);
    g.add(ring);
    const light = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 24), K.lamp); // anel de LED por baixo
    light.rotation.x = Math.PI / 2;
    light.position.set(-0.85, h + 0.43, 0.13);
    g.add(light);
    const lens = C(g, 0.09, 0.006, -0.85, h + 0.447, 0.13, K.glass, 20);
    lens.castShadow = false;
    // instrumentos
    Bs(g, 0.26, 0.008, 0.03, 0.05, h + 0.004, 0.22, K.chrome).rotation.y = 0.15;
    Bs(g, 0.03, 0.008, 0.07, -0.07, h + 0.004, 0.24, K.chrome).rotation.y = 0.15;
    Bs(g, 0.12, 0.05, 0.015, 0.35, h + 0.004, 0.2, K.orange);
    rod(g, 0.012, 0.1, 0.46, h + 0.03, 0.2, 'x', K.chrome, 8);
    B(g, 0.4, 0.06, 0.3, 0.55, h, -0.17, K.granite);
    C(g, 0.015, 0.42, 0.45, h + 0.06, -0.22, K.chrome, 8);
    Bs(g, 0.07, 0.05, 0.05, 0.47, h + 0.26, -0.2, K.dark);
    // amostras do lote: as reprovadas ficam na bandeja vermelha
    for (let i = 0; i < 8; i++) brick(g, -0.5 + i * 0.1, h + 0.004, -0.2, pick(TOY()), 2, 2, 0.04);
    Bs(g, 0.3, 0.03, 0.2, -0.35, h + 0.004, 0.18, K.red);
    for (let i = 0; i < 3; i++) brick(g, -0.43 + i * 0.08, h + 0.034, 0.18, pick(TOY()), 2, 1, 0.035);
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // ---------- Laminação, Refugo e Sucata ----------

  // Linha de laminação: extrusora com funil, matriz plana, calandra de 3 rolos, mesa de rolos e bobinadeira.
  // O comprimento fica em x; o filme corre de −x para +x.
  model('laminator', () => {
    const g = group();
    const Y = 0.95; // altura do filme
    // extrusora
    B(g, 1.1, 0.75, 0.5, -1.25, 0, 0, K.machine2);
    B(g, 0.3, 0.5, 0.45, -1.85, 0.7, 0, K.machine2); // redutor
    rod(g, 0.12, 1.0, -1.2, Y, 0, 'x', K.steel);
    for (let i = 0; i < 5; i++) rod(g, 0.14, 0.07, -1.6 + i * 0.2, Y, 0, 'x', K.dark);
    C(g, 0.06, 0.1, -1.5, Y + 0.1, 0, K.steel, 10);
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.08, 0.5, 4), K.machine);
    hopper.rotation.y = Math.PI / 4;
    hopper.position.set(-1.5, Y + 0.45, 0);
    hopper.castShadow = true;
    g.add(hopper);
    B(g, 0.16, 0.22, 1.25, -0.6, Y - 0.11, 0, K.steel); // matriz plana
    // calandra
    for (const s of [-1, 1]) B(g, 0.55, 1.75, 0.08, -0.15, 0, s * 0.72, K.machine2);
    B(g, 0.55, 0.08, 1.52, -0.15, 1.75, 0, K.machine2);
    for (const y of [Y - 0.17, Y + 0.19, Y + 0.55]) rod(g, 0.17, 1.36, -0.15, y, 0, 'z', K.chrome, 24);
    // engrenagens do lado de fora da calandra (giram com a máquina)
    const gears = [];
    for (const [y, r] of [[Y - 0.17, 0.2], [Y + 0.19, 0.2], [Y + 0.55, 0.2]]) {
      const gear = new THREE.Group();
      gear.position.set(-0.15, y, 0.8);
      gear.userData.keep = true;
      g.add(gear);
      rod(gear, r, 0.04, 0, 0, 0, 'z', K.yellow, 14);
      for (let k = 0; k < 3; k++) Bs(gear, r * 1.8, 0.04, 0.05, 0, -0.02, 0.01, K.dark).rotation.z = (k / 3) * Math.PI;
      gears.push(gear);
    }
    // filme, mesa de rolos e faca
    B(g, 1.95, 0.008, 1.2, 0.45, Y - 0.004, 0, K.sheet);
    for (const s of [-1, 1]) B(g, 1.2, Y - 0.08, 0.06, 0.75, 0, s * 0.66, K.steel);
    for (let i = 0; i < 6; i++) rod(g, 0.035, 1.3, 0.25 + i * 0.2, Y - 0.04, 0, 'z', K.chrome, 10);
    for (const s of [-1, 1]) B(g, 0.05, 0.3, 0.05, 1.25, Y, s * 0.66, K.steel);
    B(g, 0.06, 0.06, 1.38, 1.25, Y + 0.25, 0, K.red);
    // bobinadeira
    for (const s of [-1, 1]) B(g, 0.3, 0.95, 0.06, 1.7, 0, s * 0.68, K.machine2);
    const reel = new THREE.Group();
    reel.position.set(1.7, Y - 0.28, 0);
    reel.userData.keep = true;
    g.add(reel);
    rod(reel, 0.28, 1.2, 0, 0, 0, 'z', K.film, 28);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) Bs(reel, 0.5, 0.04, 0.01, 0, -0.02, s * 0.605, K.dark).rotation.z = (k / 3) * Math.PI;
    rod(reel, 0.05, 1.4, 0, 0, 0, 'z', K.steel, 10);
    // painel de comando na frente
    B(g, 0.08, 1.15, 0.08, 0.75, 0, 0.9, K.steel);
    B(g, 0.45, 0.32, 0.12, 0.75, 1.15, 0.9, K.machine);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.13), new THREE.MeshBasicMaterial({ map: MT.screenTexture('maquinas', 1), toneMapped: false }));
    scr.position.set(0.68, 1.33, 0.961);
    g.add(scr);
    Bs(g, 0.04, 0.04, 0.02, 0.89, 1.36, 0.96, K.ledG);
    Bs(g, 0.04, 0.04, 0.02, 0.89, 1.26, 0.96, K.ledR);
    plate(g, 'LAMINADORA 01', 0.6, 0.12, -1.25, 0.5, 0.252, '#2f5d8a', '#ffffff');
    animate(g, (dt) => {
      K.sheet.map.offset.x -= dt * 0.35;
      reel.rotation.z -= dt * 1.2;
      gears.forEach((gr, i) => { gr.rotation.z += dt * (i % 2 ? -1.6 : 1.6); });
    });
    floorTape(g, 4.6, 2.5, 0, 0.1);
    g.userData.colliders.push([-2.0, 2.0, 0, 1.85, -0.8, 0.8], [0.5, 1.0, 0, 1.5, 0.8, 1.0]);
    g.userData.back = 0.8;
    return g;
  });

  // Moinho de refugo: o refugo entra pelo funil e sai moído na gaveta, pronto para voltar às injetoras
  model('granulator', () => {
    const g = group();
    B(g, 1.0, 0.75, 0.8, 0, 0, 0, K.machine2);
    B(g, 0.7, 0.42, 0.04, 0, 0.12, 0.41, K.machine);
    B(g, 0.22, 0.03, 0.04, 0, 0.44, 0.45, K.chrome);
    B(g, 0.8, 0.45, 0.7, -0.05, 0.75, 0, K.machine);
    rod(g, 0.17, 0.4, 0.62, 0.55, 0, 'x', K.machine2);
    B(g, 0.08, 0.62, 0.5, 0.45, 0.6, 0, K.yellow); // proteção da correia
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.3, 0.55, 4), K.machine);
    hopper.rotation.y = Math.PI / 4;
    hopper.position.set(-0.05, 1.2 + 0.275, 0);
    hopper.castShadow = true;
    g.add(hopper);
    for (let i = 0; i < 4; i++) brick(g, -0.2 + i * 0.12, 1.68, (i % 2) * 0.1 - 0.05, pick(TOY()), 2, 2, 0.05);
    plate(g, 'MOINHO DE REFUGO', 0.62, 0.12, -0.05, 1.0, 0.352, '#2f5d8a', '#ffffff');
    Bs(g, 0.04, 0.04, 0.02, 0.3, 1.08, 0.355, K.ledG);
    floorTape(g, 2.0, 1.6, 0.1, 0);
    g.userData.colliders.push([-0.55, 0.85, 0, 1.75, -0.45, 0.45]);
    g.userData.back = 0.45;
    return g;
  });

  // Contentor aberto com garfo para empilhadeira: refugo (peças com defeito), sucata ou material moído
  const BIN = {
    refugo: ['REFUGO', 0xc0161d, '#c0161d'],
    sucata: ['SUCATA', 0x6b7076, '#4b5056'],
    moido: ['MOÍDO P/ REUSO', 0x1f6b3a, '#1f6b3a'],
  };
  model('scrapBin', (o) => {
    const g = group();
    const [text, color, css] = BIN[o.kind] || BIN.refugo;
    const body = MT.mat(color, { r: 0.6, m: 0.2 });
    const w = 1.1, d = 0.9, h = 0.85;
    for (const s of [-1, 1]) B(g, 0.12, 0.12, d, s * 0.35, 0, 0, K.dark);
    B(g, w, 0.05, d, 0, 0.12, 0, body);
    for (const s of [-1, 1]) B(g, 0.05, h - 0.12, d, s * (w / 2 - 0.025), 0.12, 0, body);
    for (const s of [-1, 1]) B(g, w - 0.1, h - 0.12, 0.05, 0, 0.12, s * (d / 2 - 0.025), body);
    if (o.kind === 'moido') {
      Bs(g, w - 0.1, 0.5, d - 0.1, 0, 0.17, 0, K.granules);
    } else if (o.kind === 'sucata') {
      for (let i = 0; i < 14; i++) {
        const p = Bs(g, 0.1 + Math.random() * 0.25, 0.03 + Math.random() * 0.06, 0.06 + Math.random() * 0.2, (Math.random() - 0.5) * 0.7, 0.45 + Math.random() * 0.2, (Math.random() - 0.5) * 0.55, pick([K.steel, K.chrome, K.dark]));
        p.rotation.set(Math.random() - 0.5, Math.random() * 3, Math.random() - 0.5);
      }
      Bs(g, w - 0.1, 0.3, d - 0.1, 0, 0.17, 0, K.dark);
    } else {
      Bs(g, w - 0.1, 0.4, d - 0.1, 0, 0.17, 0, K.granules);
      for (let i = 0; i < 14; i++) {
        const b = new THREE.Group();
        b.position.set((Math.random() - 0.5) * 0.75, 0.57 + Math.random() * 0.08, (Math.random() - 0.5) * 0.6);
        b.rotation.set(Math.random() - 0.5, Math.random() * 3, Math.random() - 0.5);
        g.add(b);
        brick(b, 0, 0, 0, pick(TOY()), 2 + (i % 2) * 2, 2, 0.05);
      }
    }
    plate(g, text, 0.8, 0.2, 0, 0.55, d / 2 + 0.003, css, '#ffffff');
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Big bag de material moído sobre pallet
  model('bigBag', (o) => {
    const g = group();
    if (MT.MODELS.pallet) g.add(MT.MODELS.pallet({ layers: 0 }));
    B(g, 1.0, 0.95, 0.92, 0, 0.14, 0, K.sack);
    Bs(g, 0.9, 0.02, 0.82, 0, 1.08, 0, K.granules);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bs(g, 0.06, 0.22, 0.02, sx * 0.4, 1.06, sz * 0.465, K.sack);
    plate(g, o.label || 'MOÍDO PP · 500 KG', 0.7, 0.16, 0, 0.7, 0.463, '#e7e3d6', '#2a4b9b');
    g.userData.colliders.push([-0.6, 0.6, 0, 1.2, -0.5, 0.5]);
    return g;
  });

  // ---------- Manutenção e Segurança do Trabalho ----------

  // Bancada de manutenção: morsa, esmeril, painel de ferramentas e gaveteiro
  model('toolBench', () => {
    const g = group();
    const w = 2.4, d = 0.75, h = 0.9;
    B(g, w, 0.05, d, 0, h - 0.05, 0, K.woodDark);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.05, h - 0.05, 0.05, sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), K.steel);
    B(g, w - 0.1, 0.03, d - 0.1, 0, 0.16, 0, K.steel);
    B(g, 0.6, 0.66, d - 0.12, w / 2 - 0.38, 0.19, 0, K.red);
    for (let i = 0; i < 4; i++) Bs(g, 0.3, 0.015, 0.02, w / 2 - 0.38, 0.32 + i * 0.15, d / 2 - 0.05, K.chrome);
    // painel perfurado com as ferramentas
    B(g, w, 1.0, 0.03, 0, h + 0.25, -d / 2 + 0.015, K.machine);
    const z = -d / 2 + 0.04;
    for (let i = 0; i < 7; i++) Bs(g, 0.025, 0.18 + (i % 4) * 0.04, 0.015, -1.0 + i * 0.12, h + 0.6, z, K.chrome);
    Bs(g, 0.03, 0.3, 0.02, 0.0, h + 0.5, z, K.woodDark);
    Bs(g, 0.14, 0.05, 0.04, 0.0, h + 0.8, z, K.dark);
    for (let i = 0; i < 5; i++) {
      Bs(g, 0.015, 0.12, 0.015, 0.25 + i * 0.08, h + 0.62, z, K.chrome);
      Bs(g, 0.035, 0.09, 0.035, 0.25 + i * 0.08, h + 0.74, z, [K.red, K.yellow, K.blue, K.orange, K.green][i]);
    }
    Bs(g, 0.45, 0.12, 0.01, 0.85, h + 0.75, z, K.steel); // serra
    Bs(g, 0.06, 0.16, 0.03, 0.62, h + 0.73, z, K.woodDark);
    // morsa
    B(g, 0.18, 0.1, 0.22, -w / 2 + 0.22, h, 0.12, K.machine2);
    for (const s of [-1, 1]) B(g, 0.2, 0.1, 0.04, -w / 2 + 0.22, h + 0.1, 0.12 + s * 0.05, K.machine2);
    rod(g, 0.012, 0.22, -w / 2 + 0.22, h + 0.13, 0.3, 'z', K.chrome, 8);
    // esmeril
    rod(g, 0.07, 0.22, 0.75, h + 0.12, -0.1, 'x', K.machine2);
    for (const s of [-1, 1]) rod(g, 0.09, 0.03, 0.75 + s * 0.15, h + 0.12, -0.1, 'x', K.granite);
    B(g, 0.12, 0.05, 0.14, 0.75, h, -0.1, K.machine2);
    // peças em manutenção: engrenagem e bico da injetora, e o óleo
    C(g, 0.11, 0.04, -0.35, h, 0.12, K.steel, 12);
    rod(g, 0.03, 0.22, -0.05, h + 0.03, 0.15, 'x', K.chrome, 10);
    C(g, 0.05, 0.14, 0.3, h, 0.2, K.yellow, 12);
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Carrinho de ferramentas vermelho
  model('toolChest', () => {
    const g = group();
    const w = 0.75, d = 0.48;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 0.04, 0.1, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), K.dark, 10);
    B(g, w, 0.85, d, 0, 0.1, 0, K.red);
    for (let i = 0; i < 6; i++) {
      Bs(g, w - 0.06, 0.008, 0.01, 0, 0.18 + i * 0.13, d / 2 + 0.003, K.dark);
      Bs(g, w - 0.24, 0.015, 0.02, 0, 0.23 + i * 0.13, d / 2 + 0.01, K.chrome);
    }
    B(g, w, 0.03, d, 0, 0.95, 0, K.dark);
    B(g, w - 0.04, 0.34, d - 0.08, 0, 0.98, -0.02, K.red);
    Bs(g, w - 0.24, 0.015, 0.02, 0, 1.25, d / 2 - 0.05, K.chrome);
    rod(g, 0.015, d, w / 2 + 0.04, 0.85, 0, 'z', K.chrome, 8);
    g.userData.colliders.push([-w / 2, w / 2 + 0.06, 0, 1.32, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Armário de EPI com portas de vidro: capacetes, abafadores, óculos, luvas, coletes e botinas
  let helmetGeo = null;
  model('epiCabinet', () => {
    const g = group();
    const w = 1.5, d = 0.5, h = 2.0;
    B(g, w, h, 0.03, 0, 0, -d / 2 + 0.015, K.machine);
    for (const s of [-1, 1]) B(g, 0.03, h, d, s * (w / 2 - 0.015), 0, 0, K.machine);
    B(g, w, 0.04, d, 0, h - 0.04, 0, K.machine);
    B(g, w, 0.08, d, 0, 0, 0, K.dark);
    for (const y of [0.6, 1.05, 1.5]) B(g, w - 0.06, 0.02, d - 0.05, 0, y, 0, K.machine);
    helmetGeo = helmetGeo || new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    [K.yellow, K.white, K.blue, K.yellow, K.green].forEach((m, i) => {
      const hm = new THREE.Mesh(helmetGeo, m);
      hm.position.set(-0.56 + i * 0.28, 1.52, 0);
      hm.castShadow = true;
      g.add(hm);
      C(g, 0.15, 0.01, -0.56 + i * 0.28, 1.52, 0.02, m, 16);
    });
    for (let i = 0; i < 4; i++) {
      const x = -0.55 + i * 0.36;
      for (const s of [-1, 1]) rod(g, 0.05, 0.04, x + s * 0.07, 1.14, 0, 'x', K.red, 12);
      Bs(g, 0.16, 0.02, 0.03, x, 1.2, 0, K.dark);
    }
    for (let i = 0; i < 3; i++) Bs(g, 0.14, 0.04, 0.05, 0.62 - i * 0.02, 1.07 + i * 0.04, 0.12, K.glass);
    for (let i = 0; i < 4; i++) Bs(g, 0.22, 0.05, 0.14, -0.5 + (i % 2) * 0.26, 0.62 + Math.floor(i / 2) * 0.05, 0.02, i % 2 ? K.blue : K.yellow);
    for (let i = 0; i < 3; i++) {
      Bs(g, 0.3, 0.06, 0.25, 0.3, 0.62 + i * 0.06, 0, K.orange);
      Bs(g, 0.3, 0.012, 0.252, 0.3, 0.65 + i * 0.06, 0, K.white);
    }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      Bs(g, 0.1, 0.16, 0.26, -0.5 + i * 0.32 + s * 0.06, 0.08, 0, K.dark);
    }
    // portas de vidro com moldura
    for (const s of [-1, 1]) {
      B(g, w / 2 - 0.03, h - 0.14, 0.01, s * w / 4, 0.08, d / 2 - 0.01, K.glass).castShadow = false;
      Bs(g, 0.025, 0.25, 0.03, s * 0.06, 0.95, d / 2, K.chrome);
    }
    plate(g, 'EPI · USO OBRIGATÓRIO', 1.2, 0.2, 0, h + 0.14, -d / 2 + 0.06, '#1f6b3a', '#ffffff');
    g.userData.colliders.push([-w / 2, w / 2, 0, h, -d / 2, d / 2]);
    g.userData.back = d / 2;
    return g;
  });

  // Extintor com sinalização na parede e demarcação no piso
  model('extinguisher', () => {
    const g = group();
    Bs(g, 0.8, 0.006, 0.8, 0, 0, 0.25, K.yellow);
    Bs(g, 0.68, 0.008, 0.68, 0, 0, 0.25, K.red);
    B(g, 0.12, 0.08, 0.04, 0, 0.62, -0.13, K.dark);
    C(g, 0.085, 0.5, 0, 0.12, -0.04, K.red, 18);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.red);
    dome.position.set(0, 0.62, -0.04);
    g.add(dome);
    B(g, 0.04, 0.08, 0.04, 0, 0.7, -0.04, K.dark);
    Bs(g, 0.12, 0.015, 0.03, 0.04, 0.77, -0.04, K.dark);
    Bs(g, 0.025, 0.4, 0.025, 0.08, 0.32, 0.03, K.dark);
    plate(g, 'EXTINTOR', 0.32, 0.12, 0, 1.75, -0.145, '#c0161d', '#ffffff');
    g.userData.colliders.push([-0.12, 0.12, 0, 0.8, -0.15, 0.06]);
    g.userData.back = 0.15;
    return g;
  });

  // Caixa de primeiros socorros na parede
  model('firstAid', () => {
    const g = group();
    B(g, 0.42, 0.36, 0.12, 0, 1.2, 0, K.white);
    Bs(g, 0.06, 0.2, 0.004, 0, 1.28, 0.061, K.green);
    Bs(g, 0.2, 0.06, 0.004, 0, 1.35, 0.062, K.green);
    plate(g, 'PRIMEIROS SOCORROS', 0.42, 0.08, 0, 1.64, -0.055, '#1f8a4c', '#ffffff');
    g.userData.back = 0.06;
    return g;
  });

  // Escada de abrir de alumínio
  model('ladder', () => {
    const g = group();
    const h = 1.8, a = 0.2;
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(0, 0, side * 0.35);
      leg.rotation.x = -side * a; // as duas pernas se encontram no topo
      g.add(leg);
      for (const s of [-1, 1]) B(leg, 0.04, h, 0.06, s * 0.25, 0, 0, K.steel);
      if (side < 0) for (let i = 1; i < 6; i++) B(leg, 0.5, 0.025, 0.08, 0, i * 0.3, 0, K.steel);
    }
    B(g, 0.55, 0.06, 0.2, 0, h * Math.cos(a) - 0.02, 0, K.orange);
    g.userData.colliders.push([-0.3, 0.3, 0, h, -0.4, 0.4]);
    return g;
  });
})();
