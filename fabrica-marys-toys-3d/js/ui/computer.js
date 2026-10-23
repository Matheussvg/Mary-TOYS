/*
 * Computadores da TI: mirar na tela de um PC mostra a opção de usá-lo; o clique (ou E) faz um
 * close-up animado até o monitor e o SAP abre exatamente sobre a tela. "Levantar" (ou Esc) volta.
 * O SAP fica num único iframe que continua aberto entre um uso e outro (o login e o rascunho permanecem).
 */
(function () {
  const MT = (window.MT = window.MT || {});

  const UP = new THREE.Vector3(0, 1, 0);
  const ENTER_TIME = 1.5;
  const EXIT_TIME = 1.0;
  const FILL_H = 0.84; // fração da altura da janela ocupada pela tela no close-up
  const FILL_W = 0.92;
  const MIN_W = 640, MIN_H = 360; // abaixo disso (celular) o SAP ocupa a janela inteira
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Endereço do SAP: o servidor (sap/server.js) informa em window.MT_SAP_URL; aberto como arquivo, usa a cópia em ../sap/public
  MT.sapUrl = () => window.MT_SAP_URL || MT.TI.sapUrl || '../sap/public/index.html';

  MT.Computer = class {
    constructor(camera, player, dom) {
      this.camera = camera;
      this.player = player;
      this.dom = dom;
      this.state = 'idle'; // idle → enter → using → exit → idle
      this.hover = null;
      this.cur = null;
      this.ignore = null; // PC de onde o jogador acabou de levantar: só volta a valer depois que a mira sair dele
      this.redraw = false; // com o SAP aberto a cena fica parada e só é redesenhada quando isto pede
      this.t = 0;
      this.from = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
      this.to = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
      this.ctrl = new THREE.Vector3();
      this.dir = new THREE.Vector3();
      this.v = new THREE.Vector3();
      this.m = new THREE.Matrix4();
      this.o = new THREE.Vector3();
      this.sapTex = MT.screenTexture('sap');
      this.boot = MT.bootScreen();
      const $ = (id) => document.getElementById(id);
      this.el = { hint: $('pc-hint'), hintName: $('pc-hint-name'), screen: $('pc-screen'), bar: $('pc-bar'), barName: $('pc-bar-name'), exit: $('pc-exit') };

      dom.addEventListener('mousedown', (e) => {
        if (e.button === 0 && this.canUse()) this.enter(this.hover);
      });
      this.el.hint.addEventListener('click', () => { if (this.canUse()) this.enter(this.hover); });
      this.el.exit.addEventListener('click', () => this.exit());
      addEventListener('keydown', (e) => {
        if (e.code === 'KeyE' && !e.repeat && this.canUse()) this.enter(this.hover);
        else if (e.code === 'Escape' && this.state === 'using') this.exit();
      });
    }

    get busy() { return this.state !== 'idle'; }

    canUse() {
      return this.state === 'idle' && !!this.hover && this.player.enabled && !this.player.drone.on;
    }

    // Procura o PC para onde a mira aponta (só na sala da TI em que o jogador está)
    hoverCheck() {
      const p = this.player, cam = this.camera;
      let best = null;
      if (p.enabled && !p.drone.on) {
        const a = MT.areaAt(p.pos.x, p.pos.z);
        if (a && a.dept === 'ti') {
          cam.getWorldDirection(this.dir);
          const o = p.aimOrigin(this.o); // em 3ª pessoa a mira passa acima da cabeça do personagem
          let bestAng = Infinity;
          for (const c of MT.computers) {
            if (c.room !== a.id) continue;
            this.v.subVectors(c.center, o);
            const dist = this.v.length();
            if (dist > MT.TI.reach || this.v.dot(c.normal) > 0) continue; // longe ou atrás da tela
            const ang = this.dir.angleTo(this.v);
            if (ang < Math.atan2(c.w * 0.5 + 0.06, dist) && ang < bestAng) {
              best = c;
              bestAng = ang;
            }
          }
        }
      }
      if (best && best === this.ignore) best = null;
      else this.ignore = null;
      this.setHover(best);
    }

    setHover(c) {
      if (c === this.hover) return;
      if (this.hover && this.hover !== this.cur) this.hover.mesh.material.map = this.hover.baseMap;
      this.hover = c;
      document.body.classList.toggle('pc-hover', !!c);
      this.el.hint.hidden = !c;
      if (!c) return;
      c.mesh.material.map = this.sapTex; // a tela "acorda" no SAP
      this.el.hintName.textContent = `${c.name} · ${c.roomName}`;
      this.ensureFrame(); // já vai carregando o SAP
    }

    ensureFrame() {
      if (this.frame) return;
      const f = (this.frame = document.createElement('iframe'));
      f.title = "SAP · Mery's Toys";
      f.src = MT.sapUrl();
      f.addEventListener('load', () => {
        this.el.screen.classList.add('ready');
        // Mesmo endereço: Esc dentro do SAP também levanta (se não houver diálogo aberto)
        try {
          f.contentWindow.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === 'using' && !f.contentDocument.querySelector('dialog[open]')) this.exit();
          });
        } catch (_) { /* SAP em outro endereço: use o botão Levantar */ }
      });
      this.el.screen.appendChild(f);
    }

    // Abre um PC sem precisar andar até ele (menu e endereço #sap)
    openNow(c) {
      const p = this.player;
      p.teleport(c.stand.x, c.stand.z, c.stand.yaw);
      p.pitch = -0.25;
      p.applyCamera(0);
      this.enter(c);
    }

    enter(c) {
      if (this.state !== 'idle' || !c) return;
      const p = this.player, cam = this.camera;
      this.setHover(null);
      this.cur = c;
      this.state = 'enter';
      this.t = 0;
      p.enabled = false;
      p.keys = {};
      p.dragging = false;
      if (document.pointerLockElement) document.exitPointerLock();
      document.body.classList.add('pc-mode');
      this.from.pos.copy(cam.position);
      this.from.quat.copy(cam.quaternion);
      this.aim();
      // a curva chega de frente para a tela, como quem senta e se aproxima do monitor
      this.ctrl.copy(this.to.pos).addScaledVector(c.normal, this.from.pos.distanceTo(this.to.pos) * 0.6);
      this.ctrl.y = Math.max(this.from.pos.y, this.to.pos.y);
      c.mesh.material.map = this.boot;
      this.boot.draw(0);
      this.ensureFrame();
      this.el.barName.textContent = `${c.name} · ${c.roomName}`;
    }

    // Posição da câmera em que a tela preenche a janela (com uma margem para a moldura aparecer)
    aim() {
      const c = this.cur, cam = this.camera;
      const th = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
      const d = Math.max(c.h / (2 * th * FILL_H), c.w / (2 * th * cam.aspect * FILL_W));
      this.to.pos.copy(c.center).addScaledVector(c.normal, d);
      this.m.lookAt(this.to.pos, c.center, UP);
      this.to.quat.setFromRotationMatrix(this.m);
    }

    update(dt) {
      if (this.state !== 'enter' && this.state !== 'exit') return;
      const cam = this.camera;
      this.t = Math.min(1, this.t + dt / (this.state === 'enter' ? ENTER_TIME : EXIT_TIME));
      const e = ease(this.t), u = 1 - e;
      cam.position
        .copy(this.from.pos).multiplyScalar(u * u)
        .addScaledVector(this.ctrl, 2 * u * e)
        .addScaledVector(this.to.pos, e * e);
      cam.quaternion.copy(this.from.quat).slerp(this.to.quat, e);
      if (this.state === 'enter') this.boot.draw(this.t);
      if (this.t >= 1) {
        if (this.state === 'enter') this.open();
        else this.done();
      }
    }

    open() {
      this.state = 'using';
      this.place();
      this.el.screen.hidden = false;
      this.el.bar.hidden = false;
      this.redraw = true;
      if (this.frame) this.frame.focus();
    }

    // Encaixa o iframe exatamente sobre a tela do monitor projetada na janela
    place() {
      const c = this.cur, cam = this.camera, s = this.el.screen.style;
      cam.updateMatrixWorld();
      const W = this.dom.clientWidth, H = this.dom.clientHeight;
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) {
        this.v.set(sx * c.w, sy * c.h, 0).applyMatrix4(c.mesh.matrixWorld).project(cam);
        const px = ((this.v.x + 1) / 2) * W, py = ((1 - this.v.y) / 2) * H;
        x1 = Math.min(x1, px); x2 = Math.max(x2, px);
        y1 = Math.min(y1, py); y2 = Math.max(y2, py);
      }
      const full = x2 - x1 < MIN_W || y2 - y1 < MIN_H;
      this.el.screen.classList.toggle('full', full);
      if (full) {
        s.left = s.top = s.width = s.height = '';
      } else {
        s.left = Math.round(x1) + 'px';
        s.top = Math.round(y1) + 'px';
        s.width = Math.round(x2 - x1) + 'px';
        s.height = Math.round(y2 - y1) + 'px';
      }
    }

    exit() {
      if (this.state !== 'using') return;
      const p = this.player, cam = this.camera, c = this.cur;
      this.state = 'exit';
      this.t = 0;
      this.el.screen.hidden = true;
      this.el.bar.hidden = true;
      if (this.frame) this.frame.blur();
      window.focus(); // as teclas voltam para o simulador
      c.mesh.material.map = c.baseMap;
      this.ignore = c;
      this.from.pos.copy(cam.position);
      this.from.quat.copy(cam.quaternion);
      p.cameraPose(this.to.pos, this.to.quat);
      this.ctrl.copy(this.from.pos).addScaledVector(c.normal, this.from.pos.distanceTo(this.to.pos) * 0.6);
      this.ctrl.y = Math.max(this.from.pos.y, this.to.pos.y);
      p.lock(); // ainda dentro do clique: o navegador só prende o mouse com um gesto do usuário
    }

    done() {
      this.state = 'idle';
      this.cur = null;
      document.body.classList.remove('pc-mode');
      this.player.enabled = true;
    }

    onResize() {
      if (this.state === 'enter') this.aim();
      if (this.state !== 'using') return;
      this.aim();
      this.camera.position.copy(this.to.pos);
      this.camera.quaternion.copy(this.to.quat);
      this.place();
      this.redraw = true;
    }
  };
})();
