/*
 * Jogador com física simples e realista:
 * gravidade 9,81 m/s², colisão cilindro × caixas, subida automática de degraus
 * de até 35 cm, pulo de ~0,8 m e corrida com Shift.
 * Câmera em primeira pessoa; F alterna para terceira pessoa (atrás do personagem, sem atravessar paredes).
 */
(function () {
  const MT = (window.MT = window.MT || {});

  const G = 9.81;
  const RADIUS = 0.32;
  const HEIGHT = 1.75;
  const CROUCH_HEIGHT = 1.15;
  const EYE = 0.1; // distância dos olhos até o topo da cabeça
  const STEP = 0.35;
  const WALK = 3.0;
  const RUN = 6.2;
  const JUMP = 4.0;
  const THIRD_DIST = 3.2; // distância da câmera em terceira pessoa
  const THIRD_UP = 0.25;  // a câmera mira um pouco acima dos olhos

  MT.Player = class {
    constructor(camera, dom) {
      this.camera = camera;
      this.dom = dom;
      const s = MT.LAYOUT.spawn;
      this.pos = new THREE.Vector3(s.x, 0.12, s.z);
      this.vel = new THREE.Vector3();
      this.yaw = s.yaw;
      this.pitch = -0.04;
      this.onGround = false;
      this.height = HEIGHT;
      this.camY = this.pos.y + HEIGHT - EYE;
      this.bob = 0;
      this.keys = {};
      this.locked = false;
      this.enabled = false;
      this.drone = { on: false, theta: 0.5, phi: 0.95, radius: 165, target: new THREE.Vector3(5, 0, -42) };
      this.sensitivity = 0.0022;
      this.view = 'first'; // 'first' ou 'third' (vê o personagem de fora)
      this.camDist = THIRD_DIST;
      this._piv = new THREE.Vector3();
      this._back = new THREE.Vector3();
      this.bind();
    }

    bind() {
      addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        if (e.code === 'Space' && this.enabled) e.preventDefault();
      });
      addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      addEventListener('blur', () => { this.keys = {}; });

      document.addEventListener('pointerlockchange', () => {
        this.locked = document.pointerLockElement === this.dom;
        if (this.onLockChange) this.onLockChange(this.locked);
      });

      document.addEventListener('mousemove', (e) => {
        if (!this.enabled) return;
        if (this.drone.on) {
          if (this.dragging) {
            this.drone.theta -= e.movementX * 0.005;
            this.drone.phi = THREE.MathUtils.clamp(this.drone.phi - e.movementY * 0.004, 0.15, 1.45);
          }
          return;
        }
        if (this.locked || this.dragging) {
          this.yaw -= e.movementX * this.sensitivity;
          this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * this.sensitivity, -1.5, 1.5);
        }
      });
      // Arrastar com o mouse funciona como alternativa ao pointer lock
      this.dom.addEventListener('mousedown', () => { this.dragging = true; });
      addEventListener('mouseup', () => { this.dragging = false; });
      this.dom.addEventListener('wheel', (e) => {
        if (!this.drone.on) return;
        e.preventDefault();
        this.drone.radius = THREE.MathUtils.clamp(this.drone.radius * (1 + Math.sign(e.deltaY) * 0.08), 30, 320);
      }, { passive: false });

      // Toque: metade esquerda move, metade direita olha
      this.touch = { move: null, look: null, mx: 0, mz: 0 };
      this.dom.addEventListener('touchstart', (e) => {
        for (const t of e.changedTouches) {
          if (t.clientX < innerWidth / 2 && !this.touch.move) this.touch.move = { id: t.identifier, x: t.clientX, y: t.clientY };
          else if (!this.touch.look) this.touch.look = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
      }, { passive: true });
      this.dom.addEventListener('touchmove', (e) => {
        for (const t of e.changedTouches) {
          const m = this.touch.move, l = this.touch.look;
          if (m && t.identifier === m.id) {
            this.touch.mx = THREE.MathUtils.clamp((t.clientX - m.x) / 60, -1, 1);
            this.touch.mz = THREE.MathUtils.clamp((t.clientY - m.y) / 60, -1, 1);
          } else if (l && t.identifier === l.id) {
            this.yaw -= (t.clientX - l.x) * 0.005;
            this.pitch = THREE.MathUtils.clamp(this.pitch - (t.clientY - l.y) * 0.005, -1.5, 1.5);
            l.x = t.clientX;
            l.y = t.clientY;
          }
        }
      }, { passive: true });
      const end = (e) => {
        for (const t of e.changedTouches) {
          if (this.touch.move && t.identifier === this.touch.move.id) { this.touch.move = null; this.touch.mx = this.touch.mz = 0; }
          if (this.touch.look && t.identifier === this.touch.look.id) this.touch.look = null;
        }
      };
      this.dom.addEventListener('touchend', end);
      this.dom.addEventListener('touchcancel', end);
    }

    lock() {
      if (this.dom.requestPointerLock) {
        try {
          const r = this.dom.requestPointerLock();
          if (r && r.catch) r.catch(() => {});
        } catch (_) { /* sem pointer lock: arrastar o mouse continua funcionando */ }
      }
    }

    teleport(x, z, yaw) {
      this.pos.set(x, this.groundAt(x, z, 50), z);
      this.vel.set(0, 0, 0);
      if (yaw !== undefined) this.yaw = yaw;
      this.camY = this.pos.y + this.height - EYE;
    }

    // ---- colisão ----
    overlapsXZ(c, x, z, r) {
      const cx = Math.max(c.minX, Math.min(x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - cx, dz = z - cz;
      return dx * dx + dz * dz < r * r;
    }

    groundAt(x, z, maxTop) {
      let gy = 0;
      for (const c of MT.colliders) {
        if (!c.enabled || c.maxY > maxTop || c.maxY <= gy) continue;
        if (this.overlapsXZ(c, x, z, RADIUS * 0.7)) gy = c.maxY;
      }
      return gy;
    }

    headroom(x, z, fromY) {
      // menor base de caixa acima de fromY sobre o jogador
      let top = Infinity;
      for (const c of MT.colliders) {
        if (!c.enabled || c.minY < fromY - 0.01 || c.minY >= top) continue;
        if (this.overlapsXZ(c, x, z, RADIUS * 0.9)) top = c.minY;
      }
      return top;
    }

    pushOut() {
      const p = this.pos;
      const feet = p.y + STEP, head = p.y + this.height;
      for (let iter = 0; iter < 3; iter++) {
        let moved = false;
        for (const c of MT.colliders) {
          if (!c.enabled || c.maxY <= feet || c.minY >= head) continue;
          const cx = Math.max(c.minX, Math.min(p.x, c.maxX));
          const cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
          let dx = p.x - cx, dz = p.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= RADIUS * RADIUS) continue;
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2), push = RADIUS - d;
            p.x += (dx / d) * push;
            p.z += (dz / d) * push;
            const nx = dx / d, nz = dz / d, vn = this.vel.x * nx + this.vel.z * nz;
            if (vn < 0) { this.vel.x -= vn * nx; this.vel.z -= vn * nz; }
          } else {
            // centro dentro da caixa: sai pelo lado mais próximo
            const opts = [
              [c.minX - RADIUS - p.x, 0], [c.maxX + RADIUS - p.x, 0],
              [0, c.minZ - RADIUS - p.z], [0, c.maxZ + RADIUS - p.z],
            ].sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
            p.x += opts[0][0];
            p.z += opts[0][1];
          }
          moved = true;
        }
        if (!moved) break;
      }
    }

    // ---- atualização ----
    update(dt, t) {
      if (this.drone.on) return this.updateDrone(dt);
      if (!this.enabled) { this.applyCamera(dt); return; }

      const k = this.keys;
      const crouch = k.ControlLeft || k.KeyC;
      const targetH = crouch ? CROUCH_HEIGHT : HEIGHT;
      if (targetH > this.height) {
        // só levanta se houver espaço
        const room = this.headroom(this.pos.x, this.pos.z, this.pos.y + this.height);
        this.height = Math.min(targetH, room - this.pos.y - 0.02, this.height + dt * 3);
      } else this.height = Math.max(targetH, this.height - dt * 3);

      let fx = 0, fz = 0;
      if (k.KeyW || k.ArrowUp) fz -= 1;
      if (k.KeyS || k.ArrowDown) fz += 1;
      if (k.KeyA || k.ArrowLeft) fx -= 1;
      if (k.KeyD || k.ArrowRight) fx += 1;
      fx += this.touch.mx;
      fz += this.touch.mz;
      const len = Math.hypot(fx, fz);
      if (len > 1) { fx /= len; fz /= len; }
      const running = (k.ShiftLeft || k.ShiftRight) && !crouch;
      const speed = crouch ? WALK * 0.5 : running ? RUN : WALK;
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const wx = (fx * cos + fz * sin) * speed;
      const wz = (-fx * sin + fz * cos) * speed;
      const accel = this.onGround ? 12 : 2;
      const a = 1 - Math.exp(-accel * dt);
      this.vel.x += (wx - this.vel.x) * a;
      this.vel.z += (wz - this.vel.z) * a;

      if (k.Space && this.onGround && this.height > HEIGHT - 0.05) {
        this.vel.y = JUMP;
        this.onGround = false;
      }

      const steps = Math.ceil(dt / (1 / 120));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) this.substep(h);

      const moving = this.onGround && Math.hypot(this.vel.x, this.vel.z) > 0.5;
      this.bob += moving ? dt * Math.hypot(this.vel.x, this.vel.z) * 2.1 : 0;
      this.applyCamera(dt, moving);
    }

    substep(dt) {
      const p = this.pos;
      const wasGround = this.onGround;

      // vertical
      this.vel.y -= G * dt;
      let ny = p.y + this.vel.y * dt;
      if (this.vel.y > 0) {
        const top = this.headroom(p.x, p.z, p.y + this.height);
        if (ny + this.height > top) { ny = top - this.height; this.vel.y = 0; }
      }
      const ground = this.groundAt(p.x, p.z, p.y + STEP);
      this.onGround = false;
      if (ny <= ground) {
        ny = ground;
        if (this.vel.y < 0) this.vel.y = 0;
        this.onGround = true;
      } else if (wasGround && this.vel.y <= 0 && p.y - ground <= STEP && p.y - ground > 0) {
        // desce degraus sem "quicar"
        ny = ground;
        this.vel.y = 0;
        this.onGround = true;
      }
      p.y = ny;

      // horizontal
      p.x += this.vel.x * dt;
      p.z += this.vel.z * dt;
      this.pushOut();
    }

    applyCamera(dt, moving) {
      const eyeTarget = this.pos.y + this.height - EYE;
      // suaviza a subida de degraus
      this.camY += (eyeTarget - this.camY) * (1 - Math.exp(-18 * dt));
      if (Math.abs(eyeTarget - this.camY) > 0.6) this.camY = eyeTarget;
      if (this.view === 'third') {
        this.thirdPerson(this.camera.position, dt);
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        return;
      }
      const bobY = moving ? Math.sin(this.bob * 2) * 0.035 : 0;
      this.camera.position.set(this.pos.x, this.camY + bobY, this.pos.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    // 0 em pé, 1 totalmente agachado
    crouchAmount() {
      return THREE.MathUtils.clamp((HEIGHT - this.height) / (HEIGHT - CROUCH_HEIGHT), 0, 1);
    }

    // Ponto pelo qual passa o raio da mira (para usar os PCs): a câmera em 1ª pessoa, acima da cabeça em 3ª
    aimOrigin(out) {
      return this.view === 'third' ? out.set(this.pos.x, this.camY + THIRD_UP, this.pos.z) : out.copy(this.camera.position);
    }

    // Pose em que a câmera deve estar agora (o PC usa para voltar ao jogador)
    cameraPose(pos, quat) {
      if (this.view === 'third') this.thirdPerson(pos, 0);
      else pos.set(this.pos.x, this.camY, this.pos.z);
      quat.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    }

    // Câmera atrás do personagem; se houver parede no caminho, ela chega mais perto
    thirdPerson(out, dt) {
      const piv = this.aimOrigin(this._piv);
      const cp = Math.cos(this.pitch);
      const back = this._back.set(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);
      let free = THIRD_DIST + 0.25;
      for (const c of MT.colliders) {
        if (c.enabled) free = Math.min(free, rayBox(piv, back, c, free));
      }
      if (back.y < 0) free = Math.min(free, (piv.y - 0.15) / -back.y); // chão do lado de fora
      const target = Math.max(0.3, Math.min(THIRD_DIST, free - 0.25));
      // aproxima na hora (para não ver através da parede) e se afasta devagar
      if (!dt || target < this.camDist) this.camDist = target;
      else this.camDist += (target - this.camDist) * (1 - Math.exp(-5 * dt));
      return out.copy(piv).addScaledVector(back, this.camDist);
    }

    setDrone(on) {
      this.drone.on = on;
      if (on) this.drone.target.set(this.pos.x * 0.3 + 0, 0, this.pos.z * 0.3 - 42 * 0.7);
    }

    updateDrone(dt) {
      const d = this.drone, k = this.keys;
      // WASD move o ponto focal no modo drone
      let fx = 0, fz = 0;
      if (k.KeyW || k.ArrowUp) fz -= 1;
      if (k.KeyS || k.ArrowDown) fz += 1;
      if (k.KeyA || k.ArrowLeft) fx -= 1;
      if (k.KeyD || k.ArrowRight) fx += 1;
      const sp = d.radius * 0.6 * dt;
      const s = Math.sin(d.theta), c = Math.cos(d.theta);
      d.target.x += (fx * c + fz * s) * sp;
      d.target.z += (-fx * s + fz * c) * sp;
      const cam = this.camera;
      cam.position.set(
        d.target.x + Math.sin(d.theta) * Math.sin(d.phi) * d.radius,
        Math.cos(d.phi) * d.radius,
        d.target.z + Math.cos(d.theta) * Math.sin(d.phi) * d.radius
      );
      cam.lookAt(d.target);
    }
  };

  // Distância ao longo do raio (origem o, direção d) até entrar na caixa c; Infinity se não cruzar antes de max
  function rayBox(o, d, c, max) {
    let t0 = 0, t1 = max;
    for (const [p, v, lo, hi] of [[o.x, d.x, c.minX, c.maxX], [o.y, d.y, c.minY, c.maxY], [o.z, d.z, c.minZ, c.maxZ]]) {
      if (Math.abs(v) < 1e-9) {
        if (p < lo || p > hi) return Infinity;
        continue;
      }
      let a = (lo - p) / v, b = (hi - p) / v;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t0 > t1) return Infinity;
    }
    return t0;
  }
})();
