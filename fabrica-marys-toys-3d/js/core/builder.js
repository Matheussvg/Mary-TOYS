/* Primitivas de construção: materiais, caixas com colisão e paredes com vãos. */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.colliders = [];
  MT.animators = [];

  const matCache = new Map();
  MT.mat = function (color, o = {}) {
    const key = JSON.stringify([color, o.r, o.m, o.e, o.ei, o.t, o.op, o.side, o.map && o.map.uuid]);
    if (!o.map && matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.r !== undefined ? o.r : 0.85,
      metalness: o.m || 0,
      map: o.map || null,
      emissive: o.e || 0x000000,
      emissiveIntensity: o.ei !== undefined ? o.ei : 1,
      emissiveMap: o.emap || null,
      transparent: !!o.t,
      opacity: o.op !== undefined ? o.op : 1,
      side: o.side || THREE.FrontSide,
      envMapIntensity: o.env !== undefined ? o.env : 0.3,
    });
    if (!o.map) matCache.set(key, m);
    return m;
  };

  // UVs em escala de mundo (1 repetição a cada `scale` metros)
  MT.worldUV = function (geo, w, h, d, scale) {
    const uv = geo.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) {
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i;
        uv.setXY(k, uv.getX(k) * dims[f][0] / scale, uv.getY(k) * dims[f][1] / scale);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  MT.addCollider = function (x1, x2, y1, y2, z1, z2) {
    const c = { minX: Math.min(x1, x2), maxX: Math.max(x1, x2), minY: y1, maxY: y2, minZ: Math.min(z1, z2), maxZ: Math.max(z1, z2), enabled: true };
    MT.colliders.push(c);
    return c;
  };

  // Caixa com base em y (não no centro)
  MT.box = function (parent, w, h, d, x, y, z, material, o = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    if (o.uvScale) MT.worldUV(geo, w, h, d, o.uvScale);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = o.receive !== false;
    parent.add(mesh);
    if (o.collide !== false) mesh.userData.collider = MT.addCollider(x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2);
    return mesh;
  };

  MT.cyl = function (parent, rTop, rBot, h, x, y, z, material, o = {}) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, o.seg || 20), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (o.collide) {
      const r = Math.max(rTop, rBot);
      MT.addCollider(x - r, x + r, y, y + h, z - r, z + r);
    }
    return mesh;
  };

  MT.plane = function (parent, w, h, material, pos, rot) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  /*
   * Parede ao longo de um eixo, recortada pelos vãos.
   * mats: material único ou { inner, outer, top } para paredes externas.
   */
  MT.wall = function (parent, spec, opts) {
    const base = opts.base, height = opts.height, thick = opts.thick;
    const extend = opts.extend || 0;
    const from = Math.min(spec.from, spec.to) - extend;
    const to = Math.max(spec.from, spec.to) + extend;
    const ops = (spec.openings || [])
      .map((o) => ({ a: o.c - o.w / 2, b: o.c + o.w / 2, h: o.h || 2.4 }))
      .sort((p, q) => p.a - q.a);

    let material = opts.material;
    if (opts.inner) {
      // ordem das faces da BoxGeometry: +x, -x, +y, -y, +z, -z
      const I = opts.inner, O = opts.outer, T = opts.top || opts.inner;
      const faces = { '+x': [O, I, T, T, I, I], '-x': [I, O, T, T, I, I], '+z': [I, I, T, T, O, I], '-z': [I, I, T, T, I, O] };
      material = faces[spec.outward];
    }

    const seg = (a, b, y0, y1) => {
      if (b - a < 0.01 || y1 - y0 < 0.01) return;
      const len = b - a, mid = (a + b) / 2;
      const o = { uvScale: opts.uvScale };
      if (spec.axis === 'x') MT.box(parent, len, y1 - y0, thick, mid, y0, spec.at, material, o);
      else MT.box(parent, thick, y1 - y0, len, spec.at, y0, mid, material, o);
    };

    let cur = from;
    for (const o of ops) {
      seg(cur, o.a, base, base + height);
      seg(o.a, o.b, base + o.h, base + height);
      cur = o.b;
    }
    seg(cur, to, base, base + height);
  };

  // Escada: degraus como caixas (sobe na direção `dir`)
  MT.stairs = function (parent, o) {
    // o: { x, z, width, run, rise, steps, dir: '+z'|'-z'|'+x'|'-x', base, material }
    for (let i = 0; i < o.steps; i++) {
      const h = o.rise * (i + 1);
      const along = o.run * (o.steps - i - 0.5);
      let x = o.x, z = o.z;
      // o.x/o.z marcam o topo da escada; degraus descem para fora
      if (o.dir === '-z') z = o.z + along; // sobe indo para -z
      if (o.dir === '+z') z = o.z - along;
      if (o.dir === '-x') x = o.x + along;
      if (o.dir === '+x') x = o.x - along;
      const alongX = o.dir === '+x' || o.dir === '-x';
      MT.box(parent, alongX ? o.run : o.width, h, alongX ? o.width : o.run, x, o.base, z, o.material);
    }
  };
})();
