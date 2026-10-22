/* Ala da TI: monta a mobília de js/config/ti.js com os modelos de js/models/office.js e registra os PCs que abrem o SAP. */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.buildTI = function (scene) {
    const L = MT.LAYOUT, F = L.F, B = L.building;
    const root = new THREE.Group();
    root.name = 'ti';
    scene.add(root);
    MT.computers = [];

    for (const room of MT.TI.rooms) {
      const area = L.areas.find((a) => a.id === room.area);
      if (!area) continue;
      const [x1, x2, z1, z2] = area.rect;
      // Faces internas das paredes: as do perímetro têm 0,5 m de espessura, as internas 0,2 m
      const r = {
        x1: x1 + (x1 === B.x1 ? 0.25 : 0.1), x2: x2 - (x2 === B.x2 ? 0.25 : 0.1),
        z1: z1 + (z1 === B.z1 ? 0.25 : 0.1), z2: z2 - (z2 === B.z2 ? 0.25 : 0.1),
        cx: (x1 + x2) / 2, cz: (z1 + z2) / 2,
      };
      for (const it of room.items) {
        const make = MT.MODELS[it.model];
        if (!make) { console.warn('Modelo desconhecido na TI:', it.model); continue; }
        const g = make(it);
        place(g, it, r, F);
        root.add(g);
      }
    }

    root.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    root.traverse((o) => {
      // caixa local → caixa alinhada aos eixos do mundo
      for (const c of o.userData.colliders || []) {
        const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        for (const x of [c[0], c[1]]) for (const y of [c[2], c[3]]) for (const z of [c[4], c[5]]) {
          v.set(x, y, z).applyMatrix4(o.matrixWorld);
          v.toArray().forEach((n, i) => { lo[i] = Math.min(lo[i], n); hi[i] = Math.max(hi[i], n); });
        }
        MT.addCollider(lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]);
      }
      if (o.userData.pc) register(o);
    });
    MT.bake(root);
    return root;
  };

  // Encosta na parede (de costas para ela) ou posiciona a partir do centro da sala
  function place(g, it, r, F) {
    const back = (g.userData.back || 0) + 0.02;
    const along = it.along || 0;
    let x, z, rot;
    if (it.wall === 'W') { x = r.x1 + back; z = r.cz + along; rot = Math.PI / 2; }
    else if (it.wall === 'E') { x = r.x2 - back; z = r.cz + along; rot = -Math.PI / 2; }
    else if (it.wall === 'N') { x = r.cx + along; z = r.z1 + back; rot = 0; }
    else if (it.wall === 'S') { x = r.cx + along; z = r.z2 - back; rot = Math.PI; }
    else { x = r.cx + it.at[0]; z = r.cz + it.at[1]; rot = THREE.MathUtils.degToRad(it.rot || 0); }
    g.position.set(x, F + (it.y || 0), z);
    g.rotation.y = rot;
  }

  function register(screen) {
    const info = screen.userData.pc;
    const center = new THREE.Vector3().setFromMatrixPosition(screen.matrixWorld);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld);
    const area = MT.areaAt(center.x, center.z);
    // onde o jogador fica em pé, atrás da cadeira, olhando para a tela
    const stand = center.clone().addScaledVector(normal, 1.5);
    MT.computers.push({
      mesh: screen,
      baseMap: screen.material.map,
      center,
      normal,
      w: screen.userData.w,
      h: screen.userData.h,
      room: area ? area.id : null,
      roomName: area ? area.name : 'TI',
      name: info.owner ? 'PC de ' + info.owner : info.label || 'Estação livre',
      role: info.role,
      main: info.main,
      stand: { x: stand.x, z: stand.z, yaw: Math.atan2(normal.x, normal.z) },
    });
  }
})();
