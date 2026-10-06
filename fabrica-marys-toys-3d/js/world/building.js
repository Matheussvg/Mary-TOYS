/* Estrutura da fábrica: laje, paredes, telhado, portas automáticas e divisões internas. */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.buildBuilding = function (scene) {
    const L = MT.LAYOUT, F = L.F, H = L.H, B = L.building;
    const group = new THREE.Group();
    group.name = 'fabrica';
    scene.add(group);

    const brick = MT.brickTexture();
    brick.wrapS = brick.wrapT = THREE.RepeatWrapping;
    const outer = MT.mat(0xffffff, { map: brick, r: 0.9 });
    const inner = MT.mat(0xe9e2d3, { r: 0.95 });
    const trimGold = MT.mat(0xd9a441, { r: 0.35, m: 0.6, env: 1.0 });
    const slabMat = MT.mat(0x8a8178, { r: 0.95 });

    // Laje do piso (3 degraus acima do terreno)
    MT.box(group, B.x2 - B.x1 + 0.6, F, B.z2 - B.z1 + 0.6, (B.x1 + B.x2) / 2, 0, (B.z1 + B.z2) / 2, slabMat, { cast: false });

    // Paredes do perímetro: tijolo vermelho por fora, creme por dentro
    for (const spec of L.perimeter) {
      MT.wall(group, spec, { base: F, height: H + 0.8, thick: 0.5, extend: 0.25, inner, outer, top: trimGold, uvScale: 3 });
    }
    // Paredes internas
    for (const spec of L.interior) {
      MT.wall(group, spec, { base: F, height: H, thick: 0.2, material: inner });
    }

    // Frisos dourados e base escura ao redor do prédio
    const plinth = MT.mat(0x4b4540, { r: 0.8 });
    const trims = [
      { axis: 'x', at: B.z2 + 0.3, len: B.x2 - B.x1 + 1.1 },
      { axis: 'x', at: B.z1 - 0.3, len: B.x2 - B.x1 + 1.1 },
      { axis: 'z', at: B.x1 - 0.3, len: B.z2 - B.z1 + 1.1 },
      { axis: 'z', at: B.x2 + 0.3, len: B.z2 - B.z1 + 1.1 },
    ];
    for (const t of trims) {
      for (const [y, h, mat] of [[F + 3.4, 0.25, trimGold], [F + H + 0.3, 0.5, trimGold], [0, F + 0.6, plinth]]) {
        if (t.axis === 'x') MT.box(group, t.len, h, 0.12, (B.x1 + B.x2) / 2, y, t.at, mat, { collide: false });
        else MT.box(group, 0.12, h, t.len, t.at, y, (B.z1 + B.z2) / 2, mat, { collide: false });
      }
    }

    buildRoof(group, L, trimGold);
    buildDoors(group, L);
    buildAreas(group, L);
    buildBanners(group, L);
    buildInteriorLights(group, L);
    buildFacadeWindows(group, L);
    return group;
  };

  function buildRoof(group, L, trimGold) {
    const F = L.F, H = L.H, B = L.building;
    const roof = new THREE.Group();
    roof.name = 'telhado';
    const roofMat = [
      MT.mat(0x6b625a), MT.mat(0x6b625a),
      MT.mat(0x58524c, { r: 0.95 }), // cima
      MT.mat(0xdedad2, { r: 1 }),    // forro (embaixo)
      MT.mat(0x6b625a), MT.mat(0x6b625a),
    ];
    const w = B.x2 - B.x1, d = B.z2 - B.z1;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, d), roofMat);
    top.position.set((B.x1 + B.x2) / 2, F + H + 0.175, (B.z1 + B.z2) / 2);
    top.castShadow = true;
    top.receiveShadow = true;
    roof.add(top);

    // Luminárias embutidas no forro
    const lampMat = MT.mat(0xffffff, { e: 0xfff1d0, ei: 1.4 });
    const lampGeo = new THREE.PlaneGeometry(1.4, 0.35);
    const positions = [];
    for (const a of L.areas) {
      const [x1, x2, z1, z2] = a.rect;
      const sx = Math.max(1, Math.floor((x2 - x1) / 6));
      const sz = Math.max(1, Math.floor((z2 - z1) / 6));
      for (let i = 0; i < sx; i++) for (let j = 0; j < sz; j++) {
        positions.push([x1 + ((i + 0.5) * (x2 - x1)) / sx, z1 + ((j + 0.5) * (z2 - z1)) / sz]);
      }
    }
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, positions.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    positions.forEach((p, i) => {
      m.compose(new THREE.Vector3(p[0], F + H - 0.01, p[1]), q, new THREE.Vector3(1, 1, 1));
      lamps.setMatrixAt(i, m);
    });
    roof.add(lamps);
    group.add(roof);
    MT.roof = roof;
  }

  // Portas automáticas: vidro deslizante na entrada e portas de enrolar nas docas
  function buildDoors(group, L) {
    const F = L.F;
    const glass = MT.mat(0x9fc4d6, { r: 0.05, m: 0.2, t: true, op: 0.35, env: 1.2 });
    const frame = MT.mat(0xd9a441, { r: 0.35, m: 0.6 });
    const rollMat = MT.mat(0x8d8f93, { r: 0.6, m: 0.4 });

    for (const spec of L.perimeter) {
      for (const o of spec.openings || []) {
        if (!o.door) continue;
        const along = spec.axis === 'x';
        const cx = along ? o.c : spec.at, cz = along ? spec.at : o.c;
        const h = o.h || 2.4;

        if (o.door === 'slide') {
          const panels = [-1, 1].map((side) => {
            const g = new THREE.Group();
            const pw = o.w / 2;
            const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, h, 0.06), glass);
            pane.position.y = h / 2;
            g.add(pane);
            const bar = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.12, 0.1), frame);
            bar.position.y = h - 0.06;
            g.add(bar);
            const bar2 = bar.clone();
            bar2.position.y = 0.06;
            g.add(bar2);
            g.position.set(cx + side * (pw / 2), F, cz);
            group.add(g);
            const col = MT.addCollider(0, 0, F, F + h, cz - 0.08, cz + 0.08);
            return { g, side, pw, col, closedX: cx + side * (pw / 2) };
          });
          const door = { t: 0 };
          MT.animators.push((dt, player) => {
            const dist = Math.hypot(player.pos.x - cx, player.pos.z - cz);
            const target = dist < 4.5 ? 1 : 0;
            door.t += Math.sign(target - door.t) * Math.min(Math.abs(target - door.t), dt * 1.6);
            for (const p of panels) {
              const x = p.closedX + p.side * p.pw * 0.95 * door.t;
              p.g.position.x = x;
              p.col.minX = x - p.pw / 2;
              p.col.maxX = x + p.pw / 2;
            }
          });
        } else if (o.door === 'roll') {
          const shutter = MT.box(group, o.w, h, 0.08, cx, F, cz, rollMat, { uvScale: 0.25 });
          // ripas horizontais
          const rib = MT.mat(0x6f7176, { r: 0.6, m: 0.4 });
          for (let y = 0.3; y < h; y += 0.3) {
            const r = new THREE.Mesh(new THREE.BoxGeometry(o.w, 0.03, 0.1), rib);
            r.position.set(0, y - h / 2, 0);
            shutter.add(r);
          }
          const col = shutter.userData.collider;
          const door = { t: 0 };
          MT.animators.push((dt, player) => {
            const dist = Math.hypot(player.pos.x - cx, player.pos.z - cz);
            const target = dist < 5 ? 1 : 0;
            door.t += Math.sign(target - door.t) * Math.min(Math.abs(target - door.t), dt * 0.8);
            const lift = (h - 0.2) * door.t;
            shutter.position.y = F + h / 2 + lift;
            col.minY = F + lift;
          });
          // Moldura amarela da doca
          const dockMat = MT.mat(0xe8b81a, { r: 0.6 });
          MT.box(group, 0.3, h + 0.3, 0.6, cx - o.w / 2 - 0.15, F, cz, dockMat);
          MT.box(group, 0.3, h + 0.3, 0.6, cx + o.w / 2 + 0.15, F, cz, dockMat);
          MT.box(group, o.w + 0.6, 0.3, 0.6, cx, F + h, cz, dockMat, { collide: false });
        }
      }
    }
  }

  function buildAreas(group, L) {
    const F = L.F;
    MT.signs = [];
    for (const a of L.areas) {
      const dept = L.departments[a.dept];
      const [x1, x2, z1, z2] = a.rect;
      const w = x2 - x1, d = z2 - z1;
      // Nas alas o acesso é pela lateral: gira o piso para o nome ficar de frente para a porta
      const turn = a.dept === 'ti' ? Math.PI / 2 : a.dept === 'comunicacao' ? -Math.PI / 2 : 0;
      const texArea = turn ? Object.assign({}, a, { rect: [0, d, 0, w] }) : a;
      const tex = MT.floorTexture(texArea, dept);
      const floor = MT.plane(group, turn ? d : w, turn ? w : d, MT.mat(0xffffff, { map: tex, r: 0.7 }), [(x1 + x2) / 2, F + 0.005, (z1 + z2) / 2], [-Math.PI / 2, 0, turn]);
      floor.receiveShadow = true;

      // Rodapé colorido com a cor do setor (dá a leitura das divisões)
      const skirt = MT.mat(dept.color, { r: 0.7 });
      const t = 0.11;
      const sk = [
        [w, 0.18, 0.02, (x1 + x2) / 2, z1 + t],
        [w, 0.18, 0.02, (x1 + x2) / 2, z2 - t],
        [0.02, 0.18, d, x1 + t, (z1 + z2) / 2],
        [0.02, 0.18, d, x2 - t, (z1 + z2) / 2],
      ];
      if (!a.minor) for (const s of sk) MT.box(group, s[0], s[1], s[2], s[3], F, s[4], skirt, { collide: false, cast: false });

      if (a.minor) continue;
      const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: MT.signTexture(a, dept), transparent: true }));
      const big = w * d > 300;
      const sw = big ? 6.4 : 4.2;
      sign.scale.set(sw, sw * (400 / 1024), 1);
      sign.position.set((x1 + x2) / 2, F + (big ? 4.6 : 3.3), (z1 + z2) / 2);
      sign.userData.area = a;
      group.add(sign);
      MT.signs.push(sign);
    }
  }

  function buildBanners(group, L) {
    for (const b of L.banners) {
      const dept = L.departments[b.dept];
      const tex = MT.bannerTexture(b.text, dept.color);
      const h = b.w * (220 / 1024);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(b.w, h), MT.mat(0xffffff, { map: tex, r: 0.6 }));
      mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
      mesh.rotation.y = b.rotY;
      mesh.position.add(new THREE.Vector3(Math.sin(b.rotY), 0, Math.cos(b.rotY)).multiplyScalar(0.12));
      group.add(mesh);
    }
  }

  function buildInteriorLights(group, L) {
    const F = L.F, y = F + L.H - 1.2;
    const spots = [
      [0, -5], [-15, -25], [15, -25], [0, -45], [-16, -72], [12, -72],
      [-47, -79], [-47, -40], [-47, -8], [47, -67], [47, -22],
    ];
    for (const [x, z] of spots) {
      const p = new THREE.PointLight(0xffe2b8, 1.3, 36, 1.5);
      p.position.set(x, y, z);
      group.add(p);
    }
  }

  // Janelas iluminadas na fachada principal (duas fileiras, como na foto)
  function buildFacadeWindows(group, L) {
    const F = L.F, tex = MT.windowTexture();
    const mat = MT.mat(0xffffff, { map: tex, emap: tex, e: 0xffffff, ei: 0.55, r: 0.4 });
    const geo = new THREE.PlaneGeometry(2.6, 2.4);
    const xs = [];
    for (let x = -50; x <= -18; x += 4) xs.push(x);
    for (let x = 18; x <= 50; x += 4) xs.push(x);
    const inst = new THREE.InstancedMesh(geo, mat, xs.length * 2);
    const m = new THREE.Matrix4();
    let i = 0;
    for (const x of xs) for (const y of [F + 1.9, F + 6.0]) {
      m.makeTranslation(x, y, 0.27);
      inst.setMatrixAt(i++, m);
    }
    group.add(inst);

    // Janelas laterais e dos fundos
    const sideXs = [];
    for (let z = -84; z <= -6; z += 6) sideXs.push(z);
    const side = new THREE.InstancedMesh(geo, mat, sideXs.length * 2 * 2);
    const q = new THREE.Quaternion();
    let k = 0;
    for (const sx of [-1, 1]) for (const z of sideXs) {
      q.setFromEuler(new THREE.Euler(0, sx * Math.PI / 2, 0));
      for (const y of [F + 1.9, F + 6.0]) {
        m.compose(new THREE.Vector3(sx * 60.27, y, z), q, new THREE.Vector3(1, 1, 1));
        side.setMatrixAt(k++, m);
      }
    }
    group.add(side);
  }
})();
