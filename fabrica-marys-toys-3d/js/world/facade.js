/* Fachada principal: pórtico, letreiro em arco, engrenagens, torres, estandartes e bonecos guardas. */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.buildFacade = function (scene) {
    const L = MT.LAYOUT, F = L.F;
    const g = new THREE.Group();
    g.name = 'fachada';
    scene.add(g);

    const brick = MT.brickTexture();
    brick.wrapS = brick.wrapT = THREE.RepeatWrapping;
    const red = MT.mat(0xffffff, { map: brick, r: 0.9 });
    const redPaint = MT.mat(0x8c0f14, { r: 0.7 });
    const gold = MT.mat(0xc8902f, { r: 0.35, m: 0.85, env: 1.0 });
    const stone = MT.mat(0x5a5550, { r: 0.85 });
    const stoneLight = MT.mat(0xb9b1a6, { r: 0.8 });
    const carpet = MT.mat(0xb3121a, { r: 0.95 });

    // Patamar e escadaria
    MT.box(g, 18, F, 5.5, 0, 0, 2.75, stoneLight);
    MT.stairs(g, { x: 0, z: 5.5, width: 12, run: 0.5, rise: 0.15, steps: 2, dir: '-z', base: 0, material: stoneLight });
    MT.plane(g, 2.6, 13.5, carpet, [0, F + 0.012, -1.25], [-Math.PI / 2, 0, 0]);
    MT.plane(g, 2.6, 0.5, carpet, [0, 0.302, 5.75], [-Math.PI / 2, 0, 0]);
    MT.plane(g, 2.6, 0.5, carpet, [0, 0.152, 6.25], [-Math.PI / 2, 0, 0]);

    // Pilares e marquise
    for (const sx of [-1, 1]) {
      MT.box(g, 1.1, 5.2, 1.1, sx * 8.4, F, 5, stone);
      MT.box(g, 1.3, 0.3, 1.3, sx * 8.4, F + 4.9, 5, gold, { collide: false });
      MT.box(g, 1.3, 0.25, 1.3, sx * 8.4, F, 5, gold, { collide: false });
    }
    MT.box(g, 18.6, 0.6, 5.6, 0, F + 5.2, 3.0, redPaint);
    MT.box(g, 18.8, 0.2, 0.2, 0, F + 5.2, 5.85, gold, { collide: false });
    MT.box(g, 18.8, 0.2, 0.2, 0, F + 5.6, 5.85, gold, { collide: false });
    const spotMat = MT.mat(0xffffff, { e: 0xffe3b0, ei: 2 });
    for (let x = -7; x <= 7; x += 3.5) for (const z of [1.6, 4.2]) {
      const s = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), spotMat);
      s.rotation.x = Math.PI / 2;
      s.position.set(x, F + 5.19, z);
      g.add(s);
    }
    const porchLight = new THREE.PointLight(0xffd59a, 1.3, 16, 2);
    porchLight.position.set(0, F + 4.6, 3);
    g.add(porchLight);

    // Letreiro em arco
    const W = 16, RH = 3.4, ARCH = 1.6;
    const archShape = (w, rh, arch) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0);
      s.lineTo(w / 2, 0);
      s.lineTo(w / 2, rh);
      s.quadraticCurveTo(0, rh + arch * 2, -w / 2, rh);
      s.closePath();
      return s;
    };
    const signY = F + 5.8, signZ = 4.6;
    const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(W + 0.7, RH + 0.2, ARCH + 0.05), { depth: 0.4, bevelEnabled: false }), gold);
    rim.position.set(0, signY - 0.25, signZ - 0.2);
    rim.castShadow = true;
    g.add(rim);
    const face = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(W, RH, ARCH), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }), redPaint);
    face.position.set(0, signY, signZ);
    face.castShadow = true;
    g.add(face);
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14 * (560 / 1600)),
      new THREE.MeshStandardMaterial({ map: MT.logoTexture(), transparent: true, roughness: 0.5, emissive: 0x3a2a10, emissiveIntensity: 0.4 })
    );
    logo.position.set(0, signY + 2.55, signZ + 0.6);
    g.add(logo);
    MT.addCollider(-W / 2 - 0.4, W / 2 + 0.4, signY - 0.3, signY + RH + ARCH * 1.2, signZ - 0.3, signZ + 0.6);

    // Estrela no topo
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.55 : 1.25;
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2 }), gold);
    star.position.set(0, signY + RH + ARCH + 0.9, signZ + 0.1);
    star.castShadow = true;
    g.add(star);
    const starIn = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.1, bevelEnabled: false }), redPaint);
    starIn.scale.setScalar(0.5);
    starIn.position.set(0, star.position.y, signZ + 0.55);
    g.add(starIn);

    // Engrenagens douradas girando
    const gearShape = (r, teeth) => {
      const s = new THREE.Shape();
      const n = teeth * 4;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = Math.floor(i / 2) % 2 ? r * 0.82 : r;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
      const hole = new THREE.Path();
      hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true);
      s.holes.push(hole);
      return s;
    };
    const gearGeo = new THREE.ExtrudeGeometry(gearShape(1.25, 12), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
    for (const sx of [-1, 1]) {
      const gear = new THREE.Mesh(gearGeo, gold);
      gear.position.set(sx * 8.1, signY + 1.6, signZ + 0.55);
      gear.castShadow = true;
      g.add(gear);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 20), stone);
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(gear.position).add(new THREE.Vector3(0, 0, 0.15));
      g.add(hub);
      MT.animators.push((dt) => { gear.rotation.z += sx * dt * 0.35; });
    }

    // Torres: nas pontas e ladeando o pórtico
    const tower = (x, w, d, h, zFront) => {
      MT.box(g, w, h, d, x, 0, zFront - d / 2, red, { uvScale: 3 });
      MT.box(g, w + 0.4, 0.5, d + 0.4, x, h, zFront - d / 2, gold);
      MT.box(g, w + 0.2, 0.25, d + 0.2, x, F + 3.4, zFront - d / 2, gold, { collide: false });
      // ameias
      const n = Math.max(2, Math.round(w / 1.2));
      for (let i = 0; i < n; i++) {
        const bx = x - w / 2 + (w / n) * (i + 0.5);
        MT.box(g, (w / n) * 0.55, 0.6, 0.5, bx, h + 0.5, zFront - 0.25, redPaint, { collide: false });
        MT.box(g, (w / n) * 0.55, 0.6, 0.5, bx, h + 0.5, zFront - d + 0.25, redPaint, { collide: false });
      }
      return h;
    };
    const cornerH = F + 12.5;
    for (const sx of [-1, 1]) {
      tower(sx * 57.5, 5.4, 2.4, cornerH, 2.2);
      tower(sx * 11.6, 3.2, 1.6, F + 10.5, 1.4);
    }

    // Bandeiras nas torres
    const flagTex = MT.canvasTexture(256, 160, (c, w, h) => {
      c.fillStyle = '#b3121a';
      c.fillRect(0, 0, w, h);
      MT.drawGear(c, w / 2, h / 2, 46, '#e6b65a');
    });
    const flagMat = MT.mat(0xffffff, { map: flagTex, side: THREE.DoubleSide, r: 0.9 });
    for (const sx of [-1, 1]) {
      const px = sx * 57.5, pz = 0.6;
      MT.cyl(g, 0.06, 0.08, 5, px, cornerH + 0.5, pz, MT.mat(0x3a3530, { r: 0.4, m: 0.6 }), { cast: true });
      const geo = new THREE.PlaneGeometry(3.2, 2, 16, 6);
      const flag = new THREE.Mesh(geo, flagMat);
      flag.position.set(px + 1.6, cornerH + 4.3, pz);
      flag.castShadow = true;
      g.add(flag);
      const base = geo.attributes.position.array.slice();
      MT.animators.push((dt, p, t) => {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = base[i * 3] + 1.6;
          pos.setZ(i, Math.sin(x * 2.2 - t * 4 + sx) * 0.12 * (x / 3.2));
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      });
    }

    // Estandartes
    const bannerMat = (lines, gear) => MT.mat(0xffffff, { map: MT.verticalBannerTexture(lines, gear), r: 0.8, t: true });
    const vb = (x, z, w, y, lines, gear) => {
      const h = w * (1100 / 360);
      const m = MT.plane(g, w, h, bannerMat(lines, gear), [x, y, z], [0, 0, 0]);
      MT.box(g, w + 0.4, 0.12, 0.12, x, y + h / 2, z + 0.02, gold, { collide: false });
      return m;
    };
    vb(-57.5, 2.23, 3.2, F + 6.3, ['SONHE', 'MONTE', 'BRINQUE'], true);
    vb(57.5, 2.23, 3.2, F + 6.3, ['PEQUENAS', 'PEÇAS,', 'GRANDES', 'AVENTURAS'], true);
    vb(-11.6, 1.43, 2.0, F + 4.6, [], true);
    vb(11.6, 1.43, 2.0, F + 4.6, [], true);

    // Bonecos guardas sobre pedestais
    for (const sx of [-1, 1]) {
      MT.box(g, 1.4, 1.2, 1.4, sx * 7.6, 0, 6.6, stone);
      MT.box(g, 1.55, 0.15, 1.55, sx * 7.6, 1.2, 6.6, gold);
      const fig = MT.minifig();
      fig.position.set(sx * 7.6, 1.35, 6.6);
      g.add(fig);
    }

    // Lampiões
    for (const [x, z] of [[-10.2, 7.2], [10.2, 7.2]]) MT.lantern(g, x, z, 1.6);
    const lampL = new THREE.PointLight(0xffc77a, 0.9, 12, 2);
    lampL.position.set(-10.2, 2.3, 7.2);
    const lampR = lampL.clone();
    lampR.position.x = 10.2;
    g.add(lampL, lampR);

    // Floreiras ao longo da fachada
    const planter = MT.mat(0x4b4540, { r: 0.9 });
    const bushMat = MT.mat(0x2f5a2a, { r: 1 });
    const bushGeo = new THREE.SphereGeometry(0.75, 10, 8);
    for (const sx of [-1, 1]) {
      const x1 = sx * 15, x2 = sx * 54;
      const cx = (x1 + x2) / 2, len = Math.abs(x2 - x1);
      MT.box(g, len, 0.6, 1.6, cx, 0, 4.2, planter);
      for (let x = Math.min(x1, x2) + 0.8; x < Math.max(x1, x2); x += 1.5) {
        const b = new THREE.Mesh(bushGeo, bushMat);
        b.position.set(x, 0.9 + Math.random() * 0.15, 4.2);
        b.scale.set(1, 0.8 + Math.random() * 0.3, 0.9);
        b.castShadow = true;
        g.add(b);
      }
    }
    return g;
  };

  MT.lantern = function (parent, x, z, h) {
    const dark = MT.mat(0x2b2724, { r: 0.5, m: 0.5 });
    const glow = MT.mat(0xfff0c8, { e: 0xffc070, ei: 2.2 });
    MT.box(parent, 0.5, 0.25, 0.5, x, 0, z, dark);
    MT.cyl(parent, 0.07, 0.09, h, x, 0.25, z, dark, { collide: true, seg: 10 });
    MT.box(parent, 0.4, 0.5, 0.4, x, h + 0.25, z, glow, { collide: false });
    MT.box(parent, 0.5, 0.1, 0.5, x, h + 0.75, z, dark, { collide: false });
  };

  // Boneco estilo bloco de montar (~2,4 m)
  MT.minifig = function () {
    const fig = new THREE.Group();
    const red = MT.mat(0xc0161d, { r: 0.35 });
    const darkRed = MT.mat(0x7a0f12, { r: 0.4 });
    const yellow = MT.mat(0xf4c51c, { r: 0.35 });
    const white = MT.mat(0xf6f3ea, { r: 0.35 });
    const goldM = MT.mat(0xd9a441, { r: 0.3, m: 0.7 });
    const add = (geo, mat, x, y, z, rx = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, 0, rz);
      m.castShadow = true;
      fig.add(m);
      return m;
    };
    add(new THREE.BoxGeometry(0.34, 0.8, 0.42), darkRed, -0.18, 0.4, 0);
    add(new THREE.BoxGeometry(0.34, 0.8, 0.42), darkRed, 0.18, 0.4, 0);
    add(new THREE.BoxGeometry(0.74, 0.16, 0.42), darkRed, 0, 0.88, 0);
    const torso = add(new THREE.CylinderGeometry(0.33, 0.45, 0.82, 4, 1), red, 0, 1.37, 0);
    torso.rotation.y = Math.PI / 4;
    torso.scale.set(1, 1, 0.62);
    add(new THREE.BoxGeometry(0.1, 0.8, 0.02), white, -0.13, 1.37, 0.18, 0, -0.42);
    add(new THREE.BoxGeometry(0.1, 0.8, 0.02), white, 0.13, 1.37, 0.18, 0, 0.42);
    for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.035, 8, 6), goldM, 0, 1.15 + i * 0.18, 0.22);
    for (const sx of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.11, 0.12, 0.7, 12), red, sx * 0.48, 1.38, 0.05, 0.25, sx * 0.12);
      add(new THREE.TorusGeometry(0.09, 0.04, 8, 14), yellow, sx * 0.53, 0.98, 0.18, Math.PI / 2.4, 0);
    }
    add(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), yellow, 0, 1.82, 0);
    const faceTex = MT.faceTexture();
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.46, 32), [
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.35 }), yellow, yellow,
    ]);
    head.position.set(0, 2.1, 0);
    head.rotation.y = Math.PI;
    head.castShadow = true;
    fig.add(head);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), white);
    helmet.position.set(0, 2.3, 0);
    helmet.castShadow = true;
    fig.add(helmet);
    add(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 28), white, 0, 2.31, 0);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10), goldM, 0, 2.62, 0);
    return fig;
  };
})();
