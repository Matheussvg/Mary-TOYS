/*
 * Personagem jogável: boneco no formato de jogador do Minecraft montado a partir da skin (js/config/skin.js).
 * Cada parte é uma caixa cujas seis faces recortam o PNG 64 × 64 no layout padrão de skin
 * (cabeça 8×8×8, tronco 8×12×4, braços e pernas 4×12×4, mais a camada externa: chapéu, jaqueta, mangas e calça).
 * Acima da cabeça fica o nome do jogador. Um MT.Avatar por jogador: todos usam a mesma skin.
 */
(function () {
  const MT = (window.MT = window.MT || {});

  const PX = 1.75 / 32; // o boneco tem 32 pixels de altura e o jogador 1,75 m
  const TEX = 64;

  // Partes: tamanho em pixels, posição da articulação, onde a caixa fica em relação a ela e a origem no PNG
  // (camada de base e camada externa). A direita do personagem fica em −x porque ele olha para +z.
  const PARTS = {
    head: { size: [8, 8, 8], pivot: [0, 24, 0], box: [0, 4, 0], uv: [0, 0], over: [32, 0], inflate: 0.5 },
    body: { size: [8, 12, 4], pivot: [0, 12, 0], box: [0, 6, 0], uv: [16, 16], over: [16, 32], inflate: 0.25 },
    armR: { size: [4, 12, 4], pivot: [-6, 22, 0], box: [0, -4, 0], uv: [40, 16], over: [40, 32], inflate: 0.25 },
    armL: { size: [4, 12, 4], pivot: [6, 22, 0], box: [0, -4, 0], uv: [32, 48], over: [48, 48], inflate: 0.25 },
    legR: { size: [4, 12, 4], pivot: [-2, 12, 0], box: [0, -6, 0], uv: [0, 16], over: [0, 32], inflate: 0.25 },
    legL: { size: [4, 12, 4], pivot: [2, 12, 0], box: [0, -6, 0], uv: [16, 48], over: [0, 48], inflate: 0.25 },
  };

  /*
   * Recorte da skin para uma caixa w × h × d com origem (u, v) no PNG:
   *   linha de cima:  [topo d×w em (u+d, v)] [base em (u+d+w, v)]
   *   linha de baixo: [lado direito em (u, v+d)] [frente em (u+d, v+d)] [lado esquerdo em (u+d+w, v+d)] [costas em (u+2d+w, v+d)]
   * Ordem das faces da BoxGeometry: +x, −x, +y, −y, +z, −z. A base vem espelhada na vertical, como no Minecraft.
   */
  function skinBox(w, h, d, u, v, inflate) {
    const geo = new THREE.BoxGeometry(w + inflate * 2, h + inflate * 2, d + inflate * 2);
    const rect = (x1, y1, x2, y2) => {
      const a = [x1 / TEX, 1 - y1 / TEX], b = [x2 / TEX, 1 - y1 / TEX];
      const c = [x1 / TEX, 1 - y2 / TEX], e = [x2 / TEX, 1 - y2 / TEX];
      return [a, b, c, e]; // cima-esq., cima-dir., baixo-esq., baixo-dir. (ordem dos vértices da face)
    };
    const left = rect(u + d + w, v + d, u + 2 * d + w, v + d + h);
    const right = rect(u, v + d, u + d, v + d + h);
    const top = rect(u + d, v, u + d + w, v + d);
    const bottom = rect(u + d + w, v + d, u + d + 2 * w, v); // espelhada
    const front = rect(u + d, v + d, u + d + w, v + d + h);
    const back = rect(u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h);
    const uv = geo.attributes.uv;
    [left, right, top, bottom, front, back].forEach((face, f) => face.forEach(([s, t], i) => uv.setXY(f * 4 + i, s, t)));
    uv.needsUpdate = true;
    return geo;
  }

  let skin = null;
  const materials = () => {
    if (!skin) {
      const tex = new THREE.TextureLoader().load(MT.SKIN);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.encoding = THREE.sRGBEncoding;
      skin = {
        base: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, alphaTest: 0.5 }),
        over: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide }),
      };
    }
    return skin;
  };

  // Plaquinha com o nome (sempre virada para a câmera)
  function nameTexture(name) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = `700 56px ${MT.FONTS.label}`;
    g.font = font;
    c.width = Math.ceil(g.measureText(name).width) + 48;
    c.height = 84;
    g.font = font;
    g.fillStyle = 'rgba(20, 14, 12, 0.6)';
    MT.roundRect(g, 0, 0, c.width, c.height, 14);
    g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(name, c.width / 2, c.height / 2 + 3);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.aspect = c.width / c.height;
    return tex;
  }

  MT.Avatar = class {
    constructor(name) {
      const m = materials();
      this.group = new THREE.Group();
      this.group.name = 'personagem';
      this.model = new THREE.Group();
      this.model.scale.setScalar(PX);
      this.group.add(this.model);
      this.parts = {};
      // tronco, cabeça e braços giram juntos a partir do quadril (inclinação ao agachar)
      this.torso = new THREE.Group();
      this.torso.position.set(0, 12, 0);
      this.model.add(this.torso);
      for (const [key, p] of Object.entries(PARTS)) {
        const joint = new THREE.Group();
        const parent = key.startsWith('leg') ? this.model : this.torso;
        joint.position.set(p.pivot[0], p.pivot[1] - (parent === this.torso ? 12 : 0), p.pivot[2]);
        parent.add(joint);
        for (const [uv, inflate, mat] of [[p.uv, 0, m.base], [p.over, p.inflate, m.over]]) {
          const mesh = new THREE.Mesh(skinBox(...p.size, uv[0], uv[1], inflate), mat);
          mesh.position.set(...p.box);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          joint.add(mesh);
        }
        this.parts[key] = joint;
      }
      this.tag = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false }));
      this.tag.position.y = 32 * PX + 0.32;
      this.tag.renderOrder = 10;
      this.group.add(this.tag);
      this.walk = 0;
      this.far = false;
      this.setName(name || '');
    }

    // Braço direito para a primeira pessoa (vai preso à câmera, como no Minecraft)
    firstPersonArm() {
      const m = materials(), p = PARTS.armR;
      const arm = new THREE.Group();
      const model = new THREE.Group();
      model.scale.setScalar(PX);
      arm.add(model);
      for (const [uv, inflate, mat] of [[p.uv, 0, m.base], [p.over, p.inflate, m.over]]) {
        const mesh = new THREE.Mesh(skinBox(...p.size, uv[0], uv[1], inflate), mat);
        mesh.position.set(0, -6, 0);
        model.add(mesh);
      }
      return arm;
    }

    // Vista aérea: o nome fica com tamanho fixo na tela e por cima das paredes, para dar para ler de longe
    setFar(on) {
      this.far = on;
      this.tag.material.sizeAttenuation = !on;
      this.tag.material.depthTest = !on;
      this.tag.material.needsUpdate = true;
      this.fitTag();
    }

    fitTag() {
      const tex = this.tag.material.map;
      if (!tex) return;
      const h = this.far ? 0.05 : 0.24;
      this.tag.scale.set(h * tex.aspect, h, 1);
    }

    setName(name) {
      if (name === this.name) return;
      this.name = name;
      const old = this.tag.material.map;
      if (old) old.dispose();
      this.tag.visible = !!name;
      if (!name) return;
      this.tag.material.map = nameTexture(name);
      this.tag.material.needsUpdate = true;
      this.fitTag();
    }

    // Jogador que saiu: libera as caixas e a plaquinha (a skin é compartilhada e fica)
    dispose() {
      this.group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      if (this.tag.material.map) this.tag.material.map.dispose();
      this.tag.material.dispose();
    }

    /*
     * s: { x, y, z (pés), yaw, pitch, speed (m/s no chão), crouch (0 a 1), onGround }
     */
    update(dt, t, s) {
      const P = this.parts;
      this.group.position.set(s.x, s.y, s.z);
      this.group.rotation.y = s.yaw + Math.PI; // o boneco olha para +z; o jogador, para −z
      const speed = s.onGround ? s.speed : 0;
      this.walk += dt * speed * 1.9;
      const amp = Math.min(1, speed / 3) * (speed > 4.5 ? 1 : 0.75);
      const swing = Math.sin(this.walk) * amp;
      // braços e pernas em oposição, como numa caminhada
      P.legR.rotation.x = swing;
      P.legL.rotation.x = -swing;
      P.armR.rotation.x = -swing * 0.9;
      P.armL.rotation.x = swing * 0.9;
      // balanço leve dos braços parado; no ar, braços um pouco abertos
      const sway = 0.04 + Math.sin(t * 1.3) * 0.03 + (s.onGround ? 0 : 0.25);
      P.armR.rotation.z = -sway;
      P.armL.rotation.z = sway;
      // agachar: tronco inclina para a frente, como no Minecraft
      const k = s.crouch || 0;
      this.torso.rotation.x = 0.5 * k;
      P.legR.rotation.x -= 0.1 * k;
      P.legL.rotation.x -= 0.1 * k;
      P.head.rotation.x = THREE.MathUtils.clamp(-s.pitch, -0.9, 0.9) - 0.5 * k;
    }
  };
})();
