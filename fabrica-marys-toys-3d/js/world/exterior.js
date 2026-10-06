/* Entorno: céu, terreno, ruas, cercas, portaria, pátio de docas, caminhões e árvores. */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.buildExterior = function (scene) {
    const g = new THREE.Group();
    g.name = 'entorno';
    scene.add(g);

    // Céu de fim de tarde
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 32, 16),
      new THREE.MeshBasicMaterial({ map: MT.skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
    );
    sky.name = 'ceu';
    g.add(sky);
    MT.sky = sky;

    // Terreno
    const grassTex = MT.canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#3f5a2c';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        c.fillStyle = `hsl(${85 + Math.random() * 30}, ${30 + Math.random() * 20}%, ${18 + Math.random() * 16}%)`;
        c.fillRect(Math.random() * w, Math.random() * h, 2, 3);
      }
    }, { repeat: [120, 120] });
    const ground = MT.plane(g, 700, 700, MT.mat(0xffffff, { map: grassTex, r: 1 }), [0, 0, -40], [-Math.PI / 2, 0, 0]);
    ground.receiveShadow = true;

    const asphaltTex = MT.canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#34322f';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) {
        const l = 14 + Math.random() * 14;
        c.fillStyle = `hsl(30, 4%, ${l}%)`;
        c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
    });
    asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping;
    const asphalt = (x1, x2, z1, z2, y = 0.012) => {
      const t = asphaltTex.clone();
      t.needsUpdate = true;
      t.repeat.set((x2 - x1) / 8, (z2 - z1) / 8);
      MT.plane(g, x2 - x1, z2 - z1, MT.mat(0xffffff, { map: t, r: 0.95 }), [(x1 + x2) / 2, y, (z1 + z2) / 2], [-Math.PI / 2, 0, 0]);
    };
    const paving = MT.mat(0x9c958b, { r: 0.9 });
    const white = MT.mat(0xf2efe8, { r: 0.8 });
    const yellowPaint = MT.mat(0xe8b81a, { r: 0.8 });

    // Rua frontal, calçadas e faixa de pedestres
    asphalt(-200, 200, 11, 19);
    MT.box(g, 400, 0.12, 2.5, 0, 0, 9.75, paving, { cast: false });
    MT.box(g, 400, 0.12, 3, 0, 0, 20.5, paving, { cast: false });
    for (let x = -196; x < 200; x += 6) MT.plane(g, 3, 0.15, yellowPaint, [x, 0.02, 15], [-Math.PI / 2, 0, 0]);
    for (let x = -4.5; x <= 4.5; x += 1.2) MT.plane(g, 0.6, 7, white, [x, 0.022, 15], [-Math.PI / 2, 0, 0]);

    // Praça de entrada entre a fachada e a cerca
    MT.plane(g, 150, 8.5, paving, [0, 0.008, 4.25], [-Math.PI / 2, 0, 0]);

    // Via lateral para a portaria e o pátio dos fundos
    asphalt(63, 73, -120, 11);
    for (let z = -116; z < 8; z += 6) MT.plane(g, 0.15, 3, yellowPaint, [68, 0.02, z], [-Math.PI / 2, 0, 0]);
    asphalt(-46, 73, -120, -90.3);
    // Estacionamento (oeste)
    asphalt(-104, -64, -70, 0);
    for (let z = -66; z <= -4; z += 2.6) {
      MT.plane(g, 5, 0.12, white, [-100.5 + 2.5, 0.02, z], [-Math.PI / 2, 0, 0]);
      MT.plane(g, 5, 0.12, white, [-67.5 - 2.5, 0.02, z], [-Math.PI / 2, 0, 0]);
    }
    asphalt(-64, -60.3, -40, -30);

    // Cerca frontal com pilares e pontas douradas
    const fenceDark = MT.mat(0x2b2724, { r: 0.5, m: 0.5 });
    const gold = MT.mat(0xd9a441, { r: 0.3, m: 0.7 });
    const stone = MT.mat(0x5a5550, { r: 0.85 });
    const fence = (x1, x2, z) => {
      const len = x2 - x1;
      MT.box(g, len, 0.4, 0.4, (x1 + x2) / 2, 0, z, stone);
      MT.box(g, len, 0.06, 0.06, (x1 + x2) / 2, 1.35, z, fenceDark, { collide: false });
      MT.box(g, len, 0.06, 0.06, (x1 + x2) / 2, 0.6, z, fenceDark, { collide: false });
      MT.addCollider(x1, x2, 0, 1.6, z - 0.2, z + 0.2);
      const bars = Math.floor(len / 0.25);
      const bar = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 1.2, 0.035), fenceDark, bars);
      const m = new THREE.Matrix4();
      for (let i = 0; i < bars; i++) {
        m.makeTranslation(x1 + 0.125 + i * 0.25, 1.0, z);
        bar.setMatrixAt(i, m);
      }
      bar.castShadow = true;
      g.add(bar);
      for (let x = x1; x <= x2 + 0.01; x += 5) {
        MT.box(g, 0.55, 1.9, 0.55, Math.min(x, x2), 0, z, stone);
        MT.box(g, 0.65, 0.12, 0.65, Math.min(x, x2), 1.9, z, gold, { collide: false });
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), gold);
        ball.position.set(Math.min(x, x2), 2.15, z);
        g.add(ball);
      }
    };
    fence(-80, -9.5, 8.5);
    fence(9.5, 62.5, 8.5);
    fence(77, 110, 8.5);

    // Portaria: cabine + cancela automática
    const booth = MT.mat(0xa3161c, { r: 0.6 });
    MT.box(g, 3.2, 3, 3, 75.4, 0, 5.5, booth);
    MT.box(g, 3.6, 0.3, 3.4, 75.4, 3, 5.5, gold);
    MT.plane(g, 2.6, 1.2, MT.mat(0x9fc4d6, { r: 0.1, m: 0.2, e: 0xffd9a0, ei: 0.35 }), [75.4, 1.8, 7.02], [0, 0, 0]);
    const gateSign = MT.plainTextTexture(['ENTRADA', 'FUNCIONÁRIOS', 'E VISITANTES'], { w: 768, h: 512 });
    MT.plane(g, 2.4, 1.6, MT.mat(0xffffff, { map: gateSign, r: 0.6, e: 0x221100, ei: 0.3 }), [75.4, 3.95, 7.25], [0, 0, 0]);
    MT.box(g, 2.6, 2.1, 0.12, 75.4, 3.3, 7.1, gold, { collide: false });
    MT.box(g, 0.5, 1.1, 0.5, 73.6, 0, 8.5, MT.mat(0xe8b81a, { r: 0.6 }));
    const armPivot = new THREE.Group();
    armPivot.position.set(73.6, 1.0, 8.5);
    g.add(armPivot);
    const armTex = MT.canvasTexture(256, 16, (c, w, h) => {
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#c0161d' : '#f6f3ea'; c.fillRect((i * w) / 8, 0, w / 8, h); }
    });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 0.12), MT.mat(0xffffff, { map: armTex, r: 0.5 }));
    arm.position.x = -4.7;
    arm.castShadow = true;
    armPivot.add(arm);
    const armCol = MT.addCollider(64, 73.4, 0, 1.15, 8.3, 8.7);
    const gate = { t: 0 };
    MT.animators.push((dt, p) => {
      const near = Math.abs(p.pos.x - 68.5) < 7 && Math.abs(p.pos.z - 8.5) < 6;
      const target = near ? 1 : 0;
      gate.t += Math.sign(target - gate.t) * Math.min(Math.abs(target - gate.t), dt * 0.9);
      armPivot.rotation.z = -gate.t * (Math.PI / 2);
      armCol.enabled = gate.t < 0.6;
    });

    // Escadas das docas (pátio → plataforma) e caminhões encostados
    const L = MT.LAYOUT;
    for (const o of L.perimeter[1].openings) {
      MT.stairs(g, { x: o.c, z: -90.25, width: 4, run: 0.5, rise: 0.15, steps: 2, dir: '+z', base: 0, material: MT.mat(0xb9b1a6, { r: 0.8 }) });
      for (const sx of [-1, 1]) MT.box(g, 0.25, 0.5, 0.3, o.c + sx * 2.3, 0.6, -90.4, MT.mat(0x1d1a16));
      MT.truck(g, o.c, -97.5);
    }
    MT.truck(g, 50, -100);

    // Postes de rua
    const poleMat = MT.mat(0x2b2724, { r: 0.5, m: 0.6 });
    const headMat = MT.mat(0xfff0c8, { e: 0xffc070, ei: 2 });
    for (let x = -100; x <= 100; x += 20) {
      if (Math.abs(x) < 10) continue;
      MT.cyl(g, 0.08, 0.12, 6, x, 0, 10.6, poleMat, { collide: true, seg: 10 });
      MT.box(g, 1.2, 0.08, 0.1, x, 6, 10.6 + 0.0, poleMat, { collide: false });
      MT.box(g, 0.5, 0.18, 0.35, x, 5.85, 11.0, headMat, { collide: false });
    }

    MT.buildTrees(g);

    // Limites do terreno
    const lim = 170;
    MT.addCollider(-lim - 1, -lim, 0, 50, -lim - 40, lim);
    MT.addCollider(lim, lim + 1, 0, 50, -lim - 40, lim);
    MT.addCollider(-lim, lim, 0, 50, -lim - 41, -lim - 40);
    MT.addCollider(-lim, lim, 0, 50, lim, lim + 1);
    return g;
  };

  MT.truck = function (parent, x, rearZ) {
    const g = new THREE.Group();
    parent.add(g);
    const tex = MT.truckTexture();
    const body = MT.mat(0xf3f1ec, { r: 0.5 });
    const side = MT.mat(0xffffff, { map: tex, r: 0.5 });
    const dark = MT.mat(0x1f1d1b, { r: 0.7 });
    const cabMat = MT.mat(0x9e1418, { r: 0.35, m: 0.2 });
    const glass = MT.mat(0x22303a, { r: 0.1, m: 0.4 });
    const len = 12, w = 2.5;
    const cz = rearZ - len / 2;
    // baú: faces +x/-x com logo
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(w, 3.4, len), [side, side, body, body, body, body]);
    trailer.rotation.y = 0;
    trailer.position.set(x, 1.3 + 1.7, cz);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    g.add(trailer);
    MT.addCollider(x - w / 2, x + w / 2, 0, 4.7, rearZ - len, rearZ);
    MT.box(g, w - 0.4, 0.3, len - 1, x, 1.0, cz, dark, { collide: false });
    // cabine
    const cabZ = rearZ - len - 1.9;
    MT.box(g, w, 2.6, 3.2, x, 0.8, cabZ, cabMat);
    MT.box(g, w - 0.1, 0.9, 0.05, x, 2.3, cabZ - 1.61, glass, { collide: false });
    MT.box(g, w + 0.05, 0.4, 0.4, x, 0.5, cabZ - 1.5, dark, { collide: false });
    // rodas
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 18);
    for (const z of [rearZ - 1.2, rearZ - 2.4, rearZ - len + 0.5, cabZ - 0.8]) {
      for (const s of [-1, 1]) {
        const wh = new THREE.Mesh(wheelGeo, dark);
        wh.rotation.z = Math.PI / 2;
        wh.position.set(x + s * (w / 2 - 0.15), 0.5, z);
        wh.castShadow = true;
        g.add(wh);
      }
    }
    return g;
  };

  MT.buildTrees = function (g) {
    const spots = [];
    const rand = (a, b) => a + Math.random() * (b - a);
    const blocked = (x, z) =>
      (x > -108 && x < 80 && z > -124 && z < 24) || // fábrica, pátios, ruas
      (z > 8 && z < 24);
    let guard = 0;
    while (spots.length < 260 && guard++ < 5000) {
      const x = rand(-165, 165), z = rand(-200, 60);
      if (blocked(x, z)) continue;
      if (spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 5)) continue;
      spots.push([x, z, rand(0.8, 1.35)]);
    }
    // fileira de árvores ladeando a fachada (como na foto)
    for (const x of [-64, -78, 80, 92]) spots.push([x, 5, 1.1]);

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 8);
    const leafGeo = new THREE.ConeGeometry(2.0, 4.2, 9);
    const trunks = new THREE.InstancedMesh(trunkGeo, MT.mat(0x4a3423, { r: 1 }), spots.length);
    const leaves1 = new THREE.InstancedMesh(leafGeo, MT.mat(0x2c4f27, { r: 1 }), spots.length);
    const leaves2 = new THREE.InstancedMesh(leafGeo, MT.mat(0x355e2d, { r: 1 }), spots.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    spots.forEach(([x, z, k], i) => {
      q.setFromEuler(new THREE.Euler(0, Math.random() * 6.28, 0));
      m.compose(v.set(x, 1.2 * k, z), q, s.set(k, k, k));
      trunks.setMatrixAt(i, m);
      m.compose(v.set(x, (2.4 + 1.6) * k, z), q, s.set(k, k, k));
      leaves1.setMatrixAt(i, m);
      m.compose(v.set(x, (2.4 + 3.6) * k, z), q, s.set(k * 0.72, k * 0.8, k * 0.72));
      leaves2.setMatrixAt(i, m);
      MT.addCollider(x - 0.3 * k, x + 0.3 * k, 0, 3 * k, z - 0.3 * k, z + 0.3 * k);
    });
    for (const im of [trunks, leaves1, leaves2]) {
      im.castShadow = true;
      im.receiveShadow = true;
      g.add(im);
    }
  };
})();
