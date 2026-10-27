/*
 * Área de produção: as injetoras do GLB (assets/fabrica-blocos.glb) funcionando nas Injetoras (js/config/producao.js).
 * Todas as máquinas são desenhadas juntas: cada peça, por material, vira um InstancedMesh com uma cópia por máquina,
 * então 8 máquinas custam quase o mesmo que 1. Em movimento: engrenagens, injeção, molde abrindo e fechando,
 * misturador, ponteiros dos manômetros, grânulos girando no funil e blocos saindo pela esteira para a caixa.
 */
(function () {
  const MT = (window.MT = window.MT || {});

  const UP = new THREE.Vector3(0, 1, 0);
  // Medidas da máquina (metros, eixos do GLB: comprimento em x, frente com os manômetros em +z)
  const MOLDE_X = -1.95, ESTEIRA_INICIO = -2.7, ESTEIRA_FIM = -3.85, ESTEIRA_Y = 1.31, CAIXA_X = -4.45;
  const FOOT = [-4.95, 3.3, -1.4, 1.4]; // x1, x2, z1, z2 com a caixa de blocos (colisão e faixa amarela)
  const ABRE = 0.35; // abertura do molde
  const CURSO = 0.18; // avanço do atuador de injeção
  const RAIO_ATIVO = 50; // longe disso as máquinas não são animadas

  const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // Ciclo de injeção (u de 0 a 1): molde fecha, injeta, esfria, abre e solta o bloco (em u = 0,74)
  const moldOpen = (u) => (u < 0.08 ? 1 - smooth(0, 0.08, u) : smooth(0.62, 0.72, u));

  MT.buildProducao = function (scene) {
    const cfg = MT.PRODUCAO, F = MT.LAYOUT.F;
    return MT.loadGLB(cfg.modelo).then((gltf) => {
      const model = gltf.scene.getObjectByName('Fabrica_de_Blocos') || gltf.scene;
      model.updateMatrixWorld(true);
      const group = new THREE.Group();
      group.name = 'producao';
      scene.add(group);
      const N = cfg.maquinas.length;
      const base = cfg.maquinas.map((m) => new THREE.Matrix4().compose(
        new THREE.Vector3(m.x, F, m.z),
        new THREE.Quaternion().setFromAxisAngle(UP, THREE.MathUtils.degToRad(m.rot || 0)),
        new THREE.Vector3(1, 1, 1)
      ));
      const toModel = new THREE.Matrix4().copy(model.matrixWorld).invert();
      // Esfera que cobre todas as máquinas: com ela o three.js deixa de desenhar as injetoras quando o salão
      // não aparece na tela (a esfera da geometria de uma peça não serve, porque as cópias ficam espalhadas)
      const hall = new THREE.Sphere();
      hall.setFromPoints(cfg.maquinas.map((m) => new THREE.Vector3(m.x, F + 2.75, m.z)));
      hall.radius += 5.5;
      const cull = (im) => {
        im.geometry.boundingSphere = hall.clone();
        im.frustumCulled = true; // o InstancedMesh do r128 vem com o teste de visão desligado
      };
      const tmp = new THREE.Matrix4(), M = new THREE.Matrix4(), A = new THREE.Matrix4(), B = new THREE.Matrix4();
      const v = new THREE.Vector3();

      // Uma peça = um objeto desenhado em todas as máquinas; rest = pose da peça dentro da máquina
      const makePart = (obj, rest, shadow) => {
        const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
        const buckets = new Map();
        obj.traverse((o) => {
          if (!o.isMesh || o.isInstancedMesh) return;
          const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
          g.applyMatrix4(tmp.multiplyMatrices(inv, o.matrixWorld));
          if (!buckets.has(o.material)) buckets.set(o.material, []);
          buckets.get(o.material).push(g);
        });
        const part = { rest, meshes: [], box: new THREE.Box3() };
        for (const [mat, geos] of buckets) {
          const geo = MT.mergeGeometries(geos);
          geo.computeBoundingBox();
          part.box.union(geo.boundingBox);
          const im = new THREE.InstancedMesh(geo, mat, N);
          cull(im);
          im.castShadow = shadow;
          im.receiveShadow = true;
          group.add(im);
          part.meshes.push(im);
        }
        return part;
      };
      const setPart = (part, i, anim) => {
        M.multiplyMatrices(base[i], part.rest);
        if (anim) M.multiply(anim);
        for (const im of part.meshes) im.setMatrixAt(i, M);
      };
      const flush = (part) => { for (const im of part.meshes) im.instanceMatrix.needsUpdate = true; };

      // ---- peças do GLB ----
      const fixed = [], gears = [], needles = [];
      let mold = null, ram = null, mixer = null;
      for (const node of model.children) {
        if (node.name === 'Granulos') continue;
        const rest = new THREE.Matrix4().multiplyMatrices(toModel, node.matrixWorld);
        const part = makePart(node, rest, node.name === 'Estrutura_fixa');
        if (node.name.startsWith('Engrenagem_')) {
          const k = Number(node.name.split('_')[1]) % 5;
          const b = part.box;
          part.radius = Math.max(-b.min.x, b.max.x, -b.min.y, b.max.y);
          part.dir = k % 2 ? -1 : 1; // engrenagens vizinhas giram em sentidos opostos
          gears.push(part);
        } else if (node.name === 'Molde_movel') mold = part;
        else if (node.name === 'Atuador_injecao') ram = part;
        else if (node.name === 'Misturador') mixer = part;
        else if (node.name.startsWith('Ponteiro_')) needles.push(part);
        else fixed.push(part);
      }
      const bigRadius = Math.max(...gears.map((g) => g.radius), 0.1);

      // ---- caixa de blocos na saída da esteira e faixa amarela de segurança no piso ----
      const extra = new THREE.Group();
      const kraft = MT.mat(0xb08a5a, { r: 0.9 });
      const yellow = MT.mat(0xe8b81a, { r: 0.7 });
      const B0 = (w, h, d, x, y, z, m) => MT.box(extra, w, h, d, x, y, z, m, { collide: false });
      B0(0.8, 0.05, 0.9, CAIXA_X, 0, 0, kraft);
      B0(0.8, 0.5, 0.04, CAIXA_X, 0, -0.43, kraft);
      B0(0.8, 0.5, 0.04, CAIXA_X, 0, 0.43, kraft);
      B0(0.04, 0.5, 0.9, CAIXA_X - 0.38, 0, 0, kraft);
      B0(0.04, 0.5, 0.9, CAIXA_X + 0.38, 0, 0, kraft);
      const colors = cfg.cores.map((c) => MT.mat(new THREE.Color(c).getHex(), { r: 0.35 }));
      for (let i = 0; i < 28; i++) {
        const b = B0(0.24, 0.1, 0.12, CAIXA_X + (Math.random() - 0.5) * 0.55, 0.05 + Math.random() * 0.32, (Math.random() - 0.5) * 0.65, colors[i % colors.length]);
        b.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
      }
      const [x1, x2, z1, z2] = FOOT;
      B0(x2 - x1, 0.012, 0.1, (x1 + x2) / 2, 0, z1, yellow);
      B0(x2 - x1, 0.012, 0.1, (x1 + x2) / 2, 0, z2, yellow);
      B0(0.1, 0.012, z2 - z1, x1, 0, 0, yellow);
      B0(0.1, 0.012, z2 - z1, x2, 0, 0, yellow);
      extra.updateMatrixWorld(true);
      fixed.push(makePart(extra, new THREE.Matrix4(), true));

      // ---- grânulos coloridos no funil (já vêm instanciados no GLB) ----
      const granules = [];
      const hopper = new THREE.Vector3();
      let hn = 0;
      const gran = model.getObjectByName('Granulos');
      if (gran) for (const src of gran.children) {
        if (!src.isInstancedMesh) continue;
        const local = [];
        const pm = new THREE.Matrix4().multiplyMatrices(toModel, src.matrixWorld);
        for (let j = 0; j < src.count; j++) {
          src.getMatrixAt(j, tmp);
          local.push(new THREE.Matrix4().multiplyMatrices(pm, tmp));
          hopper.add(v.setFromMatrixPosition(local[j]));
          hn++;
        }
        const im = new THREE.InstancedMesh(src.geometry.clone(), src.material, src.count * N);
        cull(im);
        group.add(im);
        granules.push({ im, local });
      }
      hopper.divideScalar(hn || 1);

      // ---- blocos que saem do molde e andam pela esteira (até 2 por máquina ao mesmo tempo) ----
      const brickGeos = [new THREE.BoxGeometry(0.26, 0.1, 0.13).toNonIndexed()];
      for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) {
        const stud = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 10).toNonIndexed();
        stud.translate(-0.0975 + i * 0.065, 0.065, sz * 0.032);
        brickGeos.push(stud);
      }
      const bricks = new THREE.InstancedMesh(MT.mergeGeometries(brickGeos), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }), N * 2);
      cull(bricks);
      bricks.castShadow = true;
      const palette = cfg.cores.map((c) => new THREE.Color(c));
      for (let i = 0; i < N * 2; i++) bricks.setColorAt(i, palette[0]);
      group.add(bricks);
      const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);

      // posição do bloco na máquina, pelo tempo desde que o molde abriu; null quando já caiu na caixa
      const DROP = 0.45, SLIDE = (ESTEIRA_INICIO - ESTEIRA_FIM) / 0.55, FALL = 0.4;
      const brickAt = (age, out) => {
        if (age < 0) return null;
        if (age < DROP) {
          const k = age / DROP;
          return out.set(THREE.MathUtils.lerp(MOLDE_X, ESTEIRA_INICIO, k), THREE.MathUtils.lerp(1.8, ESTEIRA_Y, k * k), 0);
        }
        age -= DROP;
        if (age < SLIDE) return out.set(THREE.MathUtils.lerp(ESTEIRA_INICIO, ESTEIRA_FIM, age / SLIDE), ESTEIRA_Y, 0);
        age -= SLIDE;
        if (age < FALL) {
          const k = age / FALL;
          return out.set(THREE.MathUtils.lerp(ESTEIRA_FIM, CAIXA_X + 0.1, k), ESTEIRA_Y - (ESTEIRA_Y - 0.45) * k * k, 0);
        }
        return null;
      };

      // colisão: uma caixa por máquina (inclui a caixa de blocos)
      for (const m of base) {
        const lo = new THREE.Vector3(Infinity, 0, Infinity), hi = new THREE.Vector3(-Infinity, 0, -Infinity);
        for (const x of [x1, x2]) for (const z of [z1, z2]) {
          v.set(x, 0, z).applyMatrix4(m);
          lo.min(v);
          hi.max(v);
        }
        MT.addCollider(lo.x, hi.x, F, F + 5.5, lo.z, hi.z);
      }

      for (const p of fixed) {
        for (let i = 0; i < N; i++) setPart(p, i);
        flush(p);
      }

      const T = cfg.ciclo;
      const pos = new THREE.Vector3(), color = new THREE.Color();
      const update = (t) => {
        for (let i = 0; i < N; i++) {
          const ti = t + i * 1.37; // cada máquina no seu tempo
          const u = (ti / T) % 1;
          for (const g of gears) setPart(g, i, A.makeRotationZ(g.dir * ti * 0.8 * bigRadius / g.radius));
          if (mold) setPart(mold, i, A.makeTranslation(-ABRE * moldOpen(u), 0, 0));
          if (ram) setPart(ram, i, A.makeTranslation(-CURSO * (smooth(0.12, 0.3, u) - smooth(0.5, 0.6, u)), 0, 0));
          if (mixer) setPart(mixer, i, A.makeRotationY(ti * 1.6));
          needles.forEach((n, k) => setPart(n, i, A.makeRotationZ(0.35 * Math.sin(ti * (1.1 + k * 0.4) + k))));
          // grânulos girando no funil, em volta do eixo vertical do funil
          A.makeTranslation(hopper.x, 0, hopper.z).multiply(B.makeRotationY(ti * 0.7)).multiply(tmp.makeTranslation(-hopper.x, 0, -hopper.z));
          M.multiplyMatrices(base[i], A);
          for (const g of granules) {
            const n = g.local.length;
            for (let j = 0; j < n; j++) g.im.setMatrixAt(i * n + j, tmp.multiplyMatrices(M, g.local[j]));
          }
          // os dois últimos blocos injetados
          const cycle = Math.floor(ti / T);
          for (let k = 0; k < 2; k++) {
            const c = cycle - k;
            const p = brickAt(ti - (c + 0.74) * T, pos);
            if (!p) { bricks.setMatrixAt(i * 2 + k, HIDE); continue; }
            bricks.setMatrixAt(i * 2 + k, tmp.multiplyMatrices(base[i], A.makeTranslation(p.x, p.y, p.z)));
            bricks.setColorAt(i * 2 + k, color.copy(palette[((c % palette.length) + palette.length + i) % palette.length]));
          }
        }
        for (const p of [...gears, ...needles, mold, ram, mixer]) if (p) flush(p);
        for (const g of granules) g.im.instanceMatrix.needsUpdate = true;
        bricks.instanceMatrix.needsUpdate = true;
        bricks.instanceColor.needsUpdate = true;
      };
      update(0);
      MT.animators.push((dt, player, t) => {
        const far = !player.drone.on && Math.hypot(player.pos.x, player.pos.z + 25) > RAIO_ATIVO;
        if (!far) update(t);
      });
      return group;
    });
  };
})();
